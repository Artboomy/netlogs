import { describe, expect, it, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTempSettings } from './useTempSettings';

afterEach(() => {
    act(() => {
        useTempSettings.setState({
            isVerticalView: false,
            selectedTag: null
        });
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

    it('tracks the temporary selected tag', () => {
        const { result } = renderHook(() => useTempSettings());

        act(() => {
            useTempSettings.setState({ selectedTag: 'alpha' });
        });

        expect(result.current.selectedTag).toBe('alpha');
    });
});
