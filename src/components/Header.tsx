import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';
import cn from 'classnames';
import { useListStore } from '../controllers/network';
import runtime from '../api/runtime';

const useStyles = createUseStyles({
    root: {
        display: 'flex',
        backgroundColor: google.base06,
        padding: '2px 4px',
        zIndex: 2,
        alignItems: 'baseline',
        gap: '8px'
    },
    version: {
        fontStyle: 'italic'
    },
    optionsButton: {
        marginLeft: 'auto'
    }
});

interface IProps {
    className?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header: FC<IProps> = ({
    className,
    searchValue,
    onSearchChange
}) => {
    const styles = useStyles();
    const { version } = runtime.getManifest();
    const { clear } = useListStore();
    return (
        <header className={cn(styles.root, className)}>
            <button onClick={clear}>Clear</button>
            <input
                type='text'
                placeholder='Search in params/result'
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
                className={styles.optionsButton}
                onClick={() => runtime.openOptionsPage()}>
                Options
            </button>
            <div className={styles.version}>v.{version}</div>
        </header>
    );
};
