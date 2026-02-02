// NOTE: no non-type imports in this file or build will FAIL!
import { ISettings } from 'controllers/settings/types';
// same as src/controllers/settings/base.ts
const defaultSettings: ISettings = {
    theme: 'light',
    language: 'en-US',
    newFeatureFlags: {
        language: false
    },
    nextjsIntegration: true,
    nuxtjsIntegration: true,
    methodChecks: {},
    debuggerEnabled: false,
    sendAnalytics: true,
    jsonRpcIntegration: true,
    graphqlIntegration: true,
    hiddenTags: {
        OPTIONS: 'OPTIONS'
    },
    hiddenMimeTypes: [],
    tagsToolbarVisible: true,
    methodsSidebarVisible: false,
    jira: {
        baseUrl: '',
        apiToken: '',
        projectKey: '',
        issueType: '',
        apiVersion: '2',
        attachScreenshot: true,
        openTicketInNewTab: true,
        template: ``,
        user: '',
        cachedFields: null
    }
};

const isDebug = false;
function logger(...args: unknown[]) {
    if (!isDebug) {
        return;
    }
    console.log(...args);
}

function injectScript(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = window.chrome.runtime.getURL(path);
        s.onload = function () {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.remove();
            resolve();
        };
        s.onerror = reject;
        (document.head || document.documentElement).appendChild(s);
    });
}

let tabId: number | null = null;
function fillTabId() {
    const portToBackground = window.chrome.runtime.connect({
        name: 'contentScript'
    });
    portToBackground.onMessage.addListener((message) => {
        if (message.type === 'pong') {
            tabId = message.tabId;
        }
        establishConnectionToDevtools();
        logger('got message from background', message);
        portToBackground.disconnect();
    });
    const lastError = window.chrome.runtime.lastError;
    if (lastError) {
        logger('Netlogs: fillTabId:lastError', lastError);
    }
}

let portToSend: chrome.runtime.Port | null;

function establishConnectionToDevtools(retries = 10) {
    if (retries === 0) {
        console.warn(
            'Netlogs: Failed to establish devtools connection. Retries exceeded'
        );
        return;
    }
    const portToDevtools = window.chrome.runtime.connect({
        name: `contentScript-${tabId}`
    });
    const retryTimeout = setTimeout(() => {
        portToDevtools.disconnect();
        logger(`Retries left ${retries - 1}`);
        establishConnectionToDevtools(retries - 1);
    }, 200);
    portToDevtools.onMessage.addListener((message) => {
        if (message.type === 'pong') {
            logger('Netlogs: port to devtools connected');
            portToSend = portToDevtools;
            sendMessages();
            clearTimeout(retryTimeout);
        }
    });
    portToDevtools.onDisconnect.addListener(() => {
        logger('Netlogs: port to devtools disconnected');
        portToSend = null;
    });
    const lastError = window.chrome.runtime.lastError;
    if (lastError) {
        logger('Netlogs: establishConnectionToDevtools:lastError', lastError);
    }
}

// on response send data
function sendMessages() {
    if (cache.length && portToSend) {
        cache.forEach((data) => {
            // TODO: chunking
            portToSend?.postMessage({
                type: 'fromContent',
                data,
                tabId
            });
        });
        logger(`Sent ${cache.length} messages`);
        cache = [];
    } else {
        logger(!cache.length ? 'No messages to send' : 'No port to send');
    }
}

let cache: string[] = [];

function subscribeToInjectMessages() {
    window.addEventListener(
        'message',
        (event) => {
            // We only accept messages from ourselves
            if (event.source != window) return;

            if (event.data.type && event.data.type == 'FROM_PAGE') {
                if (event.data.event) {
                    logger(
                        `Received message with len=${event.data.event.length}`
                    );
                    // TODO: chunking
                    cache.push(event.data.event);
                    sendMessages();
                }
            }
        },
        false
    );
}

function main() {
    subscribeToInjectMessages();
    fillTabId();
    injectScript('js/inject.mjs').then(() => {
        chrome.storage.local.get('settings', (data) => {
            window.postMessage(
                {
                    type: 'settings',
                    value: data.settings || JSON.stringify(defaultSettings)
                },
                '*'
            );
        });
    });
}

main();
