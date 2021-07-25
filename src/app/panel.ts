import { wrapSandbox } from '../sandboxUtils';
import { createEventPayload, postSandbox } from '../utils';
import Port = chrome.runtime.Port;

const tabId = chrome.devtools.inspectedWindow.tabId;
document.addEventListener('DOMContentLoaded', () => {
    wrapSandbox().then(() => {
        const portToContent = chrome.tabs.connect(tabId);
        portToContent.postMessage({ type: 'connectionTest' });
        portToContent.onDisconnect.addListener(() => {
            portToContent.onMessage.removeListener(messageHandler);
        });
        portToContent.onMessage.addListener(messageHandler);
    });
});

const messageHandler = (
    e: { type: string; data: string },
    port: Port
): void => {
    const type = e.type;
    if (tabId === port.sender?.tab?.id) {
        if (type === 'fromContent') {
            postSandbox(createEventPayload('newItem', e.data));
        }
    }
};

chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
        port.onMessage.removeListener(messageHandler);
    });
    port.onMessage.addListener(messageHandler);
    port.postMessage({ type: 'connectionTest' });
});
