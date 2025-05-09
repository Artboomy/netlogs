import { Entry } from 'har-format';
import { PropTreeProps } from '../components/PropTree';

export interface IContentItem<T> {
    getTag(): string;

    isError(): boolean;

    getContent(): T;

    getMeta(): PropTreeProps['data'] | null;

    getDuration(): number;
}

export type NetworkRequest = Entry;

export interface IItemContentOnlyCfg {
    timestamp: number;
    tag?: string;
    content: Record<string, unknown> | string;
    meta?: PropTreeProps['data'] | null;
}

export interface IItemTransactionCfg {
    timestamp: number;
    name?: string;
    tag?: string;
    duration?: number;
    meta: PropTreeProps['data'] | null;
    params: Record<string, unknown>;
    result: Record<string, unknown>;
}

export interface IItemWebSocketCfg {
    __type: 'websocket';
    __subtype?: 'sent' | 'received' | 'full';
    timestamp: number;
    isError: boolean;
    meta?: {
        request: {
            title: 'Request';
            items: Array<{ name: string; value: string }>;
        };
        response: {
            title: 'Response';
            items: Array<{ name: string; value: string }>;
        };
    } | null;
    params: string;
    result: string;
}

export interface IItemNetworkCfg {
    request: NetworkRequest;
}

export type SearchConfig = {
    searchValue?: string;
    filterValue?: string;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    marker?: (k: unknown, v: unknown) => boolean;
};
