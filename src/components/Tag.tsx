import React from 'react';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';

const useStyles = createUseStyles({
    root: {
        display: 'inline-block',
        boxSizing: 'border-box',
        borderRadius: '20px',
        color: google.base07,
        fontSize: '0.8em',
        backgroundColor: (color) => color || google.base03,
        padding: '2px 6px',
        marginRight: '4px',
        height: '16px',
        lineHeight: '1em'
    }
});
type TProps = {
    color?: string;
    content: string;
};
export const Tag: React.FC<TProps> = ({ color, content }) => {
    const styles = useStyles(color);
    return <div className={styles.root}>{content}</div>;
};
