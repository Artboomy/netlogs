import storage from './api/storage';
import { serialize } from './controllers/settings';
import { defaultSettings } from './controllers/settings/base';
import {
    createEventPayload,
    download,
    isExtension,
    isIframeEvent,
    postSandbox
} from './utils';
import runtime from './api/runtime';
import analytics from './api/analytics';
import { EventName } from 'types';
import { ISettings } from 'controllers/settings/types';
import { generateZip } from 'utils/generateZip';
import AreaName = chrome.storage.AreaName;
// DO NOT MOVE ANY FUNCTIONS IN THIS FILE OR CIRCULAR DEPENDENCY WILL OCCUR

// TODO: split into multiple handlers

let isIframeReady = false;

export async function wrapSandbox(): Promise<void> {
    return new Promise((resolve) => {
        const network = window.chrome?.devtools?.network;
        window.addEventListener('message', (event) => {
            if (isIframeEvent(event)) {
                const { type, id, data } = event.data;
                switch (type) {
                    case 'onIframeReady':
                        postSandbox({
                            id,
                            type,
                            data: ''
                        });
                        isIframeReady = true;
                        resolve();
                        cache.forEach(processMessage);
                        cache = [];
                        break;
                    case 'chrome.tabs.create':
                        openTab(data);
                        break;
                    case 'chrome.storage.local.get':
                        storage.local.get(
                            { settings: serialize(defaultSettings) },
                            ({ settings }) => {
                                postSandbox({
                                    id,
                                    type,
                                    data: settings
                                });
                            }
                        );
                        break;
                    case 'chrome.storage.local.set':
                        storage.local.set(JSON.parse(data));
                        break;
                    case 'chrome.storage.onChanged.addListener':
                        storage.onChanged.addListener(
                            (
                                changes: {
                                    [key: string]: chrome.storage.StorageChange;
                                },
                                areaName: AreaName
                            ) => {
                                if (
                                    areaName === 'local' &&
                                    Object.prototype.hasOwnProperty.call(
                                        changes,
                                        'settings'
                                    ) &&
                                    changes.settings.newValue
                                ) {
                                    postSandbox(
                                        createEventPayload(
                                            'chrome.storage.onChanged',
                                            JSON.stringify(
                                                changes.settings.newValue
                                            )
                                        )
                                    );
                                }
                            }
                        );
                        break;
                    case 'chrome.runtime.getManifest':
                        postSandbox({
                            id,
                            type,
                            data: JSON.stringify(runtime.getManifest())
                        });
                        break;
                    case 'chrome.devtools.network.onNavigated.addListener':
                        network?.onNavigated.addListener((url) => {
                            postSandbox(
                                createEventPayload(
                                    'chrome.devtools.network.onNavigated',
                                    url
                                )
                            );
                        });
                        break;
                    case 'chrome.devtools.network.onRequestFinished.addListener':
                        network?.onRequestFinished.addListener((request) => {
                            if ('getContent' in request) {
                                request.getContent((content) => {
                                    request.response.content.text = content;
                                    postSandbox(
                                        createEventPayload(
                                            'chrome.devtools.network.onRequestFinished',
                                            JSON.stringify(request)
                                        )
                                    );
                                });
                            } else {
                                postSandbox(
                                    createEventPayload(
                                        'chrome.devtools.network.onRequestFinished',
                                        JSON.stringify(request)
                                    )
                                );
                            }
                        });
                        break;
                    case 'chrome.runtime.openOptionsPage':
                        runtime.openOptionsPage();
                        break;
                    case 'devtools.inspectedWindow.reload':
                        window.chrome?.devtools.inspectedWindow.reload({});
                        break;
                    case 'download':
                        downloadAsZip(data).finally(() => {
                            postSandbox({
                                id,
                                type,
                                data: ''
                            });
                            resolve();
                        });
                        break;
                    case 'debugger.attach':
                        portToBackground?.postMessage({
                            type: 'debugger.attach'
                        });
                        analytics.fireEvent('debugger_attach');
                        break;
                    case 'debugger.detach':
                        portToBackground?.postMessage({
                            type: 'debugger.detach'
                        });
                        analytics.fireEvent('debugger_detach');
                        break;
                    case 'debugger.getStatus':
                        portToBackground?.postMessage({
                            type: 'debugger.getStatus'
                        });
                        break;
                    case 'analytics.init':
                        analyticsInit(id, type);
                        break;
                    case 'analytics.mimeFilterChange':
                        analytics.fireEvent('mimeFilterChange');
                        break;
                    case 'analytics.propTreeViewed':
                        analytics.fireEvent('propTreeViewed', {
                            engagement_time_msec: parseInt(data)
                        });
                        break;
                    case 'analytics.methodsSidebarViewed':
                        analytics.fireEvent('methodsSidebarViewed', {
                            engagement_time_msec: parseInt(data)
                        });
                        break;
                    case 'analytics.hotkey':
                        analytics.fireEvent(`hotkey`, {
                            hotkey: data
                        });
                        break;
                    case 'analytics.fileOpen':
                        analytics.fireEvent('fileOpen', {
                            entriesCount: Number(data)
                        });
                        break;
                    case 'analytics.error':
                        analyticsError(data);
                        break;
                    case 'analytics.copyObject':
                        analytics.fireEvent('copyObject');
                        break;
                    case 'analytics.searchOnPage':
                        analytics.fireEvent('searchOnPage');
                        break;
                    case 'analytics.jiraTicketCreated':
                        analytics.fireEvent('jiraTicketCreated');
                        break;
                    case 'jira.createIssue':
                        createJiraIssue(data, id).then((response) => {
                            postSandbox({
                                id,
                                type,
                                data: response
                            });
                        });
                        break;
                    case 'jira.getMetadata':
                        getJiraMetadata(id).then((response) => {
                            postSandbox({
                                id,
                                type,
                                data: response
                            });
                        });
                        break;
                    case 'debugger.evaluate':
                        debuggerEvaluate(data, id).then((response) => {
                            postSandbox({
                                id,
                                type,
                                data: response
                            });
                        });
                        break;
                    case 'chrome.permissions.request':
                        chrome.permissions.request(
                            JSON.parse(data),
                            (granted) => {
                                postSandbox({
                                    id,
                                    type,
                                    data: String(granted)
                                });
                            }
                        );
                        break;
                    default:
                        console.warn(`Unrecognized type ${type}`);
                }
            }
        });
    });
}

let portToBackground: chrome.runtime.Port;
const jiraRequests = new Map<string, (data: string) => void>();
const jiraMetadataRequests = new Map<string, (data: string) => void>();
const evaluateRequests = new Map<string, (data: string) => void>();

let cache: { type: string; value: string | undefined }[] = [];
if (isExtension()) {
    console.log('created backport');
    const tabId = window.chrome.devtools.inspectedWindow.tabId;
    portToBackground = window.chrome.runtime.connect({
        name: `netlogs-${tabId}`
    });

    const lastError = chrome.runtime.lastError;
    if (lastError) {
        console.error('lastError', lastError);
    }

    portToBackground.onMessage.addListener((message) => {
        if (message.type === 'jira.response') {
            const resolver =
                jiraRequests.get(message.requestId) ||
                jiraMetadataRequests.get(message.requestId);
            if (resolver) {
                jiraRequests.delete(message.requestId);
                jiraMetadataRequests.delete(message.requestId);
                resolver(message.data);
            }
            return;
        }
        if (message.type === 'debugger.evaluateResponse') {
            const resolver = evaluateRequests.get(message.requestId);
            if (resolver) {
                evaluateRequests.delete(message.requestId);
                resolver(JSON.stringify(message.result));
            }
            return;
        }
        if (!isIframeReady) {
            cache.push(message);
            return;
        }
        processMessage(message);
    });
    portToBackground.onDisconnect.addListener(() => {
        console.log('portToBackground disconnected', tabId);
        portToBackground = window.chrome.runtime.connect({
            name: `netlogs-${tabId}`
        });
    });
} else {
    console.log('no portToBackground');
}

function processMessage(message: { type: string; value: string | undefined }) {
    if (message.type === 'searchOnPage') {
        postSandbox(createEventPayload('searchOnPage', message.value));
    } else if (message.type === 'newItem') {
        postSandbox(createEventPayload('newItem', message.value));
    } else if (message.type === 'debugger.status') {
        postSandbox(createEventPayload('debugger.status', message.value));
    } else {
        console.debug('Unrecognized message', message);
    }
}

async function createJiraIssue(
    data: string,
    requestId: string
): Promise<string> {
    if (!portToBackground) {
        return JSON.stringify({
            ok: false,
            error: 'Background connection is not available.'
        });
    }

    let payload = data;
    try {
        const parsed = JSON.parse(data);
        const tabId = window.chrome.devtools.inspectedWindow.tabId;
        if (tabId) {
            parsed.tabId = tabId;
            payload = JSON.stringify(parsed);
        }
    } catch (e) {
        console.error('Failed to parse Jira payload', e);
    }

    return new Promise((resolve) => {
        jiraRequests.set(requestId, resolve);
        portToBackground.postMessage({
            type: 'jira.createIssue',
            requestId,
            data: payload
        });
    });
}

async function getJiraMetadata(requestId: string): Promise<string> {
    if (!portToBackground) {
        return JSON.stringify({
            ok: false,
            error: 'Background connection is not available.'
        });
    }

    return new Promise((resolve) => {
        jiraMetadataRequests.set(requestId, resolve);
        portToBackground.postMessage({
            type: 'jira.getMetadata',
            requestId
        });
    });
}

async function debuggerEvaluate(
    data: string,
    requestId: string
): Promise<string> {
    if (!portToBackground) {
        return JSON.stringify({
            error: 'Background connection is not available.'
        });
    }

    const { expression } = JSON.parse(data);

    return new Promise((resolve) => {
        evaluateRequests.set(requestId, resolve);
        portToBackground.postMessage({
            type: 'debugger.evaluate',
            requestId,
            expression
        });
    });
}

function analyticsError(data: string) {
    const { message, stack } = JSON.parse(data);
    analytics.fireErrorEvent({ message, stack });
}

async function analyticsInit(id: string, type: EventName) {
    if (!isExtension()) {
        return;
    }
    // determine if settings matcher is equal to default settings matcher
    const settings: ISettings = await chrome.storage.local
        .get({
            settings: serialize(defaultSettings)
        })
        .then((data) => JSON.parse(data.settings));

    if (!settings.sendAnalytics) {
        analytics.noSend = true;
    }
    // fire event with payload flag
    analytics.fireEvent('matcherTypeDefault', {
        lang: settings.language,
        browserLang: navigator?.languages?.join(',') || 'unknown'
    });
    postSandbox({
        id,
        type,
        data: String(true)
    });
}

function openTab(data: string) {
    chrome.tabs.create({ url: data });
    analytics.fireEvent('openTab', { url: data });
}

function downloadAsZip(dataString: string): Promise<unknown> {
    const { fileName, data } = JSON.parse(dataString);
    analytics.fireEvent('download', {});
    return generateZip(fileName, data).then((content) => {
        download(`${fileName}.netlogs.zip`, content);
    });
}
