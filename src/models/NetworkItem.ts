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
    public readonly id: string;
    private readonly _request: NetworkRequest;
    public readonly type: ItemType = ItemType.Transaction;
    public readonly timestamp: number;
    private _baseShouldShow: boolean;
    private _lastShouldShowCfg: SearchConfig | null = null;
    private _lastShouldShow = true;

    constructor(cfg: IItemNetworkCfg) {
        this.id = nanoid();
        this._request = cfg.request;
        this.timestamp = new Date(this._request.startedDateTime).getTime();
        this._baseShouldShow = this.getFunctions().shouldShow(this._request);
    }

    getFunctions(): IProfile['functions'] {
        return settings.getFunctions(this._request);
    }

    getName(): string {
        console.count(`getName${this.id}`);
        return this.getFunctions().getName(this._request);
    }

    getTag(): string {
        console.count(`getTag${this.id}`);
        return this.getFunctions().getTag(this._request);
    }

    isError(): boolean {
        console.count(`isError${this.id}`);
        return this.getFunctions().isError(this._request);
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
        console.count(`shouldShow${this.id}`);
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
        return this.getFunctions().getParams(this._request);
    }

    getMeta(): PropTreeProps['data'] | null {
        return this.getFunctions().getMeta(this._request);
    }

    getContent(): TContent {
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
        return Object.entries(this._request.timings)
            .filter(([k, t]) => !k.startsWith('_') && t !== -1)
            .reduce((acc, [_, t]) => t + acc, 0);
    }
}
