import {
    isWebSocketFrameError,
    isWebSocketFrameReceived,
    isWebSocketFrameSent,
    TWebSocketFrameSent
} from './types';
import { IItemWebSocketCfg } from '../models/types';
import { defaultSettings } from '../controllers/settings/base';
import Port = chrome.runtime.Port;

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: 'netlogs',
        title: 'Search in Netlogs',
        type: 'normal',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
    if (!item.selectionText) {
        return;
    }
    sendMessageToPort(tab?.id, {
        type: 'searchOnPage',
        value: item.selectionText
    });
});

const ports: Record<number, chrome.runtime.Port> = {};

const cache: Record<TabId, Message[]> = {};

type Message = {
    type: string;
    value: string | Record<string | number, unknown>;
};

function sendMessageToPort(id: number | undefined, message: Message) {
    if (!id) {
        return;
    }
    if (ports[id]) {
        ports[id].postMessage({
            type: message.type,
            value:
                typeof message.value === 'string'
                    ? message.value
                    : JSON.stringify(message.value)
        });
    } else {
        if (message.type === 'debugger.status') {
            cache[id] = (cache[id] || []).concat(message);
        }
    }
}

const debuggerAttachedMap: Record<TabId, boolean> = {};

function attachDebugger(id: number) {
    if (!isDebuggerEnabled) {
        return false;
    }
    chrome.debugger.attach({ tabId: id }, '1.2', function () {
        chrome.debugger.sendCommand(
            { tabId: id },
            'Network.enable',
            {},
            function () {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                } else {
                    debuggerAttachedMap[id] = true;
                    sendMessageToPort(id, {
                        type: 'debugger.status',
                        value: String(true)
                    });
                }
            }
        );
    });
    return true;
}

async function detachDebugger(id: number) {
    if (!isDebuggerEnabled) {
        return;
    }
    await chrome.debugger.sendCommand({ tabId: id }, 'Network.disable');
    await chrome.debugger.detach({ tabId: id });
    delete debuggerAttachedMap[id];
    sendMessageToPort(id, {
        type: 'debugger.status',
        value: String(false)
    });
}

function sendCache(id: number) {
    const messages = cache[id] || [];
    messages.forEach((message) => {
        sendMessageToPort(id, message);
    });
    delete cache[id];
}

function cleanup(id?: number) {
    if (!id) {
        return;
    }
    delete ports[id];
    delete framePairs[id];
    delete cache[id];
}

let isDebuggerEnabled = false;
let isDebuggerSubscribed = false;

function subscribeToSettingsFlag() {
    chrome.storage.local
        .get({ settings: JSON.stringify(defaultSettings) })
        .then((data) => {
            const newEnabled = JSON.parse(data.settings).debuggerEnabled;
            if (newEnabled) {
                subscribeToDebugger();
            } else if (newEnabled !== isDebuggerEnabled) {
                unsubscribeFromDebugger();
            }
            isDebuggerEnabled = newEnabled;
        });

    chrome.storage.local.onChanged.addListener((changes) => {
        if (changes.settings) {
            const newEnabled = JSON.parse(changes.settings.newValue)
                .debuggerEnabled;
            if (newEnabled) {
                subscribeToDebugger();
            } else if (newEnabled !== isDebuggerEnabled) {
                unsubscribeFromDebugger();
            }
            isDebuggerEnabled = newEnabled;
        }
    });
}

subscribeToSettingsFlag();

function handleDetach(source: { tabId?: number }, _reason: unknown) {
    cleanup(source.tabId);
}

function subscribeToDebugger() {
    if (isDebuggerSubscribed) {
        return;
    }
    chrome.debugger.onEvent.addListener(handleDebuggerEvent);
    chrome.debugger.onDetach.addListener(handleDetach);
    isDebuggerSubscribed = true;
}

function unsubscribeFromDebugger() {
    if (!isDebuggerSubscribed) {
        return;
    }
    chrome.debugger.onEvent.removeListener(handleDebuggerEvent);
    chrome.debugger.onDetach.removeListener(function (source, _reason) {
        cleanup(source.tabId);
    });
    Object.keys(ports).forEach((id) => {
        detachDebugger(Number(id));
    });
    isDebuggerSubscribed = false;
}

chrome.runtime.onConnect.addListener(function (port) {
    if (port.name.startsWith('netlogs-')) {
        // console.log('connected', port.name);
        const id = Number(port.name.split('-')[1]);
        ports[id] = port;
        framePairs[id] = {};
        attachDebugger(id);
        sendCache(id);
        port.onMessage.addListener(portMessageHandler);
        port.onDisconnect.addListener(() => {
            cleanup(id);
            port.onMessage.removeListener(portMessageHandler);
            detachDebugger(id);
            // console.log('disconnected', port.name);
        });
    }
});

function portMessageHandler(message: { type: string }, port: Port) {
    const tabId = Number(port.name.split('-')[1]);
    if (!tabId) {
        return;
    }
    if (message.type === 'debugger.attach') {
        attachDebugger(tabId);
    } else if (message.type === 'debugger.detach') {
        detachDebugger(tabId);
    } else if (message.type === 'debugger.getStatus') {
        sendMessageToPort(tabId, {
            type: 'debugger.status',
            value: String(debuggerAttachedMap[tabId])
        });
    } else {
        // ignore
    }
}

type TabId = number;

const framePairs: Record<
    TabId,
    Record<
        // NOTE: requestId are NOT unique in all timeline, only until response
        TWebSocketFrameSent['requestId'],
        TWebSocketFrameSent | undefined
    >
> = {};

const handleDebuggerEvent = (
    source: { tabId?: number },
    method: string,
    params?: unknown
) => {
    if (!source.tabId) {
        return;
    }
    // check if port is connected for this tab
    if (!ports[source.tabId]) {
        return;
    }
    if (isWebSocketFrameSent(method, params)) {
        framePairs[source.tabId][params.requestId] = params;
    } else if (
        isWebSocketFrameReceived(method, params) ||
        isWebSocketFrameError(method, params)
    ) {
        const payload: IItemWebSocketCfg = {
            __type: 'websocket',
            timestamp: Date.now(),
            params: '',
            result: '',
            duration: 0,
            isError: false,
            meta: {
                request: {
                    title: 'Request',
                    items: []
                },
                response: {
                    title: 'Response',
                    items: []
                }
            }
        };
        // to keep typescript happy
        if (!payload.meta) {
            return;
        }
        const request = framePairs[source.tabId][params.requestId];
        if (request) {
            payload.params = request.response.payloadData;
            payload.meta.request.items.push({
                name: 'opcode',
                value: String(request.response.opcode)
            });
            payload.meta.request.items.push({
                name: 'mask',
                value: String(request.response.mask)
            });
            payload.meta.request.items.push({
                name: 'body',
                value: request.response.payloadData
            });
            payload.duration = params.timestamp - request.timestamp;
            delete framePairs[source.tabId][params.requestId];
        }
        if (isWebSocketFrameReceived(method, params)) {
            payload.meta.response.items.push({
                name: 'opcode',
                value: String(params.response.opcode)
            });
            payload.meta.response.items.push({
                name: 'mask',
                value: String(params.response.mask)
            });
            payload.meta.response.items.push({
                name: 'body',
                value: params.response.payloadData
            });
            payload.result = params.response.payloadData;
        }
        if (isWebSocketFrameError(method, params)) {
            payload.result = params.errorMessage;
            payload.isError = true;
        }
        sendMessageToPort(source.tabId, {
            type: 'newItem',
            value: JSON.stringify(payload)
        });
    }
};
