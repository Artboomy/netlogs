const title = navigator.userAgent.includes('Edg') ? 'Net logs' : '📜 Net logs';

const isDebug = false;
function logger(...args: unknown[]) {
    if (!isDebug) {
        return;
    }
    console.log(...args);
}

function cleanup() {
    chrome.devtools.network.onRequestFinished.removeListener(
        networkOnRequestFinished
    );
    chrome.devtools.network.onNavigated.removeListener(networkOnNavigated);
    cache = [];
    customEventsCache = [];
    logger('Cleanup called');
}
chrome.devtools.panels.create(
    title,
    'icons/16',
    'panel.html',
    function (panel) {
        const listener = () => {
            logger('Panel shown');
            panel.onShown.removeListener(listener);
            connectToPanel();
            sendCachedRequests();
        };
        panel.onShown.addListener(listener);
    }
);

let cache: chrome.devtools.network.Request[] = [];
let customEventsCache: unknown[] = [];
let cacheId = 1;
function networkOnRequestFinished(request: chrome.devtools.network.Request) {
    if ('getContent' in request) {
        const id = cacheId;
        request.getContent((content) => {
            if (cacheId === id) {
                request.response.content.text = content;
                cache.push(request);
            }
        });
    } else {
        cache.push(request);
    }
}

function networkOnNavigated() {
    cache = [];
    customEventsCache = [];
    cacheId += 1;
}

chrome.devtools.network.onRequestFinished.addListener(networkOnRequestFinished);

chrome.devtools.network.onNavigated.addListener(networkOnNavigated);

logger('devtools loaded');

let panelConnection: chrome.runtime.Port | null;
function connectToPanel() {
    panelConnection = chrome.runtime.connect({
        name: `panel-${chrome.devtools.inspectedWindow.tabId}`
    });
    panelConnection.onDisconnect.addListener(() => {
        panelConnection = null;
    });
}

let portToContent: chrome.runtime.Port | null;
function handleConnectionFromContent() {
    const messageHandler = (message: unknown) => {
        logger('message from content', message);
        // TODO: chunking
        customEventsCache.push(message);
        sendCachedRequests();
    };
    chrome.runtime.onConnect.addListener((port) => {
        logger('attempt to connect from port', port.name);
        if (
            port.name ===
            `contentScript-${chrome.devtools.inspectedWindow.tabId}`
        ) {
            logger('port from content script connected');
            portToContent = port;
            portToContent.onMessage.addListener(messageHandler);
            portToContent.onDisconnect.addListener(() => {
                logger('port from content script disconnected');
                portToContent = null;
            });
            portToContent.postMessage({
                type: 'pong'
            });
        }
    });
}

handleConnectionFromContent();

// Send all cached requests to the panel
function sendCachedRequests() {
    if (panelConnection && (cache.length > 0 || customEventsCache.length > 0)) {
        customEventsCache.forEach((message) => {
            panelConnection?.postMessage(message);
        });
        logger(`Sent ${customEventsCache.length} custom messages`);
        cache.forEach((request, idx) => {
            panelConnection?.postMessage({
                type: 'cachedRequest',
                data: {
                    request,
                    idx,
                    total: cache.length
                }
            });
        });
        logger(`Sent ${cache.length} requests`);
        cleanup();
    }
}

setTimeout(
    () => {
        cleanup();
    },
    3 * 60 * 1000
);
