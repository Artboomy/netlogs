import React from 'react';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';
import { ItemType } from '../models/types';

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
    type: ItemType;
};
export const Tag: React.FC<TProps> = ({ color, content, type }) => {
    const computedColor =
        type === ItemType.Transaction
            ? color
            : ['NEXT', 'NUXT'].includes(content)
            ? google.base0B
            : google.base0C;
    const styles = useStyles(computedColor);
    return <div className={styles.root}>{content}</div>;
};
