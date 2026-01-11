import { afterEach, describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';
import { defaultSettings } from 'controllers/settings/base';

afterEach(() => {
    act(() => {
        useSettings.getState().deinit();
        useSettings.setState({ settings: defaultSettings });
    });
    window.localStorage.clear();
});

describe('useSettings', () => {
    it('patches settings after initialization', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
            result.current.init();
            result.current.patchSettings({ theme: 'dark' });
        });

        expect(result.current.settings.theme).toBe('dark');
    });

    it('resets settings to defaults', async () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
            result.current.init();
            result.current.setSettings({ ...defaultSettings, theme: 'dark' });
        });

        await act(async () => {
            await result.current.resetSettings();
        });

        expect(result.current.settings).toEqual(defaultSettings);
    });
});
