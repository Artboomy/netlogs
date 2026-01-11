import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHotkey } from './useHotkey';

describe('useHotkey', () => {
    it('invokes handler for matching window message', () => {
        const handler = vi.fn();
        const { unmount } = renderHook(() =>
            useHotkey('netlogs:toggle', handler, [handler])
        );
        const wrongTypeEvent = new MessageEvent('message', {
            data: { type: 'netlogs:other' },
            source: window
        });
        const wrongSourceEvent = new MessageEvent('message', {
            data: { type: 'netlogs:toggle' }
        });
        const matchingEvent = new MessageEvent('message', {
            data: { type: 'netlogs:toggle' },
            source: window
        });

        act(() => {
            window.dispatchEvent(wrongTypeEvent);
            window.dispatchEvent(wrongSourceEvent);
            window.dispatchEvent(matchingEvent);
        });

        expect(handler).toHaveBeenCalledTimes(1);

        unmount();
    });
});
