import React from 'react';
import { ThemeProvider } from '@emotion/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TagList } from './TagList';
import { theme as lightTheme } from 'theme/light';
import { useListStore, type AnyItem } from 'controllers/network';
import { useSettings } from 'hooks/useSettings';
import { useTempSettings } from 'hooks/useTempSettings';
import { defaultSettings } from 'controllers/settings/base';
import { ItemType } from 'models/enums';

const renderTagList = () =>
    render(
        React.createElement(ThemeProvider, {
            theme: lightTheme,
            children: React.createElement(TagList)
        })
    );

const tagItem = {
    getTag: () => 'alpha',
    isError: () => false,
    type: ItemType.Transaction
} as const;

afterEach(() => {
    vi.useRealTimers();
    act(() => {
        useSettings.getState().deinit();
        useSettings.setState({ settings: defaultSettings });
        useTempSettings.setState({
            isVerticalView: false,
            selectedTag: null
        });
        useListStore.setState({
            list: [],
            totalCount: 0,
            visibleCount: 0,
            mimeTypes: new Set(),
            isDynamic: true,
            isPreserve: false,
            isUnpack: true
        });
    });
    globalThis.localStorage?.clear();
});

describe('TagList', () => {
    it('keeps single taps in settings and double taps ephemeral', () => {
        vi.useFakeTimers();
        act(() => {
            useSettings.getState().init();
            useSettings.setState({
                settings: { ...defaultSettings, hiddenTags: {} }
            });
            useListStore.setState({ list: [tagItem as unknown as AnyItem] });
        });

        renderTagList();
        const button = screen.getByRole('button', { name: 'alpha' });

        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.doubleClick(button);
        expect(useTempSettings.getState().selectedTag).toBe('alpha');
        expect(useSettings.getState().settings.hiddenTags).toEqual({});

        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.doubleClick(button);
        expect(useTempSettings.getState().selectedTag).toBeNull();
        expect(useSettings.getState().settings.hiddenTags).toEqual({});

        fireEvent.click(button);
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(useTempSettings.getState().selectedTag).toBeNull();
        expect(useSettings.getState().settings.hiddenTags).toEqual({
            alpha: 'alpha'
        });
    });
});
