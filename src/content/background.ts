chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: 'netlogs',
        title: 'Search in Netlogs',
        type: 'normal',
        contexts: ['selection']
    });
});
chrome.contextMenus.onClicked.addListener((item, tab) => {
    const id = tab && tab.id;
    if (id && ports[id]) {
        ports[id].postMessage({
            type: 'searchOnPage',
            value: item.selectionText
        });
    }
});

const ports = {};

chrome.runtime.onConnect.addListener(function (port) {
    if (port.name.startsWith('netlogs-')) {
        const id = port.name.split('-')[1];
        ports[id] = port;
        port.onDisconnect.addListener(() => {
            delete ports[id];
        });
    }
});
