import React, { FC } from 'react';
import { useListStore } from 'controllers/network';
import { Tag } from './Tag';
import { google } from 'base16';
import { useSettings } from 'hooks/useSettings';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';
import { ItemType } from 'models/enums';
import { useShallow } from 'zustand/react/shallow';

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

export const TagList: FC = () => {
    const list = useListStore(useShallow((state) => state.list));
    const hiddenTags = useSettings(
        useShallow((state) => state.settings.hiddenTags)
    );
    const tags: Record<
        string,
        {
            color?: string;
            content: string;
            type: ItemType;
        }
    > = {};
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
    const handleClick = (tag: string) => {
        const clonedTags: Record<string, string> = structuredClone(hiddenTags);
        if (clonedTags[tag]) {
            delete clonedTags[tag];
        } else {
            clonedTags[tag] = tag;
        }
        useSettings.getState().setSettings({
            ...useSettings.getState().settings,
            ...{ hiddenTags: clonedTags }
        });
    };
    const values = Object.values(tags);
    return (
        <Container>
            {!values.length && i18n.t('noTags')}
            {values.map(({ content, color, type }) => (
                <Button
                    key={content}
                    type='button'
                    onClick={() => handleClick(content)}>
                    <Tag
                        content={content}
                        type={type}
                        color={color}
                        active={!hiddenTags[content]}
                    />
                </Button>
            ))}
        </Container>
    );
};
