import { wrapSandbox } from 'sandboxUtils';
import { createEventPayload, isExtension, postSandbox } from '../utils';
import analytics from '../api/analytics';
import Port = chrome.runtime.Port;

const tabId = isExtension() && window.chrome.devtools.inspectedWindow.tabId;

document.addEventListener('DOMContentLoaded', () => {
    wrapSandbox().then(() => {
        if (tabId) {
            chrome.runtime.onConnect.addListener((port) => {
                if (port.name === `panel-${tabId}`) {
                    port.onMessage.addListener((message) => {
                        if (message.type === 'cachedRequest') {
                            postSandbox(
                                createEventPayload(
                                    'cachedNetworkRequest',
                                    JSON.stringify(message.data)
                                )
                            );
                        } else if (message.type === 'fromContent') {
                            // TODO: chunking
                            messageHandler(message, port);
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
    e: { type: string; data: string; tabId: number },
    _port: Port
): void => {
    if (!tabId) {
        return;
    }
    const type = e.type;
    if (tabId === e.tabId) {
        if (type === 'fromContent') {
            postSandbox(createEventPayload('newItem', e.data));
            try {
                const d = JSON.parse(e.data);
                if (d.tag === 'NEXT') {
                    analytics.fireEvent('NEXT_state');
                } else if (d.tag === 'NUXT') {
                    analytics.fireEvent('NUXT_state');
                } else {
                    analytics.fireEvent('customEvent', { tag: d.tag });
                }
            } catch (e) {
                analytics.fireEvent('customEventUnparsableError', {
                    error:
                        e && typeof e === 'object' && 'message' in e
                            ? e.message
                            : String(e)
                });
            }
        } else if (type === 'connectionTest') {
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
