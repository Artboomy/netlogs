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
import JSZip from 'jszip';
import analytics from './api/analytics';
import { EventName } from 'types';
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
                                    changes.hasOwnProperty('settings') &&
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
                        analytics.fireEvent('debugger.attach');
                        break;
                    case 'debugger.detach':
                        portToBackground?.postMessage({
                            type: 'debugger.detach'
                        });
                        analytics.fireEvent('debugger.detach');
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
                    case 'analytics.hotkey':
                        analytics.fireEvent(`hotkey-${data}`);
                        break;
                    case 'analytics.fileOpen':
                        analytics.fireEvent('fileOpen', {
                            entriesCount: Number(data)
                        });
                        break;
                    case 'analytics.error':
                        analyticsError(data);
                        break;
                    case 'analytics.searchOnPage':
                        analytics.fireEvent('searchOnPage');
                        break;
                    default:
                        console.warn(`Unrecognized type ${type}`);
                }
            }
        });
    });
}

let portToBackground: chrome.runtime.Port;

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

function analyticsError(data: string) {
    const { message, stack } = JSON.parse(data);
    const error = new Error(message);
    error.stack = stack;
    analytics.fireErrorEvent(error);
}

async function analyticsInit(id: string, type: EventName) {
    if (!isExtension()) {
        return;
    }
    // determine if settings matcher is equal to default settings matcher
    const settings = await chrome.storage.local
        .get({
            settings: serialize(defaultSettings)
        })
        .then((data) => JSON.parse(data.settings));

    if (!settings.sendAnalytics) {
        analytics.noSend = true;
    }
    // fire event with payload flag
    const isDefaultProfile = Object.keys(settings.profiles).length === 3;
    if (isDefaultProfile) {
        analytics.fireEvent('matcherTypeDefault', {});
    } else {
        analytics.fireEvent(Object.keys(settings.profiles).join('-'));
    }
    postSandbox({
        id,
        type,
        data: String(isDefaultProfile)
    });
}

function openTab(data: string) {
    chrome.tabs.create({ url: data });
    analytics.fireEvent('openTab', { url: data });
}

function downloadAsZip(dataString: string): Promise<unknown> {
    const { fileName, data } = JSON.parse(dataString);
    // const blob = new Blob([data], { type: 'application/json' });
    const zip = new JSZip();
    zip.file(`${fileName}.har`, data);
    analytics.fireEvent('download', {});
    return zip
        .generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9
            }
        })
        .then((content) => {
            download(`${fileName}.netlogs.zip`, content);
        });
}
