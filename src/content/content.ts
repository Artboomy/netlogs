// NOTE: no non-type imports in this file or build will FAIL!

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
    chrome.storage.local.get('settings', (data) => {
        window.postMessage({ type: 'settings', value: data.settings }, '*');
    });
});

let connectionReady = false;
// create port
const portFromContent = window.chrome.runtime.connect({
    name: 'contentScript'
});

let portToSend: chrome.runtime.Port;

// initiate a connection
portFromContent.postMessage({ type: 'connectionTest' });
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

// on response send data
function sendMessages() {
    if (cache.length && portToSend && connectionReady) {
        cache.forEach((data) => {
            portToSend.postMessage({
                type: 'fromContent',
                data
            });
        });
        cache = [];
    }
}

let cache: string[] = [];

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
    },
    false
);
