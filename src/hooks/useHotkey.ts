import { useEffect } from 'react';

export const useHotkey = (
    type: string,
    handler: () => void,
    deps: unknown[]
): void => {
    useEffect(() => {
        const listener = (e: MessageEvent) => {
            if (e.source != window) return;
            const eventType = e.data.type;
            if (type === eventType) {
                handler();
            }
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, deps);
};
