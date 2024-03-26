import React from 'react';
import { createUseStyles } from 'react-jss';
import { google, solarized } from 'base16';
import { ItemType } from '../models/types';
import { theme } from '../theme/light';
import cn from 'classnames';
import { Theme } from '../theme/types';

const useStyles = createUseStyles<Theme>((theme) => ({
    root: {
        display: 'inline-block',
        boxSizing: 'border-box',
        borderRadius: '20px',
        fontSize: '10px',
        padding: '2px 6px',
        marginRight: '4px',
        height: '16px',
        lineHeight: '12px',
        userSelect: 'none'
    },
    active: {
        color: google.base07,
        backgroundColor: (color) => color || google.base03
    },
    inactive: {
        color: theme.inactiveTag,
        backgroundColor: 'transparent',
        border: `1px ${theme.inactiveTag} dashed`
    }
}));
type TProps = {
    color?: string;
    content: string;
    type: ItemType;
    active?: boolean;
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
    if (content.includes('LV') && !color) {
        return theme.phoenixLiveView;
    }
    if (type === ItemType.Transaction) {
        return color;
    }
    if (type === ItemType.WebSocket) {
        return color ? color : solarized.base0B;
    }
    return google.base0C;
}

export const Tag: React.FC<TProps> = ({
    color,
    content,
    type,
    active = true
}) => {
    const computedColor = getColor(color, content, type);
    const styles = useStyles(computedColor);
    return (
        <div
            className={cn(
                styles.root,
                active ? styles.active : styles.inactive
            )}>
            {content}
        </div>
    );
};
