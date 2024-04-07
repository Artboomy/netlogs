import React, { FC } from 'react';
import { IconButton, ICONS } from './IconButton';
import { TagList } from './TagList';
import { useSettings } from 'hooks/useSettings';
import { useListStore } from 'controllers/network';
import { Link } from './Link';
import runtime from '../api/runtime';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';

const Container = styled.footer(({ theme }) => ({
    backgroundColor: theme.panelColor,
    borderTop: `1px solid ${theme.borderColor}`
}));

const Row = styled.div({
    padding: '2px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
});

const CountWrapper = styled.span({
    marginLeft: '8px',
    marginRight: 'auto'
});

const Version = styled.div({
    fontStyle: 'italic',
    paddingRight: '4px'
});

const ThemeButton = styled.button(({ theme }) => ({
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '6px',
    marginRight: '4px',
    width: '24px',
    height: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    flexWrap: 'wrap'
}));

export const Footer: FC<{
    value: string;
    onValueChange: (newValue: string) => void;
}> = ({ value, onValueChange }) => {
    const { version } = runtime.getManifest();
    const isPreserve = useListStore((state) => state.isPreserve);
    const visibleCount = useListStore((state) => state.visibleCount);
    const totalCount = useListStore((state) => state.totalCount);
    const [settings, setSettings] = useSettings();
    const { tagsToolbarVisible } = settings;
    const setTagListVisible = (newValue: boolean) => {
        setSettings({
            ...settings,
            tagsToolbarVisible: newValue
        });
    };
    const handleThemeChange = () => {
        setSettings({
            ...settings,
            theme: settings.theme === 'light' ? 'dark' : 'light'
        });
    };
    return (
        <Container>
            {tagsToolbarVisible && (
                <Row>
                    <TagList />
                </Row>
            )}
            <Row>
                <IconButton
                    icon={ICONS.panelUp}
                    onClick={() => setTagListVisible(!tagsToolbarVisible)}
                    title={i18n.t('tagList')}
                    active={tagsToolbarVisible}
                />
                <input
                    type='text'
                    placeholder={i18n.t('filterByUrl')}
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                />
                <CountWrapper>
                    {visibleCount} / {totalCount} {i18n.t('requests')}
                    {isPreserve && `, ${i18n.t('log preserved')}`}
                </CountWrapper>
                <ThemeButton
                    onClick={handleThemeChange}
                    title={i18n.t('changeTheme')}>
                    {settings.theme === 'light' ? '🌞' : '🌑'}
                </ThemeButton>
                <Version>v.{version}</Version>
                <Link
                    text='Github'
                    href='https://github.com/Artboomy/netlogs'
                />
            </Row>
        </Container>
    );
};
