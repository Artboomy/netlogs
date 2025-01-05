import { nanoid } from 'nanoid';
import {
    IContentItem,
    IItemTransactionCfg,
    IItemWebSocketCfg,
    SearchConfig
} from './types';
import { PropTreeProps } from 'components/PropTree';
import { Entry } from 'har-format';
import { isVisible } from 'react-inspector';
import { isMimeType } from 'components/InspectorWrapper';
import { TransactionItemAbstract } from './TransactionItem';
import { phoenixLiveViewProfile } from 'controllers/settings/profiles/phoenixLiveView';
import { isSerializedObject } from 'utils';
import { ItemType } from 'models/enums';

type TContent = IItemTransactionCfg['result'];
export default class WebSocketItem
    implements TransactionItemAbstract, IContentItem<TContent>
{
    public readonly id: string;
    public readonly type: ItemType = ItemType.WebSocket;
    public readonly timestamp: number;
    private _name = '';
    private _result: TContent | unknown = {};
    private readonly _request: IItemWebSocketCfg;
    private _isError: boolean;
    private _params: IItemTransactionCfg['params'] = {};
    private _tag = '';
    private _meta: IItemWebSocketCfg['meta'];
    private readonly _duration: number = 0;

    constructor(cfg: IItemWebSocketCfg) {
        this.id = nanoid();
        this.timestamp = cfg.timestamp;
        this._isError = cfg.isError;
        this._request = cfg;
        this.setComputedFields();
    }

    setComputedFields(): void {
        if (phoenixLiveViewProfile.isMatch(this._request)) {
            this._name = phoenixLiveViewProfile.functions.getName(
                this._request.params || this._request.result
            );
            this._tag = phoenixLiveViewProfile.functions.getTag(
                this._request,
                this._name
            );
            this._params = phoenixLiveViewProfile.functions.getParams(
                this._request.params
            );
            this._result = phoenixLiveViewProfile.functions.getResult(
                this._request.result
            );
            this._isError = phoenixLiveViewProfile.functions.isError(
                this._request
            );
            this._meta = phoenixLiveViewProfile.functions.getMeta(
                this._request
            );
        } else {
            if (this._request.__subtype === 'sent') {
                this._name = 'WebSocket.sent';
            } else if (this._request.__subtype === 'received') {
                this._name = 'WebSocket.received';
            } else {
                this._name = 'Websocket';
            }
            this._tag = 'WS';
            if (this._request.__subtype !== 'received') {
                if (isSerializedObject(this._request.params)) {
                    this._params = JSON.parse(this._request.params);
                    if (
                        this._params &&
                        typeof this._params === 'object' &&
                        Object.keys(this._params).length === 1 &&
                        'params' in this._params
                    ) {
                        this._params = this._params.params as Record<
                            string,
                            unknown
                        >;
                    }
                } else {
                    this._params = { raw: this._request.params };
                }
            }
            if (this._request.__subtype !== 'sent') {
                if (isSerializedObject(this._request.result)) {
                    this._result = JSON.parse(this._request.result);
                    if (
                        this._result &&
                        typeof this._result === 'object' &&
                        Object.keys(this._result).length === 1 &&
                        'result' in this._result
                    ) {
                        this._result = this._result.result as Record<
                            string,
                            unknown
                        >;
                    }
                } else {
                    this._result = { raw: this._request.result };
                }
            }
            this._meta = {
                request: {
                    title: 'Request',
                    items: [{ name: 'RAW', value: this._request.params }]
                },
                response: {
                    title: 'Response',
                    items: [{ name: 'RAW', value: this._request.result }]
                }
            };
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
            params: input.request.postData?.text || '',
            result: input.response.content.text || '',
            isError: input.response.statusText === 'error'
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
        return this._meta || null;
    }

    getContent(): TContent {
        return this._result as TContent;
    }

    getDuration(): number {
        return this._duration || 0;
    }
}
