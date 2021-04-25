import { nanoid } from 'nanoid';
import { IContentItem, IItemContentOnlyCfg, ItemType } from './types';
import { PropTreeProps } from '../components/PropTree';

type TContent = IItemContentOnlyCfg['content'];
export default class ContentOnlyItem implements IContentItem<TContent> {
    public readonly id: string;
    public readonly type: ItemType = ItemType.ContentOnly;
    public readonly timestamp: number;
    private readonly _content: Record<string, unknown> | string;
    private readonly _tag: string;
    private readonly _meta: PropTreeProps['data'] | null;

    constructor(cfg: IItemContentOnlyCfg) {
        this.id = nanoid();
        this.timestamp = cfg.timestamp;
        this._content = cfg.content;
        this._tag = cfg.tag || '';
        this._meta = cfg.meta || null;
    }

    shouldShow(): boolean {
        return true;
    }

    getTag(): string {
        return this._tag;
    }

    isError(): boolean {
        return false;
    }

    getMeta(): PropTreeProps['data'] | null {
        return null;
    }

    async getContent(): Promise<TContent> {
        return typeof this._content === 'string'
            ? this._content
            : {
                  content: this._content
              };
    }
}
