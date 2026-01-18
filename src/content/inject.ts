/* eslint-disable */
import { IItemContentOnlyCfg, IItemTransactionCfg } from 'models/types';
import { ISettings } from 'controllers/settings/types';
import type { PendingRequestData } from '../types';
import {
    createPendingRequestFromFetch,
    createPendingRequestFromXHR
} from './interceptors';

declare global {
    interface Window {
        __NEXT_DATA__: any;
        __NUXT__: any;
        netlogs: (cfg: IItemTransactionCfg | IItemContentOnlyCfg) => void;
        /** Internal: tracks pending XHR request data */
        __netlogs_xhr?: {
            method: string;
            url: string;
            headers: Array<{ name: string; value: string }>;
        };
    }
    interface XMLHttpRequest {
        /** Internal: tracks pending XHR request data */
        __netlogs?: {
            method: string;
            url: string;
            headers: Array<{ name: string; value: string }>;
        };
    }
}

type TransactionOptional = Omit<IItemTransactionCfg, 'timestamp'> & {
    timestamp?: number;
};

type ContentOptional = Omit<IItemContentOnlyCfg, 'timestamp'> & {
    timestamp?: number;
};

function settingsListener(event: MessageEvent): void {
    if (event.data.type === 'settings') {
        const settings = JSON.parse(event.data.value);
        injectAfterSettings(settings);
        window.removeEventListener('message', settingsListener);
    }
}

window.addEventListener('message', settingsListener);

const netlogs = function (cfg: TransactionOptional | ContentOptional | any) {
    let event = cfg;
    if (!event || (!event?.content && !(event?.params && event?.result))) {
        event = {
            content: cfg
        };
    }
    if (event && typeof event === 'object') {
        event.timestamp = event.timestamp || new Date().getTime();
    }
    event.tag = event.tag || 'PAGE';
    window.postMessage(
        { type: 'FROM_PAGE', event: JSON.stringify(event) },
        '*'
    );
};

netlogs.help = (): void => {
    console.info(
        `
        %cCall this function to send arbitrary event to Net logs
        
        %cUsage: netlogs(event);
        
        %cExample: netlogs({ tag: 'TEST', content: { message: 'Hello world' } });
        
        %cAll data should be json-serializable.%c
        
        Event variants:
            IItemContentOnlyCfg:
                // by default new Date().getTime() will be used
                timestamp?: number;
                // small bit of text next to date
                tag?: string; 
                // viewable on date click
                meta?: {
                    key: {
                        items: [{name: string, value: string}]
                    }
                }
                
                content: object | string;
            
            IItemTransactionCfg:
                // by default new Date().getTime() will be used
                timestamp?: number;
                // small bit of text next to date
                tag?: string;
                name?: string;
                // viewable on date click
                meta?: {
                    key: {
                        items: [{name: string, value: string}]
                    }
                }
                
                params: object;
                
                result: object;
        `,
        'font-size: 1.5em',
        'font-size: 1em; color: green;',
        'color: blue;',
        'font-weight: bold; color: black;',
        'font-weight: normal'
    );
};

window.netlogs = netlogs;

// Store original implementations for wrapping
const originalFetch = window.fetch.bind(window);
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Track if interceptors are already installed
let interceptorsInstalled = false;

/**
 * Safely post a pending request message.
 * Never throws - errors are silently ignored to avoid breaking page functionality.
 */
function safePostPendingRequest(data: PendingRequestData): void {
    try {
        window.postMessage(
            {
                type: 'PENDING_REQUEST',
                data: data
            },
            '*'
        );
    } catch (_e) {
        // console.error('[NETLOGS:inject] Failed to post PENDING_REQUEST:', e);
    }
}

/**
 * Install fetch/XHR interceptors to capture request starts.
 * Safe wrappers that never break original functionality.
 */
function installInterceptors(): void {
    if (interceptorsInstalled) {
        return;
    }
    interceptorsInstalled = true;

    // Wrap fetch
    window.fetch = function (
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> {
        try {
            const pendingRequest = createPendingRequestFromFetch(input, init);
            safePostPendingRequest(pendingRequest);
        } catch {
            // Silently ignore interception errors
        }
        return originalFetch(input, init);
    };

    // Wrap XHR.open to capture method and URL
    XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        async: boolean = true,
        username?: string | null,
        password?: string | null
    ): void {
        try {
            this.__netlogs = {
                method,
                url: typeof url === 'string' ? url : url.href,
                headers: []
            };
        } catch {
            // Silently ignore
        }
        return originalXHROpen.call(
            this,
            method,
            url,
            async,
            username,
            password
        );
    };

    // Wrap XHR.setRequestHeader to capture headers
    XMLHttpRequest.prototype.setRequestHeader = function (
        name: string,
        value: string
    ): void {
        try {
            if (this.__netlogs) {
                this.__netlogs.headers.push({ name, value });
            }
        } catch {
            // Silently ignore
        }
        return originalXHRSetRequestHeader.call(this, name, value);
    };

    // Wrap XHR.send to capture body and emit pending request
    XMLHttpRequest.prototype.send = function (
        body?: Document | XMLHttpRequestBodyInit | null
    ): void {
        try {
            if (this.__netlogs) {
                const pendingRequest = createPendingRequestFromXHR(
                    this.__netlogs.method,
                    this.__netlogs.url,
                    this.__netlogs.headers,
                    body
                );
                safePostPendingRequest(pendingRequest);
            }
        } catch {
            // Silently ignore
        }
        return originalXHRSend.call(this, body);
    };
}

function injectAfterSettings(settings: Partial<ISettings>) {
    if ('__NEXT_DATA__' in window && settings.nextjsIntegration) {
        netlogs({
            timestamp: new Date().getTime(),
            tag: 'NEXT',
            content: window.__NEXT_DATA__
        });
    }
    if ('__NUXT__' in window && settings.nuxtjsIntegration) {
        netlogs({
            timestamp: new Date().getTime(),
            tag: 'NUXT',
            content: window.__NUXT__
        });
    }
    // Install request interceptors if enabled
    if (settings.interceptRequests) {
        console.log('[NETLOGS:inject] Installing request interceptors');
        installInterceptors();
    } else {
        console.log(
            '[NETLOGS:inject] Request interceptors disabled in settings'
        );
    }
}
