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
    },

    interceptRequests: true
};

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

injectScript('js/inject.mjs').then(() => {
    chrome.storage.local.get(
        {
            settings: JSON.stringify(defaultSettings)
        },
        (data) => {
            window.postMessage(
                {
                    type: 'settings',
                    value: data.settings || JSON.stringify(defaultSettings)
                },
                '*'
            );
        }
    );
});

let connectionReady = false;
// create port
const portFromContent = window.chrome.runtime.connect({
    name: 'contentScript'
});

let portToSend: chrome.runtime.Port;

// initiate a connection
portFromContent.postMessage({
    type: 'connectionTest',
    data: { host: window.location.host }
});
const lastError = window.chrome.runtime.lastError;
if (lastError) {
    console.error('lastError', lastError);
}
portFromContent.onDisconnect.addListener(() => {
    if (window.chrome.runtime.lastError) {
        portFromContent.onMessage.removeListener(messageCallback);
        window.chrome.runtime.onConnect.addListener((port) => {
            connectionReady = true;
            portToSend = port;
            sendMessages();
        });
    }
});

const messageCallback = (event: { type: string }) => {
    if (event.type === 'connectionTest') {
        connectionReady = true;
        portToSend = portFromContent;
        sendMessages();
    }
};

portFromContent.onMessage.addListener(messageCallback);

let cache: string[] = [];
// let pendingRequestCache: unknown[] = [];

// on response send data
function sendMessages() {
    if (portToSend && connectionReady) {
        // Send regular messages
        if (cache.length) {
            cache.forEach((data) => {
                portToSend.postMessage({
                    type: 'fromContent',
                    data
                });
            });
            cache = [];
        }
        // Send cached pending requests
        // if (pendingRequestCache.length) {
        //     pendingRequestCache.forEach((data) => {
        //         portToSend.postMessage({
        //             type: 'pendingRequest',
        //             data
        //         });
        //     });
        //     pendingRequestCache = [];
        // }
    }
}

// Send pending request data
function sendPendingRequest(data: unknown) {
    if (portToSend && connectionReady) {
        portToSend.postMessage({
            type: 'pendingRequest',
            data
        });
    } else {
        // dropping pendings as they serve no need in the cache
        // pendingRequestCache.push(data);
    }
}

// Send pending request completion notification
function sendPendingComplete(requestId: string) {
    if (portToSend && connectionReady) {
        portToSend.postMessage({
            type: 'pendingRequestComplete',
            data: requestId
        });
    }
    // No need to cache - if connection not ready, pending item wasn't shown anyway
}

window.addEventListener(
    'message',
    (event) => {
        // We only accept messages from ourselves
        if (event.source != window) return;

        if (event.data.type && event.data.type == 'FROM_PAGE') {
            if (event.data.event) {
                cache.push(event.data.event);
                sendMessages();
            }
        }

        // Handle pending request messages from inject script
        if (event.data.type && event.data.type === 'PENDING_REQUEST') {
            if (event.data.data) {
                sendPendingRequest(event.data.data);
            }
        }

        // Handle pending request completion messages from inject script
        if (event.data.type && event.data.type === 'PENDING_REQUEST_COMPLETE') {
            if (event.data.requestId) {
                sendPendingComplete(event.data.requestId);
            }
        }
    },
    false
);
