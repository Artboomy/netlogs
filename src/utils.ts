import { useEffect, useState } from 'react';
import { EventName, IframeEvent, Logs } from './types';
import { nanoid } from 'nanoid';

export const mediaQuerySmallOnly = '@media (max-width: 700px)';

export default function downloadAsFile(
    data: string,
    filename: string,
    type = 'text/plain'
): void {
    const file = new Blob([data], { type });
    if (window.navigator.msSaveOrOpenBlob)
        // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else {
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

export function subscribeParent(
    name: EventName,
    handler: (data: string) => unknown
): void {
    window.addEventListener('message', function listener(event) {
        if (isIframeEvent(event) && event.data.type === name) {
            handler(event.data.data);
        }
    });
}

export function postSandbox(payload: IframeEvent): void {
    const iframe = document.getElementById('sandbox') as HTMLIFrameElement;
    iframe.contentWindow?.postMessage(payload, '*');
}

export function isSandbox(): boolean {
    return location.pathname.includes('sandbox');
}
