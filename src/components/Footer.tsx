import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { theme } from '../theme/light';
import { IconButton, ICONS } from './IconButton';
import { TagList } from './TagList';
import { useSettings } from '../hooks/useSettings';

const useStyles = createUseStyles({
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
    }
});
export const Footer: FC<{
    value: string;
    onValueChange: (newValue: string) => void;
    visibleCount?: number;
    totalCount?: number;
}> = ({ value, onValueChange, visibleCount = 0, totalCount = 0 }) => {
    const styles = useStyles();
    const [settings, setSettings] = useSettings();
    const { tagsToolbarVisible } = settings;
    const setTagListVisible = (newValue: boolean) => {
        setSettings({
            ...settings,
            tagsToolbarVisible: newValue
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
                </span>

                <a
                    href='https://github.com/Artboomy/netlogs'
                    target='_blank'
                    rel='noreferrer'>
                    Github
                </a>
            </div>
        </footer>
    );
};
