import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { IconButton, ICONS } from './IconButton';
import { TagList } from './TagList';
import { useSettings } from '../hooks/useSettings';
import { useListStore } from '../controllers/network';
import { Link } from './Link';
import runtime from '../api/runtime';
import { Theme } from '../theme/types';

const useStyles = createUseStyles<Theme>((theme) => ({
    root: {
        backgroundColor: theme.panelColor,
        borderTop: `1px solid ${theme.borderColor}`
    },
    row: {
        padding: '2px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    countWrapper: {
        marginLeft: '8px',
        marginRight: 'auto'
    },
    version: {
        fontStyle: 'italic',
        paddingRight: '4px'
    },
    themeButton: {
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '6px',
        marginRight: '4px',
        width: '24px',
        height: '24px',
        display: 'flex',
        justifyContent: 'center',
        cursor: 'pointer'
    }
}));
export const Footer: FC<{
    value: string;
    onValueChange: (newValue: string) => void;
}> = ({ value, onValueChange }) => {
    const styles = useStyles();
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
        <footer className={styles.root}>
            {tagsToolbarVisible && (
                <div className={styles.row}>
                    <TagList />
                </div>
            )}
            <div className={styles.row}>
                <IconButton
                    icon={ICONS.panelUp}
                    onClick={() => setTagListVisible(!tagsToolbarVisible)}
                    title='Tag list'
                    active={tagsToolbarVisible}
                />
                <input
                    type='text'
                    placeholder='Filter by url'
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                />
                <span className={styles.countWrapper}>
                    {visibleCount} / {totalCount} requests
                    {isPreserve && ', log preserved'}
                </span>
                <button
                    className={styles.themeButton}
                    onClick={handleThemeChange}
                    title='Change theme'>
                    {settings.theme === 'light' ? '🌞' : '🌑'}
                </button>
                <div className={styles.version}>v.{version}</div>
                <Link
                    text='Github'
                    href='https://github.com/Artboomy/netlogs'
                />
            </div>
        </footer>
    );
};
