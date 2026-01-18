import { describe, expect, it, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTempSettings } from './useTempSettings';

afterEach(() => {
    act(() => {
        useTempSettings.setState({ isVerticalView: false });
    });
});

describe('useTempSettings', () => {
    it('updates temporary view state', () => {
        const { result } = renderHook(() => useTempSettings());
        const initialValue = result.current.isVerticalView;

        act(() => {
            useTempSettings.setState({ isVerticalView: true });
        });

        expect(initialValue).toBe(false);
        expect(result.current.isVerticalView).toBe(true);
    });
});
