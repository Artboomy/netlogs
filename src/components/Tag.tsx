import React from 'react';
import { google, solarized } from 'base16';
import { theme } from 'theme/light';
import styled from '@emotion/styled';
import { ItemType } from 'models/enums';

const Container = styled.div<{ active: boolean }>(
    ({ theme, active, color }) => ({
        display: 'inline-block',
        boxSizing: 'border-box',
        borderRadius: '20px',
        fontSize: '10px',
        padding: '2px 6px',
        marginRight: '4px',
        height: '16px',
        lineHeight: '12px',
        userSelect: 'none',
        ...(active
            ? {
                  color: google.base07,
                  backgroundColor: color || google.base03
              }
            : {
                  color: theme.inactiveTag,
                  backgroundColor: 'transparent',
                  border: `1px ${theme.inactiveTag} dashed`
              })
    })
);
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
    if (type === ItemType.Pending) {
        return color ? color : google.base0A; // Yellow/orange for pending
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
    return (
        <Container active={active} color={computedColor}>
            {content}
        </Container>
    );
};
