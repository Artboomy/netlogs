import { nanoid } from 'nanoid';
import { SearchConfig } from './types';
import { PropTreeProps } from '../components/PropTree';
import { Entry } from 'har-format';
import { ItemType } from 'models/enums';
import { TransactionItemAbstract } from './TransactionItem';
import type { PendingRequestData } from '../types';

type TContent = Record<string, unknown>;

/**
 * Represents a pending network request (started but not yet completed).
 * Created from inject script's PENDING_REQUEST message.
 */
export default class PendingItem extends TransactionItemAbstract {
    public readonly id: string;
    public readonly type: ItemType = ItemType.Pending;
    public readonly timestamp: number;
    /** Request ID from inject script (used for matching with completed request) */
    public readonly requestId: string;
    private readonly _method: string;
    private readonly _url: string;
    private readonly _headers: Array<{ name: string; value: string }>;
    private readonly _postData?: { mimeType: string; text: string };

    constructor(data: PendingRequestData) {
        super();
        this.id = nanoid();
        this.requestId = data.id;
        this.timestamp = data.timestamp;
        this._method = data.request.method;
        this._url = data.request.url;
        this._headers = data.request.headers;
        this._postData = data.request.postData;
    }

    setComputedFields(): void {
        // pass - pending items don't need computed fields
    }

    shouldShow(cfg: SearchConfig = {}): boolean {
        const { filterValue } = cfg;
        // Basic URL filtering for pending requests
        if (filterValue) {
            return this._url.includes(filterValue);
        }
        return true;
    }

    toJSON(): Entry {
        return {
            startedDateTime: new Date(this.timestamp).toISOString(),
            time: -1, // Indicates pending
            comment: this.type,
            request: {
                method: this._method,
                url: this._url,
                httpVersion: 'HTTP/1.1',
                cookies: [],
                headers: this._headers,
                queryString: [],
                headersSize: -1,
                bodySize: this._postData?.text?.length ?? -1,
                postData: this._postData
                    ? {
                          mimeType: this._postData.mimeType,
                          text: this._postData.text
                      }
                    : undefined
            },
            response: {
                status: 0, // 0 indicates pending
                statusText: 'Pending...',
                httpVersion: '',
                cookies: [],
                headers: [],
                content: {
                    size: -1,
                    mimeType: '',
                    text: ''
                },
                redirectURL: '',
                headersSize: -1,
                bodySize: -1
            },
            cache: {},
            timings: {
                send: -1,
                wait: -1,
                receive: -1
            }
        };
    }

    getTag(): string {
        return this._method;
    }

    getName(): string {
        // Extract pathname from URL for display
        try {
            const urlObj = new URL(this._url);
            return urlObj.pathname + urlObj.search;
        } catch {
            return this._url;
        }
    }

    isError(): boolean {
        return false;
    }

    getParams(): Record<string, unknown> {
        if (this._postData?.text) {
            try {
                return JSON.parse(this._postData.text);
            } catch {
                return { body: this._postData.text };
            }
        }
        return {};
    }

    getMeta(): PropTreeProps['data'] | null {
        if (this._headers.length === 0) {
            return null;
        }
        return {
            request: {
                title: 'Request',
                items: this._headers
            }
        };
    }

    getContent(): TContent {
        if (this._postData?.text) {
            try {
                return JSON.parse(this._postData.text);
            } catch {
                return { body: this._postData.text };
            }
        }
        return { status: 'Pending...' };
    }

    getDuration(): number {
        // Return elapsed time since request started
        return Date.now() - this.timestamp;
    }

    getUrl(): string {
        return this._url;
    }

    getMethod(): string {
        return this._method;
    }
}
