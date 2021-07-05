import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { theme } from '../theme/light';

const useStyles = createUseStyles({
    root: {
        backgroundColor: theme.panelColor,
        borderTop: `1px solid ${theme.borderColor}`,
        padding: '2px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
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
    return (
        <footer className={styles.root}>
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
        </footer>
    );
};
