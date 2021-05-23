import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { theme } from '../theme/light';

const useStyles = createUseStyles({
    root: {
        backgroundColor: theme.panelColor,
        borderTop: `1px solid ${theme.borderColor}`,
        padding: '2px 4px',
        display: 'flex',
        justifyContent: 'space-between'
    }
});
export const Footer: FC<{
    value: string;
    onValueChange: (newValue: string) => void;
}> = ({ value, onValueChange }) => {
    const styles = useStyles();
    return (
        <footer className={styles.root}>
            <input
                type='text'
                placeholder='Filter by url'
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
            />
            <a
                href='https://github.com/Artboomy/netlogs'
                target='_blank'
                rel='noreferrer'>
                Github
            </a>
        </footer>
    );
};
