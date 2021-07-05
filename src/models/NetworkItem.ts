import { nanoid } from 'nanoid';
import settings from '../controllers/settings';
import { IProfile } from '../controllers/settings/types';
import { TransactionItemAbstract } from './TransactionItem';
import { Entry } from 'har-format';
import {
    IContentItem,
    IItemNetworkCfg,
    ItemType,
    NetworkRequest,
    SearchConfig
} from './types';
import { PropTreeProps } from '../components/PropTree';
import { isVisible } from 'react-inspector';
import { isMimeType } from '../components/InspectorWrapper';

function injectMimeType<T>(obj: T, mimeType: string): void {
    Object.defineProperty(obj, '__mimeType', {
        enumerable: false,
        writable: false,
        value: mimeType
    });
}

type TContent = Record<string, unknown>;
export default class NetworkItem
    implements TransactionItemAbstract, IContentItem<TContent> {
    public id = '';
    private readonly _request: NetworkRequest;
    public readonly type: ItemType = ItemType.Transaction;
    public readonly timestamp: number;
    private _baseShouldShow = true;
    private _lastShouldShowCfg: SearchConfig | null = null;
    private _lastShouldShow = true;

    /* computed fields */
    private _name = '';
    private _tag = '';
    private _isError = false;
    private _params: Record<string, unknown> = {};
    private _meta: PropTreeProps['data'] | null = null;
    private _content: TContent = {};
    private readonly _duration: number;

    constructor(cfg: IItemNetworkCfg) {
        this._request = cfg.request;
        this.timestamp = new Date(this._request.startedDateTime).getTime();
        this._duration = Object.entries(this._request.timings)
            .filter(([k, t]) => !k.startsWith('_') && t !== -1)
            .reduce((acc, [_, t]) => t + acc, 0);
        this.setComputedFields();
    }

    setComputedFields(): void {
        // this ensures rerender of rows
        this.id = nanoid();
        const functions = settings.getFunctions(this._request);
        this._name = functions.getName(this._request);
        this._tag = functions.getTag(this._request);
        this._isError = functions.isError(this._request);
        this._params = functions.getParams(this._request);
        this._meta = functions.getMeta(this._request);
        this._content = this._computeContent();
        this._baseShouldShow = functions.shouldShow(this._request);
    }

    getFunctions(): IProfile['functions'] {
        return settings.getFunctions(this._request);
    }

    getName(): string {
        return this._name;
    }

    getTag(): string {
        return this._tag;
    }

    isError(): boolean {
        return this._isError;
    }

    static fromJSON(request: Entry): NetworkItem {
        return new NetworkItem({ request });
    }

    toJSON(): Entry {
        return this._request;
    }

    // TODO: refactor multireturn
    shouldShow(cfg: SearchConfig = {}): boolean {
        if (cfg === this._lastShouldShowCfg) {
            return this._lastShouldShow;
        }
        const { searchValue, marker, filterValue } = cfg;
        this._lastShouldShowCfg = cfg;
        if (!this._baseShouldShow) {
            return false;
        }
        const byFilterValue = filterValue
            ? this._request.request.url.includes(filterValue)
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

    getParams(): Record<string, unknown> {
        return this._params;
    }

    getMeta(): PropTreeProps['data'] | null {
        return this._meta;
    }

    getContent(): TContent {
        return this._content;
    }

    private _computeContent(): TContent {
        let result;
        if (this._request.response) {
            const content = this._request.response.content.text;
            const mimeType = this._request.response.content.mimeType;
            const obj = {};
            const convertedContent = this.getFunctions().getResult(
                this._request,
                content
            );
            Object.defineProperty(obj, '__getRaw', {
                enumerable: false,
                writable: false,
                value: () => convertedContent
            });
            injectMimeType(obj, mimeType);
            result = obj;
        } else {
            result = {
                __message__: 'NETLOGS: no response yet'
            };
        }
        return result;
    }

    getDuration(): number {
        return this._duration;
    }
}
