const title = navigator.userAgent.includes('Edg') ? 'Net logs' : '📜 Net logs';

function cleanup() {
    chrome.devtools.network.onRequestFinished.removeListener(
        networkOnRequestFinished
    );
    chrome.devtools.network.onNavigated.removeListener(networkOnNavigated);
    cache = [];
    console.log('Cleanup called');
}
chrome.devtools.panels.create(
    title,
    'icons/16',
    'panel.html',
    function (panel) {
        const listener = () => {
            console.log('Panel shown');
            panel.onShown.removeListener(listener);
            connectToPanel();
            sendCachedRequests();
            cleanup();
        };
        panel.onShown.addListener(listener);
    }
);

let cache: chrome.devtools.network.Request[] = [];
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
    cacheId += 1;
}

chrome.devtools.network.onRequestFinished.addListener(networkOnRequestFinished);

chrome.devtools.network.onNavigated.addListener(networkOnNavigated);

console.log('devtools loaded');

let panelConnection: chrome.runtime.Port | null;
function connectToPanel() {
    panelConnection = chrome.runtime.connect({
        name: `panel-${chrome.devtools.inspectedWindow.tabId}`
    });
    panelConnection.onDisconnect.addListener(() => {
        panelConnection = null;
    });
}

// Send all cached requests to the panel
function sendCachedRequests() {
    if (panelConnection && cache.length > 0) {
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
    }
}

setTimeout(
    () => {
        cleanup();
    },
    3 * 60 * 1000
);
