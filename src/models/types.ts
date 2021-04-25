import { Entry } from 'har-format';
import { PropTreeProps } from '../components/PropTree';

export enum ItemType {
    ContentOnly,
    WithName,
    Transaction
}

export interface IContentItem<T> {
    getTag(): string;
    isError(): boolean;
    getContent(): Promise<T>;
    getMeta(): PropTreeProps['data'] | null;
}

export type NetworkRequest = chrome.devtools.network.Request | Entry;

export interface IItemContentOnlyCfg {
    timestamp: number;
    tag?: string;
    content: Record<string, unknown> | string;
    meta?: PropTreeProps['data'] | null;
}

export interface IItemTransactionCfg {
    timestamp: number;
    name: string;
    tag?: string;
    meta: PropTreeProps['data'] | null;
    params: Record<string, unknown>;
    result: Record<string, unknown>;
}

export interface IItemNetworkCfg {
    request: NetworkRequest;
}
