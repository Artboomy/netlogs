import { nanoid } from 'nanoid';
import {
    IContentItem,
    IItemContentOnlyCfg,
    ItemType,
    SearchConfig
} from './types';
import { PropTreeProps } from '../components/PropTree';
import { markMatches } from 'react-inspector';

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

    shouldShow(cfg: SearchConfig = {}): boolean {
        const { symbol, searchValue } = cfg;
        if (!symbol || !searchValue) {
            return true;
        }
        return typeof this._content === 'string'
            ? this._content.includes(searchValue)
            : markMatches(
                  { content: this._content },
                  'content',
                  (k, v) =>
                      String(k).includes(searchValue) ||
                      String(v).includes(searchValue),
                  symbol
              );
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

    getContent(): TContent {
        return typeof this._content === 'string'
            ? this._content
            : {
                  content: this._content
              };
    }
}
