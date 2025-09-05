import { EventName, IframeEvent } from './types';
import { nanoid } from 'nanoid';
import { ItemList } from 'controllers/network';

export const mediaQuerySmallOnly = '@media (max-width: 700px)';

export default function downloadAsFile(
    data: string,
    filename: string,
    type = 'text/plain'
): void {
    const file = new Blob([data], { type });
    // Others
    const a = document.createElement('a'),
        url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

export function isIframeEvent(
    event: MessageEvent
): event is MessageEvent<IframeEvent> {
    return (
        typeof event.data === 'object' &&
        'id' in event.data &&
        'data' in event.data
    );
}

export function createEventPayload(name: EventName, data = ''): IframeEvent {
    return {
        id: nanoid(),
        type: name,
        data: data
    };
}

export function callParentVoid(name: EventName, data?: string): void {
    const eventPayload = createEventPayload(name, data);
    window.parent.postMessage(eventPayload, '*');
}

export function callParent(
    name: EventName,
    data?: string
): Promise<IframeEvent['data']> {
    return new Promise((resolve) => {
        const eventPayload = createEventPayload(name, data);
        window.addEventListener('message', function listener(responseEvent) {
            if (
                isIframeEvent(responseEvent) &&
                responseEvent.data.id === eventPayload.id
            ) {
                window.removeEventListener('message', listener);
                resolve(responseEvent.data.data);
            }
        });
        window.parent.postMessage(eventPayload, '*');
    });
}

const handlers: Array<{
    name: EventName;
    handler: (data: string) => unknown;
}> = [];

if (isExtension()) {
    window.addEventListener('message', function listener(event) {
        handlers.forEach((item) => {
            if (isIframeEvent(event) && event.data.type === item.name) {
                item.handler(event.data.data);
            }
        });
    });
}

export function subscribeParent(
    name: EventName,
    handler: (data: string) => unknown
): void {
    handlers.push({ name, handler });
}

export function isExtension(): boolean {
    return Boolean(window.chrome?.devtools);
}

export function postSandbox(payload: IframeEvent): void {
    const iframe = document.getElementById('sandbox') as HTMLIFrameElement;
    iframe.contentWindow?.postMessage(payload, '*');
}

export function isSandbox(): boolean {
    return location.pathname.includes('sandbox');
}

export const nameTrimmer = (value: string, limit = 100): string =>
    value.length > limit ? value.slice(0, limit) + '…' : value;

export const createSearchMarker =
    (searchValue: string) =>
    (k: unknown, v: unknown): boolean => {
        return (
            String(k).includes(searchValue) || String(v).includes(searchValue)
        );
    };

export const insertSorted = (
    item: ItemList[number] | undefined,
    items: ItemList
): ItemList => {
    if (!item) {
        return items;
    }
    let newArr: ItemList = [];
    let isLast = true;
    if (items.length === 0) {
        newArr.push(item);
    } else {
        for (let i = 0, len = items.length; i < len; i++) {
            if (item.timestamp < items[i].timestamp) {
                isLast = false;
                newArr = [...items.slice(0, i), item, ...items.slice(i)];
                break;
            }
        }
        if (isLast) {
            newArr = [...items, item]; //add to the end
        }
    }
    return newArr;
};

export const download = (fileName: string, blob: Blob): void => {
    const a = document.createElement('a');
    document.body.appendChild(a);

    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
};

export const isMacOs = (): boolean => navigator.userAgent.includes('Mac OS X');
export const isSerializedObject = (input: string): boolean => {
    return (
        (input.startsWith('{') && input.endsWith('}')) ||
        (input.startsWith('[') && input.endsWith(']'))
    );
};

export const isSerializedMultipartFormData = (input: string): boolean => {
    return input.includes('WebKitFormBoundary');
};

export const isSerializedFormData = (input: unknown): boolean => {
    if (typeof input !== 'string') {
        return false;
    }

    try {
        // Check if the string has the correct content type format
        if (!input.includes('=')) {
            return false;
        }

        const params = new URLSearchParams(input);

        // Check if all parts are valid key-value pairs
        const parts = input.split('&');
        return (
            parts.every((part) => {
                // Each part must have exactly one '=' character
                const pair = part.split('=');
                // sanity check against ico files in octet stream which have = at the end
                const veryLongKey = pair[0].length > 200;
                return pair.length === 2 && !veryLongKey;
            }) && params.size > 0
        );
    } catch (_e) {
        return false;
    }
};
