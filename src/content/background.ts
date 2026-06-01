import {
    isWebSocketFrameError,
    isWebSocketFrameReceived,
    isWebSocketFrameSent,
    TWebSocketFrameSent
} from './types';
import { IItemWebSocketCfg } from 'models/types';
import { defaultSettings } from 'controllers/settings/base';
import Port = chrome.runtime.Port;
import {
    handleJiraCreateIssue,
    handleJiraGetMetadata,
    handleJiraTestSettings,
    JiraCreateMessage,
    JiraDebugLogger,
    JiraGetMetadataMessage,
    JiraTestMessage
} from './jira';

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: 'netlogs',
        title: chrome.i18n.getMessage('searchIn'),
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
    // if tab is closed this will fail
    try {
        await chrome.debugger.sendCommand({ tabId: id }, 'Network.disable');
        await chrome.debugger.detach({ tabId: id });
    } catch (_e) {
        // pass
    }
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

type JiraDebugEntry = {
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: Record<string, unknown>;
};

function createJiraDebugLogger(): {
    logger: JiraDebugLogger;
    ready: Promise<void>;
    disconnect: () => void;
} {
    let port: chrome.runtime.Port | null = null;
    let isAcked = false;
    const pendingEntries: JiraDebugEntry[] = [];
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
        resolveReady = resolve;
    });
    const readyTimeout = setTimeout(resolveReady, 300);

    const flush = () => {
        if (!port || !isAcked) {
            return;
        }
        while (pendingEntries.length) {
            const entry = pendingEntries.shift();
            if (entry) {
                port.postMessage({ type: 'jira.debugLog', entry });
            }
        }
    };

    const postEntry = (entry: JiraDebugEntry) => {
        if (!port) {
            return;
        }
        pendingEntries.push(entry);
        try {
            flush();
        } catch (_e) {
            // Options page is not open or the debug component is unavailable.
        }
    };

    const logger: JiraDebugLogger = (level, message, details) => {
        postEntry({ timestamp: Date.now(), level, message, details });
    };

    try {
        port = chrome.runtime.connect({ name: 'jira-debug' });
        const handleMessage = (message: {
            type?: string;
            sessionId?: string;
        }) => {
            if (
                message.type === 'jira.debugAck' &&
                message.sessionId === sessionId
            ) {
                isAcked = true;
                clearTimeout(readyTimeout);
                logger('info', 'Jira debug port acknowledged by options page', {
                    sessionId
                });
                flush();
                resolveReady();
            }
        };
        port.onMessage.addListener(handleMessage);
        port.onDisconnect.addListener(() => {
            port?.onMessage.removeListener(handleMessage);
            port = null;
            resolveReady();
        });
        port.postMessage({ type: 'jira.debugPing', sessionId });
    } catch (_e) {
        port = null;
        resolveReady();
    }

    logger('info', 'Jira debug session started in background page', {
        sessionId
    });

    return {
        logger,
        ready,
        disconnect: () => {
            logger('info', 'Jira debug session finished', { sessionId });
            try {
                clearTimeout(readyTimeout);
                flush();
                port?.disconnect();
            } catch (_e) {
                // ignore
            }
            port = null;
        }
    };
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
            const newEnabled = changes.settings.newValue
                ? JSON.parse(changes.settings.newValue).debuggerEnabled
                : false;
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
    chrome.debugger.onDetach.removeListener(handleDetach);
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
    if (port.name === 'contentScript') {
        port.postMessage({
            type: 'pong',
            tabId: port.sender?.tab?.id
        });
    }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'jira.testSettings') {
        const debug = createJiraDebugLogger();
        debug.ready
            .then(() =>
                handleJiraTestSettings(
                    message,
                    sendResponse,
                    undefined,
                    debug.logger
                )
            )
            .finally(debug.disconnect);
        return true; // Keep message channel open for async response
    }
    return false;
});

function portMessageHandler(message: { type: string }, port: Port) {
    const tabId = Number(port.name.split('-')[1]);
    if (!tabId) {
        return;
    }
    if (message.type === 'debugger.attach') {
        isDebuggerEnabled = true;
        subscribeToDebugger();
        attachDebugger(tabId);
    } else if (message.type === 'debugger.detach') {
        detachDebugger(tabId);
        isDebuggerEnabled = false;
    } else if (message.type === 'debugger.getStatus') {
        sendMessageToPort(tabId, {
            type: 'debugger.status',
            value: String(debuggerAttachedMap[tabId])
        });
    } else if (message.type === 'jira.createIssue') {
        const debug = createJiraDebugLogger();
        debug.ready
            .then(() =>
                handleJiraCreateIssue(
                    port,
                    message as JiraCreateMessage,
                    debuggerAttachedMap,
                    tabId,
                    debug.logger
                )
            )
            .finally(debug.disconnect);
    } else if (message.type === 'jira.getMetadata') {
        const debug = createJiraDebugLogger();
        debug.ready
            .then(() =>
                handleJiraGetMetadata(
                    message as JiraGetMetadataMessage,
                    port,
                    debug.logger
                )
            )
            .finally(debug.disconnect);
    } else if (message.type === 'jira.testSettings') {
        const debug = createJiraDebugLogger();
        debug.ready
            .then(() =>
                handleJiraTestSettings(
                    message as JiraTestMessage,
                    undefined,
                    port,
                    debug.logger
                )
            )
            .finally(debug.disconnect);
    } else if (message.type === 'debugger.evaluate') {
        const { expression, requestId } = message as unknown as {
            expression: string;
            requestId: string;
        };
        if (tabId) {
            chrome.debugger.sendCommand(
                { tabId },
                'Runtime.evaluate',
                { expression, returnByValue: true },
                (result) => {
                    port.postMessage({
                        type: 'debugger.evaluateResponse',
                        requestId,
                        result
                    });
                }
            );
        }
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
    if (
        isWebSocketFrameSent(method, params) ||
        isWebSocketFrameReceived(method, params) ||
        isWebSocketFrameError(method, params)
    ) {
        const payload: IItemWebSocketCfg = {
            __type: 'websocket',
            timestamp: Date.now(),
            params: '',
            result: '',
            isError: false
        };
        if (isWebSocketFrameSent(method, params)) {
            payload.params = params.response.payloadData;
            payload.__subtype = 'sent';
        }
        if (isWebSocketFrameReceived(method, params)) {
            payload.result = params.response.payloadData;
            payload.__subtype = 'received';
        }
        if (isWebSocketFrameError(method, params)) {
            payload.result = params.errorMessage;
            payload.isError = true;
            payload.__subtype = 'received';
        }
        sendMessageToPort(source.tabId, {
            type: 'newItem',
            value: JSON.stringify(payload)
        });
    }
};
