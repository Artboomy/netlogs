import { nanoid } from 'nanoid';
import { IContentItem, IItemTransactionCfg, ItemType } from 'models/types';
import { PropTreeProps } from '../components/PropTree';

export abstract class TransactionItemAbstract implements IContentItem<unknown> {
    public readonly id: string = 'someId';
    public readonly type: ItemType = ItemType.Transaction;
    public readonly timestamp: number = 0;
    abstract getName(): string;
    abstract getTag(): string;
    abstract isError(): boolean;
    abstract getParams(): Record<string, unknown>;
    abstract getContent(): Promise<unknown>;
    abstract getMeta(): PropTreeProps['data'] | null;
}

type TContent = IItemTransactionCfg['result'];
export default class TransactionItem
    implements TransactionItemAbstract, IContentItem<TContent> {
    public readonly id: string;
    public readonly type: ItemType = ItemType.Transaction;
    public readonly timestamp: number;
    private readonly _name: IItemTransactionCfg['name'];
    private readonly _result: TContent;
    private readonly _params: IItemTransactionCfg['params'];
    private readonly _tag: string;
    private readonly _meta: PropTreeProps['data'] | null;

    constructor(cfg: IItemTransactionCfg) {
        this.id = nanoid();
        this.timestamp = cfg.timestamp;
        this._name = cfg.name;
        this._params = cfg.params;
        this._result = cfg.result;
        this._tag = cfg.tag || '';
        this._meta = cfg.meta || null;
    }

    shouldShow(): boolean {
        return true;
    }

    getName(): IItemTransactionCfg['name'] {
        return this._name;
    }

    getTag(): string {
        return '';
    }

    isError(): boolean {
        return false;
    }

    getParams(): IItemTransactionCfg['params'] {
        return this._params;
    }

    getMeta(): PropTreeProps['data'] | null {
        return this._meta;
    }

    async getContent(): Promise<TContent> {
        return this._result;
    }
}
