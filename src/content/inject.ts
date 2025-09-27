// NOTE: no non-type imports in this file or build will FAIL!
/* eslint-disable */
import { IItemContentOnlyCfg, IItemTransactionCfg } from 'models/types';
import { ISettings } from 'controllers/settings/types';

declare global {
    interface Window {
        __NEXT_DATA__: any;
        __NUXT__: any;
        netlogs: (cfg: IItemTransactionCfg | IItemContentOnlyCfg) => void;
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
}
