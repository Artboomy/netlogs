import { wrapSandbox } from '../sandboxUtils';
import { createEventPayload, postSandbox } from '../utils';

document.addEventListener('DOMContentLoaded', () => {
    wrapSandbox().then(() => {
        const portToContent = chrome.tabs.connect(
            chrome.devtools.inspectedWindow.tabId
        );
        portToContent.postMessage({ type: 'connectionTest' });
        portToContent.onDisconnect.addListener(() => {
            portToContent.onMessage.removeListener(messageHandler);
        });
        portToContent.onMessage.addListener(messageHandler);
    });
});

const messageHandler = (e: { type: string; data: string }): void => {
    const type = e.type;
    console.info('received a message', e.type);
    if (type === 'fromContent') {
        postSandbox(createEventPayload('newItem', e.data));
    }
};

chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
        port.onMessage.removeListener(messageHandler);
    });
    port.onMessage.addListener(messageHandler);
    port.postMessage({ type: 'connectionTest' });
});
