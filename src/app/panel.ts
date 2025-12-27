import { wrapSandbox } from 'sandboxUtils';
import { createEventPayload, isExtension, postSandbox } from '../utils';
import analytics from '../api/analytics';
import Port = chrome.runtime.Port;

const tabId = isExtension() && window.chrome.devtools.inspectedWindow.tabId;
document.addEventListener('DOMContentLoaded', () => {
    wrapSandbox().then(() => {
        if (tabId) {
            const portToContent = window.chrome.tabs.connect(tabId);
            portToContent.postMessage({ type: 'connectionTest' });
            portToContent.onDisconnect.addListener(() => {
                console.log('onDisconnect');
                const lastError = window.chrome.runtime.lastError;
                if (lastError) {
                    console.log('lastError', lastError);
                }
                portToContent.onMessage.removeListener(messageHandler);
            });
            portToContent.onMessage.addListener(messageHandler);

            chrome.runtime.onConnect.addListener((port) => {
                if (port.name === 'panel') {
                    port.onMessage.addListener((message) => {
                        if (message.type === 'cachedRequest') {
                            postSandbox(
                                createEventPayload(
                                    'cachedNetworkRequest',
                                    JSON.stringify(message.data)
                                )
                            );
                        }
                    });
                }
            });
            chrome.devtools.inspectedWindow.eval(
                'window.location.host',
                (result, exceptionInfo) => {
                    if (exceptionInfo) {
                        console.error('eval error', exceptionInfo);
                    } else {
                        if (typeof result === 'string') {
                            postSandbox(createEventPayload('setHost', result));
                        }
                    }
                }
            );
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
            try {
                const d = JSON.parse(e.data);
                if (!['NEXT', 'NUXT'].includes(d.tag)) {
                    analytics.fireEvent('customEvent');
                }
            } catch (_e) {
                // pass
            }
        } else if (type === 'connectionTest') {
            console.log('message', type, e.data);
            const data = e.data as unknown as { host: string };
            postSandbox(
                createEventPayload(
                    'setHost',
                    typeof data === 'object' ? data.host : data
                )
            );
        }
    }
};
if (isExtension()) {
    window.chrome.runtime.onConnect.addListener((port) => {
        port.onDisconnect.addListener(() => {
            port.onMessage.removeListener(messageHandler);
        });
        port.onMessage.addListener(messageHandler);
        port.postMessage({ type: 'connectionTest' });
    });
}
