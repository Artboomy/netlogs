import Port = chrome.runtime.Port;
import { defaultSettings } from 'controllers/settings/base';

export type JiraCreateMessage = {
    type: 'jira.createIssue';
    requestId: string;
    data: string;
};

export type JiraGetMetadataMessage = {
    type: 'jira.getMetadata';
    requestId: string;
};

export type JiraTestMessage = {
    type: 'jira.testSettings';
    requestId: string;
};

export type JiraResponseMessage = {
    type: 'jira.response';
    requestId: string;
    data: string;
};

export type JiraIssuePayload = {
    summary: string;
    description: string;
    issueType?: string;
    harZipData?: string;
    harFileName?: string;
    attachScreenshot?: boolean;
    tabId?: number;
    pageState?: string;
    template?: string;
    fields?: Record<string, unknown>;
};

export type JiraIssueResponse = {
    ok: boolean;
    key?: string;
    url?: string;
    error?: string;
    details?: {
        url: string;
        project: string;
        issueType: string;
        status?: number;
        statusText?: string;
        response?: unknown;
    };
};

export function normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, '');
}

export async function getJiraSettings() {
    const { settings } = await chrome.storage.local.get({
        settings: JSON.stringify(defaultSettings)
    });
    const parsed = JSON.parse(settings);
    return {
        ...defaultSettings.jira,
        ...(parsed.jira || {})
    };
}

export function createJiraError(
    error: string,
    details?: JiraIssueResponse['details']
): JiraResponseMessage['data'] {
    return JSON.stringify({ ok: false, error, details });
}

export async function handleJiraCreateIssue(
    port: Port,
    message: JiraCreateMessage,
    debuggerAttachedMap: Record<number, boolean>,
    incomingTabId?: number
) {
    const payload = JSON.parse(message.data) as JiraIssuePayload;
    const jiraSettings = await getJiraSettings();

    const apiVersion = jiraSettings.apiVersion || '2';
    const baseUrl = jiraSettings.baseUrl
        ? normalizeBaseUrl(jiraSettings.baseUrl)
        : '';
    const endpoint = `${baseUrl}/rest/api/${apiVersion}/issue`;
    const issueType = payload.issueType || jiraSettings.issueType || 'Task';
    const project = jiraSettings.projectKey;
    const tabId = payload.tabId ?? incomingTabId;

    const details: JiraIssueResponse['details'] = {
        url: endpoint,
        project,
        issueType
    };

    if (!baseUrl || !jiraSettings.apiToken || !project) {
        port.postMessage({
            type: 'jira.response',
            requestId: message.requestId,
            data: createJiraError(
                'Missing Jira settings. Check base URL, token, and project key.',
                details
            )
        } satisfies JiraResponseMessage);
        return;
    }

    let description = payload.description;

    if (tabId !== undefined) {
        let stateData: Record<string, string> = {};
        const wasAttached = !!debuggerAttachedMap[tabId];
        try {
            if (!wasAttached) {
                await chrome.debugger.attach({ tabId }, '1.3');
            }

            const expression = `
            (() => {
                try {
                    const data = {
                        location: location.href,
                        title: document.title,
                        referrer: document.referrer,
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language,
                        languages: navigator.languages,
                        screenWidth: screen.width,
                        screenHeight: screen.height,
                        innerWidth: window.innerWidth,
                        innerHeight: window.innerHeight,
                        devicePixelRatio: window.devicePixelRatio,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };
                    return JSON.stringify(data);
                } catch (e) {
                    return JSON.stringify({ error: String(e) });
                }
            })()
        `;

            const evalResult = (await chrome.debugger.sendCommand(
                { tabId },
                'Runtime.evaluate',
                { expression, returnByValue: true }
            )) as { result: { value: string } };

            if (evalResult?.result?.value) {
                stateData = JSON.parse(evalResult.result.value);
                payload.pageState = JSON.stringify(stateData, null, 2);
            }

            const now = new Date();
            const timezone =
                'GMT' +
                (now.getTimezoneOffset() > 0 ? '-' : '+') +
                Math.abs(now.getTimezoneOffset() / 60);
            const timestamp = `${now.toLocaleString()}.${now.getMilliseconds()} (${timezone})`;

            description = (payload.template || description)
                .replace('$site$', stateData.location || '')
                .replace('$timestamp$', timestamp)
                .replace(
                    '$service_info$',
                    [
                        `userAgent: ${stateData.userAgent || ''}`,
                        `title: ${stateData.title || ''}`
                    ].join('\n')
                );

            if (!wasAttached && !payload.attachScreenshot) {
                await chrome.debugger.detach({ tabId });
            }
        } catch (e) {
            console.error('Failed to gather state data', e);
            if (!wasAttached) {
                try {
                    await chrome.debugger.detach({ tabId });
                } catch (_detachError) {
                    // ignore
                }
            }
        }
    }

    const body = {
        fields: {
            project: { key: project },
            summary: payload.summary,
            description: description,
            issuetype: { name: issueType },
            ...(payload.fields || {})
        }
    };
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jiraSettings.apiToken}`
            },
            body: JSON.stringify(body)
        });

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage =
                responseBody?.errorMessages?.join(', ') ||
                responseBody?.errors?.summary ||
                response.statusText ||
                'Jira request failed';

            if (tabId !== undefined) {
                const wasAttached = !!debuggerAttachedMap[tabId];
                if (!wasAttached) {
                    try {
                        await chrome.debugger.detach({ tabId });
                    } catch (_e) {
                        /* ignore */
                    }
                }
            }

            port.postMessage({
                type: 'jira.response',
                requestId: message.requestId,
                data: createJiraError(errorMessage, {
                    ...details,
                    status: response.status,
                    statusText: response.statusText,
                    response: responseBody
                })
            } satisfies JiraResponseMessage);
            return;
        }
        const issueKey = responseBody?.key as string | undefined;
        const issueUrl = issueKey ? `${baseUrl}/browse/${issueKey}` : undefined;

        if (issueKey && payload.attachScreenshot && tabId !== undefined) {
            try {
                const wasAttached = !!debuggerAttachedMap[tabId];

                // If it was already attached (e.g. for stateData gathering), we don't need to attach again
                // but we should check if it's still attached (it should be if we didn't detach it)

                const result = (await chrome.debugger.sendCommand(
                    { tabId },
                    'Page.captureScreenshot',
                    { format: 'png' }
                )) as { data: string };

                if (!wasAttached) {
                    await chrome.debugger.detach({ tabId });
                }

                const base64Data = result.data;
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const screenshotBlob = new Blob([bytes], {
                    type: 'image/png'
                });

                const formData = new FormData();
                formData.append('file', screenshotBlob, 'screenshot.png');

                await fetch(
                    `${baseUrl}/rest/api/${apiVersion}/issue/${issueKey}/attachments`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Atlassian-Token': 'no-check',
                            Authorization: `Bearer ${jiraSettings.apiToken}`
                        },
                        body: formData
                    }
                );
            } catch (cdpError) {
                console.error('Failed to capture screenshot via CDP', cdpError);
                // Ensure we detach if we were the ones who attached
                const wasAttached = !!debuggerAttachedMap[tabId];
                if (!wasAttached) {
                    try {
                        await chrome.debugger.detach({ tabId });
                    } catch (_e) {
                        /* ignore */
                    }
                }
            }
        }

        if (issueKey && payload.harZipData) {
            try {
                const base64Data = payload.harZipData.split(',')[1];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const zipBlob = new Blob([bytes], { type: 'application/zip' });

                const formData = new FormData();
                formData.append(
                    'file',
                    zipBlob,
                    payload.harFileName || `netlogs_${issueKey}.har.zip`
                );

                await fetch(
                    `${baseUrl}/rest/api/${apiVersion}/issue/${issueKey}/attachments`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Atlassian-Token': 'no-check',
                            Authorization: `Bearer ${jiraSettings.apiToken}`
                        },
                        body: formData
                    }
                );
            } catch (attachError) {
                console.error('Failed to attach HAR', attachError);
                // We don't fail the whole request if attachment fails,
                // but maybe we should add info to the response
            }
        }

        if (issueKey && payload.pageState) {
            try {
                const metaBlob = new Blob([payload.pageState], {
                    type: 'text/plain'
                });
                const formData = new FormData();
                formData.append('file', metaBlob, 'meta.txt');

                await fetch(
                    `${baseUrl}/rest/api/${apiVersion}/issue/${issueKey}/attachments`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Atlassian-Token': 'no-check',
                            Authorization: `Bearer ${jiraSettings.apiToken}`
                        },
                        body: formData
                    }
                );
            } catch (metaError) {
                console.error('Failed to attach meta.txt', metaError);
            }
        }

        const successResponse: JiraIssueResponse = {
            ok: true,
            key: issueKey,
            url: issueUrl
        };

        if (jiraSettings.openTicketInNewTab && issueUrl) {
            chrome.tabs.create({ url: issueUrl });
        }

        port.postMessage({
            type: 'jira.response',
            requestId: message.requestId,
            data: JSON.stringify(successResponse)
        } satisfies JiraResponseMessage);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Jira request failed';
        port.postMessage({
            type: 'jira.response',
            requestId: message.requestId,
            data: createJiraError(errorMessage)
        } satisfies JiraResponseMessage);
    }
}

export async function handleJiraTestSettings(
    message: JiraTestMessage,
    sendResponse?: (response: JiraResponseMessage['data']) => void,
    port?: Port
) {
    const jiraSettings = await getJiraSettings();

    const apiVersion = jiraSettings.apiVersion || '2';
    const baseUrl = jiraSettings.baseUrl
        ? normalizeBaseUrl(jiraSettings.baseUrl)
        : '';
    const endpoint = `${baseUrl}/rest/api/${apiVersion}/myself`;

    const details: JiraIssueResponse['details'] = {
        url: endpoint,
        project: jiraSettings.projectKey,
        issueType: jiraSettings.issueType || 'Task'
    };

    const respond = (data: JiraResponseMessage['data']) => {
        if (port) {
            port.postMessage({
                type: 'jira.response',
                requestId: message.requestId,
                data
            } satisfies JiraResponseMessage);
        } else if (sendResponse) {
            sendResponse(data);
        }
    };

    if (!baseUrl || !jiraSettings.apiToken) {
        respond(
            createJiraError(
                'Missing Jira settings. Check base URL and token.',
                details
            )
        );
        return;
    }

    try {
        const authHeader = `Bearer ${jiraSettings.apiToken}`;

        // 1. Test Authentication
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader
            }
        });

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage =
                responseBody?.errorMessages?.join(', ') ||
                response.statusText ||
                'jira_testAuthFailed';

            respond(
                createJiraError(errorMessage, {
                    ...details,
                    status: response.status,
                    statusText: response.statusText,
                    response: responseBody
                })
            );
            return;
        }

        // 2. Check Project existence
        const projectKey = jiraSettings.projectKey;
        if (projectKey) {
            const projectEndpoint = `${baseUrl}/rest/api/${apiVersion}/project/${projectKey}`;
            const projectResponse = await fetch(projectEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authHeader
                }
            });

            if (!projectResponse.ok) {
                const projectBody = await projectResponse
                    .json()
                    .catch(() => ({}));
                respond(
                    createJiraError('jira_testProjectNotFound', {
                        ...details,
                        url: projectEndpoint,
                        status: projectResponse.status,
                        statusText: projectResponse.statusText,
                        response: projectBody
                    })
                );
                return;
            }
        }

        // 3. Check Issue Type existence
        const issueType = jiraSettings.issueType || 'Task';
        const issueTypeEndpoint = `${baseUrl}/rest/api/${apiVersion}/issuetype`;
        const issueTypeResponse = await fetch(issueTypeEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader
            }
        });

        if (issueTypeResponse.ok) {
            const issueTypes = await issueTypeResponse.json().catch(() => []);
            if (Array.isArray(issueTypes)) {
                const found = issueTypes.some(
                    (it: { name: string }) => it.name === issueType
                );
                if (!found) {
                    respond(
                        createJiraError('jira_testIssueTypeNotFound', {
                            ...details,
                            url: issueTypeEndpoint,
                            status: 200,
                            response: issueTypes
                        })
                    );
                    return;
                }
            }
        }

        respond(JSON.stringify({ ok: true }));
    } catch (e) {
        respond(createJiraError(String(e), details));
    }
}

let metadataCache: {
    projectKey: string;
    issueType: string;
    baseUrl: string;
    fields: {
        key: string;
        name: string;
        type: string | undefined;
        allowedValues: { id: string; value: string | undefined }[] | undefined;
    }[];
} | null = null;

export async function handleJiraGetMetadata(
    message: JiraGetMetadataMessage,
    port: Port
) {
    const jiraSettings = await getJiraSettings();

    const apiVersion = jiraSettings.apiVersion || '2';
    const baseUrl = jiraSettings.baseUrl
        ? normalizeBaseUrl(jiraSettings.baseUrl)
        : '';
    const projectKey = jiraSettings.projectKey;
    const issueType = jiraSettings.issueType || 'Task';

    const respond = (data: string) => {
        port.postMessage({
            type: 'jira.response',
            requestId: message.requestId,
            data
        } satisfies JiraResponseMessage);
    };

    if (!baseUrl || !jiraSettings.apiToken || !projectKey) {
        respond(createJiraError('Missing Jira settings.'));
        return;
    }

    if (
        metadataCache &&
        metadataCache.projectKey === projectKey &&
        metadataCache.issueType === issueType &&
        metadataCache.baseUrl === baseUrl
    ) {
        respond(JSON.stringify({ ok: true, fields: metadataCache.fields }));
        return;
    }

    try {
        const authHeader = `Bearer ${jiraSettings.apiToken}`;

        // 1. Get Project to find issueTypeId
        const projectResponse = await fetch(
            `${baseUrl}/rest/api/${apiVersion}/project/${projectKey}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authHeader
                }
            }
        );

        if (!projectResponse.ok) {
            const projectBody = await projectResponse.json().catch(() => ({}));
            respond(
                createJiraError(
                    projectBody?.errorMessages?.join(', ') ||
                        projectResponse.statusText ||
                        'Failed to fetch project details'
                )
            );
            return;
        }

        const projectData = (await projectResponse.json()) as {
            issueTypes: { id: string; name: string }[];
        };
        const targetIssueType = projectData.issueTypes.find(
            (it) => it.name === issueType
        );

        if (!targetIssueType) {
            respond(
                createJiraError(
                    `Issue type "${issueType}" not found in project "${projectKey}"`
                )
            );
            return;
        }

        const issueTypeId = targetIssueType.id;

        // 2. Get Metadata for the specific project and issue type
        const metaUrl = `${baseUrl}/rest/api/${apiVersion}/issue/createmeta/${projectKey}/issuetypes/${issueTypeId}`;
        const metaResponse = await fetch(metaUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader
            }
        });

        const metaBody = await metaResponse.json().catch(() => ({}));

        if (!metaResponse.ok) {
            respond(
                createJiraError(
                    metaBody?.errorMessages?.join(', ') ||
                        metaResponse.statusText ||
                        'Failed to fetch metadata'
                )
            );
            return;
        }

        // The response for /rest/api/2/issue/createmeta/{projectKey}/issuetypes/{issueTypeId}
        // is FieldCreateMetaBeans, which contains a "fields" property.
        const fields = (metaBody.fields || []) as Array<{
            required: boolean;
            hasDefaultValue?: boolean;
            name: string;
            key: string;
            schema?: { type: string };
            allowedValues?: { id: string; value?: string; name?: string }[];
        }>;

        const requiredFields = fields
            .filter((field) => {
                return (
                    field.required &&
                    !field.hasDefaultValue &&
                    field.key !== 'project' &&
                    field.key !== 'issuetype' &&
                    field.key !== 'summary' &&
                    field.key !== 'description'
                );
            })
            .map((field) => {
                return {
                    key: field.key,
                    name: field.name,
                    type: field.schema?.type,
                    allowedValues: field.allowedValues?.map(
                        (v: { id: string; value?: string; name?: string }) => ({
                            id: v.id,
                            value: v.value || v.name
                        })
                    )
                };
            });

        metadataCache = {
            projectKey,
            issueType,
            baseUrl,
            fields: requiredFields
        };

        respond(JSON.stringify({ ok: true, fields: requiredFields }));
    } catch (e) {
        respond(createJiraError(String(e)));
    }
}
