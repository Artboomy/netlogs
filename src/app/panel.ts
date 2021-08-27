import { wrapSandbox } from '../sandboxUtils';
import { createEventPayload, isExtension, postSandbox } from '../utils';
import Port = chrome.runtime.Port;

const tabId = isExtension() && chrome.devtools.inspectedWindow.tabId;
document.addEventListener('DOMContentLoaded', () => {
    wrapSandbox().then(() => {
        if (tabId) {
            const portToContent = chrome.tabs.connect(tabId);
            portToContent.postMessage({ type: 'connectionTest' });
            portToContent.onDisconnect.addListener(() => {
                portToContent.onMessage.removeListener(messageHandler);
            });
            portToContent.onMessage.addListener(messageHandler);
        }
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
if (isExtension()) {
    chrome.runtime.onConnect.addListener((port) => {
        port.onDisconnect.addListener(() => {
            port.onMessage.removeListener(messageHandler);
        });
        port.onMessage.addListener(messageHandler);
        port.postMessage({ type: 'connectionTest' });
    });
}
