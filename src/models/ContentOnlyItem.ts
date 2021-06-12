import { nanoid } from 'nanoid';
import {
    IContentItem,
    IItemContentOnlyCfg,
    ItemType,
    SearchConfig
} from './types';
import { PropTreeProps } from '../components/PropTree';
import { markMatches } from 'react-inspector';
import { Entry } from 'har-format';

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

    static fromJSON(input: Entry): ContentOnlyItem {
        return new ContentOnlyItem({
            tag: input.request.method,
            timestamp: new Date(input.startedDateTime).getTime(),
            content: JSON.parse(input.response.content.text || '')
        });
    }

    toJSON(): Entry {
        return {
            startedDateTime: new Date(this.timestamp).toISOString(),
            time: 0,
            comment: this.type,
            request: {
                method: this._tag,
                url: '',
                httpVersion: '',
                cookies: [],
                headers: [],
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: 200,
                statusText: '200 OK',
                httpVersion: '',
                cookies: [],
                headers: [],
                content: {
                    size: -1,
                    mimeType: 'text/plain',
                    text: JSON.stringify(this._content)
                },
                redirectURL: '',
                headersSize: -1,
                bodySize: -1
            },
            cache: {},
            timings: {
                send: 0,
                wait: 0,
                receive: 0
            }
        };
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
        return this._content;
    }
}
