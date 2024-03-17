import { nanoid } from 'nanoid';
import {
    IContentItem,
    IItemTransactionCfg,
    IItemWebSocketCfg,
    ItemType,
    SearchConfig
} from './types';
import { PropTreeProps } from '../components/PropTree';
import { Entry } from 'har-format';
import { isVisible } from 'react-inspector';
import { isMimeType } from '../components/InspectorWrapper';
import { TransactionItemAbstract } from './TransactionItem';
import { phoenixLiveViewProfile } from '../controllers/settings/profiles/phoenixLiveView';

type TContent = IItemTransactionCfg['result'];
export default class WebSocketItem
    implements TransactionItemAbstract, IContentItem<TContent> {
    public readonly id: string;
    public readonly type: ItemType = ItemType.WebSocket;
    public readonly timestamp: number;
    private _name: string = '';
    private _result: TContent | unknown = {};
    private readonly _request: IItemWebSocketCfg;
    private _isError: boolean;
    private _params: IItemTransactionCfg['params'] = {};
    private _tag: string = '';
    private readonly _meta: IItemWebSocketCfg['meta'];
    private readonly _duration: number;

    constructor(cfg: IItemWebSocketCfg) {
        this.id = nanoid();
        this.timestamp = cfg.timestamp;
        this._meta = cfg.meta || null;
        this._duration = cfg.duration || 0;
        this._isError = cfg.isError;
        this._request = cfg;
        this.setComputedFields();
    }

    setComputedFields(): void {
        if (phoenixLiveViewProfile.isMatch(this._request)) {
            this._name = phoenixLiveViewProfile.functions.getName(
                this._request.params
            );
            this._tag = phoenixLiveViewProfile.functions.getTag(this._request);
            this._params = phoenixLiveViewProfile.functions.getParams(
                this._request.params
            );
            this._result = phoenixLiveViewProfile.functions.getResult(
                this._request.result
            );
            this._isError = phoenixLiveViewProfile.functions.isError(
                this._request
            );
        } else {
            this._name = 'WebSocket';
            this._tag = 'WS';
            this._params = { raw: this._request.params };
            this._result = { raw: this._request.result };
        }
    }

    shouldShow(cfg: SearchConfig = {}): boolean {
        const { searchValue, marker, filterValue } = cfg;
        const byFilterValue = filterValue
            ? this.getName().includes(filterValue)
            : true;
        if (searchValue && marker) {
            //2 params match
            // TODO mutation is bad
            const content = this.getContent();
            return (
                byFilterValue &&
                (isVisible({ params: this.getParams() }, 'params', marker) ||
                    isVisible(
                        {
                            content: isMimeType(content)
                                ? content.__getRaw()
                                : content
                        },
                        'content',
                        marker
                    ))
            );
        }
        return byFilterValue;
    }

    getName(): string {
        return this._name || 'WebSocket';
    }

    getTag(): string {
        return this._tag || 'WS';
    }

    isError(): boolean {
        return this._isError;
    }

    static fromJSON(input: Entry): WebSocketItem {
        return new WebSocketItem({
            __type: 'websocket',
            timestamp: new Date(input.startedDateTime).getTime(),
            duration: input.time,
            params: input.request.postData?.text || '',
            result: input.response.content.text || '',
            isError: input.response.statusText === 'error',
            meta: {
                request: {
                    title: 'Request',
                    items: input.request.headers
                },
                response: {
                    title: 'Response',
                    items: input.response.headers
                }
            }
        });
    }

    toJSON(): Entry {
        return {
            startedDateTime: new Date(this.timestamp).toISOString(),
            time: this._duration || 0,
            comment: this.type,
            request: {
                method: this._tag,
                url: this._name,
                httpVersion: '',
                cookies: [],
                headers: this._meta?.request.items || [],
                queryString: [],
                postData: {
                    mimeType: 'application/json',
                    text: this._request.params
                },
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: 200,
                statusText: this.isError() ? 'error' : 'ok',
                httpVersion: '',
                cookies: [],
                headers: this._meta?.response.items || [],
                content: {
                    size: -1,
                    mimeType: 'text/plain',
                    text: this._request.result
                },
                redirectURL: '',
                headersSize: -1,
                bodySize: -1
            },
            cache: {},
            timings: {
                wait: 0,
                receive: 0
            }
        };
    }

    getParams(): IItemTransactionCfg['params'] {
        return this._params;
    }

    getMeta(): PropTreeProps['data'] | null {
        return this._meta;
    }

    getContent(): TContent {
        return this._result as TContent;
    }

    getDuration(): number {
        return this._duration || 0;
    }
}
