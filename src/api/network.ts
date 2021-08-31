import { NetworkRequest } from '../models/types';
import { callParent, isSandbox, subscribeParent } from '../utils';

type NavigatedEvent = chrome.devtools.network.NavigatedEvent;

type RequestFinishedEvent = chrome.devtools.network.RequestFinishedEvent;

const NetworkStub: {
    onRequestFinished: {
        addListener: RequestFinishedEvent['addListener'];
    };
    onNavigated: {
        addListener: NavigatedEvent['addListener'];
    };
} = {
    onRequestFinished: {
        addListener(_callback: unknown) {
            // noop
        }
    },
    onNavigated: {
        addListener(_callback: unknown) {
            // noop
        }
    }
};

class SandboxNetwork {
    static _navigationHandlers: Array<(url: string) => void> = [];
    static _requestHandlers: Array<(request: NetworkRequest) => void> = [];

    constructor() {
        subscribeParent('chrome.devtools.network.onRequestFinished', (data) => {
            SandboxNetwork._requestHandlers.forEach((handler) => {
                handler(JSON.parse(data));
            });
        });
        subscribeParent('chrome.devtools.network.onNavigated', (data) => {
            SandboxNetwork._navigationHandlers.forEach((handler) =>
                handler(data)
            );
        });
        callParent('chrome.devtools.network.onNavigated.addListener');
        callParent('chrome.devtools.network.onRequestFinished.addListener');
    }

    onRequestFinished = {
        addListener(
            callback: typeof SandboxNetwork['_requestHandlers'][number]
        ) {
            SandboxNetwork._requestHandlers.push(callback);
        }
    };
    onNavigated = {
        addListener(callback: (url: string) => void) {
            SandboxNetwork._navigationHandlers.push(callback);
        }
    };
}

export default isSandbox()
    ? new SandboxNetwork()
    : window.chrome?.devtools
    ? window.chrome.devtools.network
    : NetworkStub;
