import { Entry } from 'har-format';
import { PropTreeProps } from '../components/PropTree';

export enum ItemType {
    ContentOnly = 'ContentOnly',
    WithName = 'WithName',
    Transaction = 'Transaction'
}

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
