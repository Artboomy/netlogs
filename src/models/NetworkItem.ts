import { nanoid } from 'nanoid';
import settings from '../controllers/settings';
import { IProfile } from '../controllers/settings/types';
import { TransactionItemAbstract } from './TransactionItem';
import {
    IContentItem,
    IItemNetworkCfg,
    ItemType,
    NetworkRequest
} from './types';
import { PropTreeProps } from '../components/PropTree';

function extractContent(request: NetworkRequest): Promise<string | undefined> {
    return new Promise((resolve) => {
        if ('getContent' in request) {
            request.getContent((content) => {
                resolve(content);
            });
        } else {
            resolve(request.response.content.text);
        }
    });
}

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

    constructor(cfg: IItemNetworkCfg) {
        this.id = nanoid();
        this._request = cfg.request;
        this.timestamp = new Date(this._request.startedDateTime).getTime();
    }

    getFunctions(): IProfile['functions'] {
        return settings.getFunctions(this._request.request.url);
    }

    getName(): string {
        return this.getFunctions().getName(this._request);
    }

    getTag(): string {
        return this.getFunctions().getTag(this._request);
    }

    isError(): boolean {
        return this.getFunctions().isError(this._request);
    }

    shouldShow(): boolean {
        return this.getFunctions().shouldShow(this._request);
    }

    getParams(): Record<string, unknown> {
        return this.getFunctions().getParams(this._request);
    }

    getMeta(): PropTreeProps['data'] | null {
        return this.getFunctions().getMeta(this._request);
    }

    async getContent(): Promise<TContent> {
        return new Promise((resolve) => {
            if (!this.shouldShow()) {
                resolve({});
            } else if (this._request.response) {
                extractContent(this._request).then((content) => {
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
                    resolve(obj);
                });
            } else {
                resolve({
                    __message__: 'NETLOGS: no response yet'
                });
            }
            return undefined;
        });
    }
}
