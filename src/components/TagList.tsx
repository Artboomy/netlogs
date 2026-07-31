import React, { FC, useEffect, useRef } from 'react';
import { useListStore } from 'controllers/network';
import { Tag } from './Tag';
import { google } from 'base16';
import { useSettings } from 'hooks/useSettings';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';
import { ItemType } from 'models/enums';
import { useShallow } from 'zustand/react/shallow';
import { useTempSettings } from 'hooks/useTempSettings';
import { isTagVisible } from './tagFilter';

const Container = styled.div({
    display: 'flex',
    flexWrap: 'wrap'
});

const Button = styled.button({
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
    background: 'none'
});

const DOUBLE_TAP_DELAY_MS = 300;

export const TagList: FC = () => {
    const list = useListStore(useShallow((state) => state.list));
    const hiddenTags = useSettings(
        useShallow((state) => state.settings.hiddenTags)
    );
    const selectedTag = useTempSettings((state) => state.selectedTag);
    const pendingClickTimersRef = useRef(new Map<string, number>());
    const tags: Record<
        string,
        {
            color?: string;
            content: string;
            type: ItemType;
        }
    > = {};

    useEffect(() => {
        return () => {
            pendingClickTimersRef.current.forEach((timeoutId) => {
                window.clearTimeout(timeoutId);
            });
            pendingClickTimersRef.current.clear();
        };
    }, []);

    list.forEach((item) => {
        const tag = item.getTag();
        if (!tags[tag]) {
            tags[tag] = {
                content: item.getTag(),
                color: item.isError() ? google.base08 : undefined,
                type: item.type
            };
        }
    });

    const commitTagToggle = (tag: string) => {
        useTempSettings.setState({ selectedTag: null });
        const settingsState = useSettings.getState();
        const clonedTags: Record<string, string> = structuredClone(
            settingsState.settings.hiddenTags
        );
        if (clonedTags[tag]) {
            delete clonedTags[tag];
        } else {
            clonedTags[tag] = tag;
        }
        settingsState.setSettings({
            ...settingsState.settings,
            hiddenTags: clonedTags
        });
    };

    const handleClick = (tag: string) => {
        if (pendingClickTimersRef.current.has(tag)) {
            return;
        }
        const timeoutId = window.setTimeout(() => {
            pendingClickTimersRef.current.delete(tag);
            commitTagToggle(tag);
        }, DOUBLE_TAP_DELAY_MS);
        pendingClickTimersRef.current.set(tag, timeoutId);
    };

    const handleDoubleClick = (tag: string) => {
        const timeoutId = pendingClickTimersRef.current.get(tag);
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            pendingClickTimersRef.current.delete(tag);
        }
        useTempSettings.setState((state) => ({
            selectedTag: state.selectedTag === tag ? null : tag
        }));
    };

    const values = Object.values(tags);
    return (
        <Container>
            {!values.length && i18n.t('noTags')}
            {values.map(({ content, color, type }) => (
                <Button
                    key={content}
                    type='button'
                    onClick={() => handleClick(content)}
                    onDoubleClick={() => handleDoubleClick(content)}>
                    <Tag
                        content={content}
                        type={type}
                        color={color}
                        active={isTagVisible(content, {
                            hiddenTags,
                            selectedTag
                        })}
                    />
                </Button>
            ))}
        </Container>
    );
};
