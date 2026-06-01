import Port = chrome.runtime.Port;
import { defaultSettings } from 'controllers/settings/base';
import { ISettings } from 'controllers/settings/types';

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
    missingFields?: string[];
    details?: {
        url: string;
        project: string;
        issueType: string;
        status?: number;
        statusText?: string;
        response?: unknown;
    };
};

export type JiraDebugLogLevel = 'info' | 'warn' | 'error';

export type JiraDebugLogger = (
    level: JiraDebugLogLevel,
    message: string,
    details?: Record<string, unknown>
) => void;

const MASKED_PERSONAL_ACCESS_TOKEN = '<masked-personal-access-token>';

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskString(value: string, personalAccessToken?: string): string {
    if (!personalAccessToken) {
        return value;
    }

    const masks = [personalAccessToken, encodeURIComponent(personalAccessToken)]
        .filter(Boolean)
        .map(escapeRegExp);

    if (!masks.length) {
        return value;
    }

    return value.replace(
        new RegExp(masks.join('|'), 'g'),
        MASKED_PERSONAL_ACCESS_TOKEN
    );
}

function maskPersonalAccessToken<T>(value: T, personalAccessToken?: string): T {
    if (!personalAccessToken || value === undefined || value === null) {
        return value;
    }
    if (typeof value === 'string') {
        return maskString(value, personalAccessToken) as T;
    }
    if (Array.isArray(value)) {
        return value.map((item) =>
            maskPersonalAccessToken(item, personalAccessToken)
        ) as T;
    }
    if (typeof value === 'object') {
        return Object.entries(value).reduce<Record<string, unknown>>(
            (acc, [key, item]) => {
                acc[key] = maskPersonalAccessToken(item, personalAccessToken);
                return acc;
            },
            {}
        ) as T;
    }
    return value;
}

function headersToRecord(
    headers?: HeadersInit | Headers,
    personalAccessToken?: string
): Record<string, string> {
    if (!headers) {
        return {};
    }

    const result: Record<string, string> = {};
    const addHeader = (key: string, value: unknown) => {
        result[key] =
            key.toLowerCase() === 'authorization'
                ? '<redacted>'
                : maskString(String(value), personalAccessToken);
    };

    if (headers instanceof Headers) {
        headers.forEach((value, key) => addHeader(key, value));
    } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => addHeader(key, value));
    } else {
        Object.entries(headers).forEach(([key, value]) =>
            addHeader(key, value)
        );
    }

    return result;
}

function serializeRequestBody(body: BodyInit | null | undefined): unknown {
    if (!body) {
        return undefined;
    }
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return body;
        }
    }
    if (body instanceof FormData) {
        const entries: Array<{
            key: string;
            value: string | { name: string; type: string; size: number };
        }> = [];
        body.forEach((value, key) => {
            entries.push({
                key,
                value:
                    value instanceof File
                        ? {
                              name: value.name,
                              type: value.type,
                              size: value.size
                          }
                        : String(value)
            });
        });
        return entries;
    }
    if (body instanceof Blob) {
        return { type: body.type, size: body.size };
    }
    return Object.prototype.toString.call(body);
}

async function readResponseBody(response: Response): Promise<unknown> {
    const text = await response
        .clone()
        .text()
        .catch(() => '');
    if (!text) {
        return undefined;
    }
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function jiraFetch(
    url: string,
    init: RequestInit,
    debugLogger: JiraDebugLogger | undefined,
    label: string,
    personalAccessToken?: string
): Promise<Response> {
    const startedAt = Date.now();
    debugLogger?.('info', `Jira API request: ${label}`, {
        url: maskString(url, personalAccessToken),
        method: init.method || 'GET',
        headers: headersToRecord(init.headers, personalAccessToken),
        body: maskPersonalAccessToken(
            serializeRequestBody(init.body),
            personalAccessToken
        )
    });

    try {
        const response = await fetch(url, init);
        debugLogger?.(
            response.ok ? 'info' : 'warn',
            `Jira API response: ${label}`,
            {
                url: maskString(url, personalAccessToken),
                method: init.method || 'GET',
                request: {
                    headers: headersToRecord(init.headers, personalAccessToken),
                    body: maskPersonalAccessToken(
                        serializeRequestBody(init.body),
                        personalAccessToken
                    )
                },
                status: response.status,
                statusText: maskString(
                    response.statusText,
                    personalAccessToken
                ),
                headers: headersToRecord(response.headers, personalAccessToken),
                body: maskPersonalAccessToken(
                    await readResponseBody(response),
                    personalAccessToken
                ),
                durationMs: Date.now() - startedAt
            }
        );
        return response;
    } catch (error) {
        debugLogger?.('error', `Jira API error: ${label}`, {
            url: maskString(url, personalAccessToken),
            method: init.method || 'GET',
            request: {
                headers: headersToRecord(init.headers, personalAccessToken),
                body: maskPersonalAccessToken(
                    serializeRequestBody(init.body),
                    personalAccessToken
                )
            },
            durationMs: Date.now() - startedAt,
            error: maskString(
                error instanceof Error ? error.message : String(error),
                personalAccessToken
            )
        });
        throw error;
    }
}

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

export type JiraV2UserPickerResponse = {
    users: Array<{
        name: string;
        key?: string;
        html: string;
        displayName: string;
        accountId?: string;
    }>;
    total: number;
    header: string;
};

const isJiraCloud = (baseUrl: string): boolean => {
    try {
        const host = new URL(baseUrl).hostname.toLowerCase();
        return host.endsWith('.atlassian.net');
    } catch {
        // If baseUrl is malformed, default to non-cloud behavior.
        return false;
    }
};

const toBasicAuth = (usernameOrEmail: string, apiToken: string): string => {
    // btoa expects latin1; encode UTF-8 safely
    const raw = `${usernameOrEmail}:${apiToken}`;
    const utf8 = new TextEncoder().encode(raw);
    let bin = '';
    utf8.forEach((b) => (bin += String.fromCharCode(b)));
    return `Basic ${btoa(bin)}`;
};

const getAuthFields = (
    method: 'GET' | 'POST',
    jiraSettings: ISettings['jira'],
    contentType?: string
): RequestInit => {
    const useBasic = isJiraCloud(jiraSettings.baseUrl);

    // For Jira Cloud: Basic auth = email/username + API token
    // For Server/DC: Bearer = PAT (or whatever token your instance expects)
    const authorization = useBasic
        ? toBasicAuth(jiraSettings.user, jiraSettings.apiToken)
        : `Bearer ${jiraSettings.apiToken}`;

    return {
        method,
        credentials: 'omit',
        headers: {
            Authorization: authorization,
            'X-Atlassian-Token': 'no-check',
            ...(contentType && { 'Content-Type': contentType })
        }
    };
};

async function resolveAssigneeAccountId(
    jiraSettings: ISettings['jira'],
    baseUrl: string,
    projectKey: string,
    debugLogger?: JiraDebugLogger
): Promise<{ name: string } | { id: string } | undefined> {
    const assigneeEmail = jiraSettings.user?.trim();
    if (!assigneeEmail) {
        return undefined;
    }

    const apiVersion = jiraSettings.apiVersion || '2';
    const query = encodeURIComponent(assigneeEmail);

    if (apiVersion === '2') {
        // Jira API v2: use user/picker endpoint
        const url = `${baseUrl}/rest/api/2/user/picker?query=${query}`;
        const response = await jiraFetch(
            url,
            {
                ...getAuthFields('GET', jiraSettings, 'application/json')
            },
            debugLogger,
            'resolve assignee (API v2 user picker)',
            jiraSettings.apiToken
        );

        if (!response.ok) {
            return undefined;
        }

        const data = (await response.json().catch(() => ({
            users: []
        }))) as JiraV2UserPickerResponse;

        if (
            !data.users ||
            !Array.isArray(data.users) ||
            data.users.length === 0
        ) {
            return undefined;
        }

        const firstUser = data.users[0];
        if (firstUser?.name) {
            return { name: firstUser?.name };
        }
        return firstUser?.accountId ? { id: firstUser?.accountId } : undefined;
    }

    // Jira API v3: use multiProjectSearch endpoint
    const project = encodeURIComponent(projectKey);
    const url = `${baseUrl}/rest/api/3/user/assignable/multiProjectSearch?projectKeys=${project}&query=${query}`;
    const response = await jiraFetch(
        url,
        {
            ...getAuthFields('GET', jiraSettings, 'application/json')
        },
        debugLogger,
        'resolve assignee (API v3 assignable users)',
        jiraSettings.apiToken
    );

    if (!response.ok) {
        return undefined;
    }

    const users = (await response.json().catch(() => [])) as Array<{
        accountId?: string;
        emailAddress?: string;
    }>;

    if (!Array.isArray(users)) {
        return undefined;
    }

    const exactMatch = users.find(
        (user) =>
            user.emailAddress?.toLowerCase() === assigneeEmail.toLowerCase()
    );

    const accountId = exactMatch?.accountId || users[0]?.accountId;
    return accountId ? { id: accountId } : undefined;
}

export async function handleJiraCreateIssue(
    port: Port,
    message: JiraCreateMessage,
    debuggerAttachedMap: Record<number, boolean>,
    incomingTabId?: number,
    debugLogger?: JiraDebugLogger
) {
    const payload = JSON.parse(message.data) as JiraIssuePayload;
    const jiraSettings = await getJiraSettings();

    debugLogger?.('info', 'Jira create issue started', {
        requestId: message.requestId,
        projectKey: jiraSettings.projectKey,
        issueType: payload.issueType || jiraSettings.issueType || 'Task',
        hasHarAttachment: !!payload.harZipData,
        attachScreenshot: !!payload.attachScreenshot,
        hasCustomFields: !!payload.fields
    });

    const apiVersion = jiraSettings.apiVersion || '2';
    const baseUrl = jiraSettings.baseUrl
        ? normalizeBaseUrl(jiraSettings.baseUrl)
        : '';
    const createIssueEndpoint = `${baseUrl}/rest/api/${apiVersion}/issue`;
    const issueType = payload.issueType || jiraSettings.issueType || 'Task';
    const project = jiraSettings.projectKey;
    const tabId = payload.tabId ?? incomingTabId;

    const details: JiraIssueResponse['details'] = {
        url: createIssueEndpoint,
        project,
        issueType
    };

    if (!baseUrl || !jiraSettings.apiToken || !project) {
        debugLogger?.('error', 'Jira create issue aborted: missing settings', {
            hasBaseUrl: !!baseUrl,
            hasApiToken: !!jiraSettings.apiToken,
            hasProject: !!project
        });
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
        debugLogger?.('info', 'Collecting tab state for Jira ticket', {
            tabId
        });
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
            debugLogger?.(
                'error',
                'Failed to gather tab state for Jira ticket',
                {
                    tabId,
                    error: e instanceof Error ? e.message : String(e)
                }
            );
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

    debugLogger?.('info', 'Resolving Jira assignee');
    const assignee = await resolveAssigneeAccountId(
        jiraSettings,
        baseUrl,
        project,
        debugLogger
    );
    const assigneeField = assignee ? { assignee } : {};
    const body = {
        fields: {
            project: { key: project },
            summary: payload.summary,
            description: description,
            issuetype: { name: issueType },
            ...assigneeField,
            ...(payload.fields || {})
        }
    };
    try {
        const response = await jiraFetch(
            createIssueEndpoint,
            {
                ...getAuthFields('POST', jiraSettings, 'application/json'),
                body: JSON.stringify(body)
            },
            debugLogger,
            'create issue',
            jiraSettings.apiToken
        );

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage =
                responseBody?.errorMessages?.join(', ') ||
                responseBody?.errors?.summary ||
                response.statusText ||
                'Jira request failed';

            let missingFields: string[] | undefined;
            if (
                response.status === 400 &&
                responseBody?.errors &&
                typeof responseBody.errors === 'object'
            ) {
                missingFields = Object.keys(responseBody.errors);
            }

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
                data: JSON.stringify({
                    ok: false,
                    error: errorMessage,
                    missingFields,
                    details: {
                        ...details,
                        status: response.status,
                        statusText: response.statusText,
                        response: responseBody
                    }
                } satisfies JiraIssueResponse)
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

                await jiraFetch(
                    `${baseUrl}/rest/api/${apiVersion}/issue/${issueKey}/attachments`,
                    {
                        ...getAuthFields('POST', jiraSettings),
                        body: formData
                    },
                    debugLogger,
                    'attach screenshot',
                    jiraSettings.apiToken
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

                await jiraFetch(
                    `${baseUrl}/rest/api/${apiVersion}/issue/${issueKey}/attachments`,
                    {
                        ...getAuthFields('POST', jiraSettings),
                        body: formData
                    },
                    debugLogger,
                    'attach HAR zip',
                    jiraSettings.apiToken
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
                    type: 'text/plain;charset=utf-8'
                });
                const formData = new FormData();
                formData.append('file', metaBlob, 'meta.txt');

                await jiraFetch(
                    `${baseUrl}/rest/api/${apiVersion}/issue/${issueKey}/attachments`,
                    {
                        ...getAuthFields('POST', jiraSettings),
                        body: formData
                    },
                    debugLogger,
                    'attach page metadata',
                    jiraSettings.apiToken
                );
            } catch (metaError) {
                console.error('Failed to attach meta.txt', metaError);
            }
        }

        debugLogger?.('info', 'Jira issue created successfully', {
            issueKey,
            issueUrl
        });

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
        debugLogger?.('error', 'Jira create issue threw an exception', {
            error: errorMessage
        });
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
    port?: Port,
    debugLogger?: JiraDebugLogger
) {
    const jiraSettings = await getJiraSettings();
    debugLogger?.('info', 'Jira settings test started', {
        requestId: message.requestId,
        projectKey: jiraSettings.projectKey,
        issueType: jiraSettings.issueType || 'Task'
    });

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
        debugLogger?.('error', 'Jira settings test aborted: missing settings', {
            hasBaseUrl: !!baseUrl,
            hasApiToken: !!jiraSettings.apiToken
        });
        respond(
            createJiraError(
                'Missing Jira settings. Check base URL and token.',
                details
            )
        );
        return;
    }

    try {
        // 1. Test Authentication
        const response = await jiraFetch(
            endpoint,
            {
                ...getAuthFields('GET', jiraSettings, 'application/json')
            },
            debugLogger,
            'test authentication',
            jiraSettings.apiToken
        );

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
            const projectResponse = await jiraFetch(
                projectEndpoint,
                {
                    ...getAuthFields('GET', jiraSettings, 'application/json')
                },
                debugLogger,
                'test project',
                jiraSettings.apiToken
            );

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
        const issueTypeResponse = await jiraFetch(
            issueTypeEndpoint,
            {
                ...getAuthFields('GET', jiraSettings, 'application/json')
            },
            debugLogger,
            'test issue types',
            jiraSettings.apiToken
        );

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

        debugLogger?.('info', 'Jira settings test completed successfully');
        respond(JSON.stringify({ ok: true }));
    } catch (e) {
        debugLogger?.('error', 'Jira settings test threw an exception', {
            error: e instanceof Error ? e.message : String(e)
        });
        respond(createJiraError(String(e), details));
    }
}

export async function handleJiraGetMetadata(
    message: JiraGetMetadataMessage,
    port: Port,
    debugLogger?: JiraDebugLogger
) {
    const jiraSettings = await getJiraSettings();
    debugLogger?.('info', 'Jira metadata request started', {
        requestId: message.requestId,
        projectKey: jiraSettings.projectKey,
        issueType: jiraSettings.issueType || 'Task'
    });

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
        debugLogger?.(
            'error',
            'Jira metadata request aborted: missing settings',
            {
                hasBaseUrl: !!baseUrl,
                hasApiToken: !!jiraSettings.apiToken,
                hasProjectKey: !!projectKey
            }
        );
        respond(createJiraError('Missing Jira settings.'));
        return;
    }

    // Check persisted cache from settings
    const cachedFields = jiraSettings.cachedFields;
    if (
        cachedFields &&
        cachedFields.projectKey === projectKey &&
        cachedFields.issueType === issueType &&
        cachedFields.baseUrl === baseUrl &&
        cachedFields.fields
    ) {
        const initialFields = cachedFields.fields.filter(
            (field: {
                key: string;
                required?: boolean;
                hasDefaultValue?: boolean;
            }) => {
                return (
                    field.required &&
                    !field.hasDefaultValue &&
                    field.key !== 'project' &&
                    field.key !== 'issuetype' &&
                    field.key !== 'summary' &&
                    field.key !== 'description'
                );
            }
        );
        debugLogger?.('info', 'Jira metadata returned from cache', {
            fieldCount: cachedFields.fields.length,
            requiredFieldCount: initialFields.length
        });
        respond(
            JSON.stringify({
                ok: true,
                fields: initialFields,
                allFields: cachedFields.fields
            })
        );
        return;
    }

    try {
        // 1. Get Project to find issueTypeId
        const projectResponse = await jiraFetch(
            `${baseUrl}/rest/api/${apiVersion}/project/${projectKey}`,
            {
                ...getAuthFields('GET', jiraSettings, 'application/json')
            },
            debugLogger,
            'metadata project',
            jiraSettings.apiToken
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
        const metaResponse = await jiraFetch(
            metaUrl,
            {
                ...getAuthFields('GET', jiraSettings, 'application/json')
            },
            debugLogger,
            'metadata createmeta fields',
            jiraSettings.apiToken
        );

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
        const fields = (metaBody.fields || metaBody.values || []) as Array<{
            required: boolean;
            hasDefaultValue?: boolean;
            name: string;
            key: string;
            fieldId: string;
            schema?: { type: string };
            allowedValues?: { id: string; value?: string; name?: string }[];
        }>;

        const mappedFields = fields.map((field) => {
            return {
                key: field.key || field.fieldId,
                name: field.name,
                type: field.schema?.type,
                required: field.required,
                hasDefaultValue: field.hasDefaultValue,
                allowedValues: field.allowedValues?.map(
                    (v: { id: string; value?: string; name?: string }) => ({
                        id: v.id,
                        value: v.value || v.name
                    })
                )
            };
        });

        // Persist metadata to settings
        const newCachedFields = {
            projectKey,
            issueType,
            baseUrl,
            fields: mappedFields.map((f) => ({
                key: f.key,
                name: f.name,
                type: f.type || '',
                required: f.required,
                hasDefaultValue: f.hasDefaultValue,
                allowedValues: f.allowedValues
            })),
            values: {}
        };

        // Save to chrome storage
        const { settings } = await chrome.storage.local.get({
            settings: JSON.stringify(defaultSettings)
        });
        const parsedSettings = JSON.parse(settings);
        parsedSettings.jira = parsedSettings.jira || {};
        parsedSettings.jira.cachedFields = newCachedFields;
        await chrome.storage.local.set({
            settings: JSON.stringify(parsedSettings)
        });

        const initialFields = mappedFields.filter((field) => {
            return (
                field.required &&
                !field.hasDefaultValue &&
                field.key !== 'project' &&
                field.key !== 'issuetype' &&
                field.key !== 'summary' &&
                field.key !== 'description'
            );
        });

        debugLogger?.('info', 'Jira metadata request completed successfully', {
            fieldCount: mappedFields.length,
            requiredFieldCount: initialFields.length
        });
        respond(
            JSON.stringify({
                ok: true,
                fields: initialFields,
                allFields: mappedFields
            })
        );
    } catch (e) {
        debugLogger?.('error', 'Jira metadata request threw an exception', {
            error: e instanceof Error ? e.message : String(e)
        });
        respond(createJiraError(String(e)));
    }
}
