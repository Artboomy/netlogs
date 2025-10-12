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
function networkOnRequestFinished(request: chrome.devtools.network.Request) {
    if ('getContent' in request) {
        request.getContent((content) => {
            request.response.content.text = content;
            cache.push(request);
        });
    } else {
        cache.push(request);
    }
}

function networkOnNavigated() {
    cache = [];
}

chrome.devtools.network.onRequestFinished.addListener(networkOnRequestFinished);

chrome.devtools.network.onNavigated.addListener(networkOnNavigated);

console.log('devtools loaded');

let panelConnection: chrome.runtime.Port | null;
function connectToPanel() {
    panelConnection = chrome.runtime.connect({
        name: 'panel'
    });
    panelConnection.onDisconnect.addListener(() => {
        panelConnection = null;
    });
}

// Send all cached requests to the panel
function sendCachedRequests() {
    if (panelConnection && cache.length > 0) {
        panelConnection.postMessage({
            type: 'cachedRequests',
            data: cache
        });
    }
}

setTimeout(
    () => {
        cleanup();
    },
    3 * 60 * 1000
);
