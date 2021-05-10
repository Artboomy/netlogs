import settings from '../controllers/settings';
function injectScript(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL(path);
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

injectScript('js/inject.js').then(() => {
    settings.refresh().then((settings) => {
        window.postMessage(
            { type: 'settings', value: JSON.stringify(settings) },
            '*'
        );
    });
});

let connectionReady = false;
// create port
const portFromContent = chrome.runtime.connect({
    name: 'contentScript'
});

let portToSend: chrome.runtime.Port;

// initiate a connection
portFromContent.postMessage({ type: 'connectionTest' });
portFromContent.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
        portFromContent.onMessage.removeListener(messageCallback);
        chrome.runtime.onConnect.addListener((port) => {
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
