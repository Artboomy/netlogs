import React from 'react';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';
import { ItemType } from '../models/types';
import { theme } from '../theme/light';

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

function getColor(
    color: string | undefined,
    content: string,
    type: ItemType
): string | undefined {
    if (['NEXT', 'NUXT'].includes(content)) {
        return google.base0B;
    }
    if (['GQL'].includes(content) && !color) {
        return theme.graphql;
    }
    if (type === ItemType.Transaction) {
        return color;
    }
    return google.base0C;
}

export const Tag: React.FC<TProps> = ({ color, content, type }) => {
    const computedColor = getColor(color, content, type);
    const styles = useStyles(computedColor);
    return <div className={styles.root}>{content}</div>;
};
