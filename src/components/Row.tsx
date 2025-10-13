import React, { memo, MouseEventHandler } from 'react';
import ContentOnlyItem from '../models/ContentOnlyItem';
import { TransactionItemAbstract } from 'models/TransactionItem';
import { google } from 'base16';
import { Tag } from './Tag';
import { ContentOnly } from './row/ContentOnly';
import { Transaction } from './row/Transaction';
import { mediaQuerySmallOnly } from 'utils';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { base16Darcula } from 'theme/dark';
import { useRowClickPanel } from 'components/row/useRowClickPanel';

const Date = styled.div<{
    clickable: boolean;
    contentOnly: boolean;
    oddRow: boolean;
}>(({ theme, clickable, contentOnly, oddRow }) => ({
    color: theme.dateColor,
    position: 'relative',
    fontSize: '12px',
    padding: '4px 4px 4px 8px',
    whiteSpace: 'nowrap',
    ...(clickable && {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.rowHover
        }
    }),
    ...(contentOnly && {
        [mediaQuerySmallOnly]: {
            gridColumn: '1/3'
        }
    }),
    ...(oddRow && {
        backgroundColor: theme.oddRowBg
    }),
    '&:after': {
        content: '" ms"',
        fontSize: '0.8em',
        color: theme.icon.normal
    }
}));

const DateUnderlay = styled.div<{ color: string }>(({ color }) => ({
    position: 'absolute',
    left: 0,
    height: '3px',
    bottom: 0,
    backgroundColor: color
}));

interface IRowProps {
    className?: string;
    item: ContentOnlyItem | TransactionItemAbstract;
    idx: number;
}

/*function timeToString(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.toLocaleTimeString('en-GB')}.${String(
        date.getMilliseconds()
    ).padStart(3, '0')}`;
}*/

export const Row: React.FC<IRowProps> = memo(({ item, idx }) => {
    const theme = useTheme();
    const tag = item.getTag();
    const meta = item.getMeta();
    const handleClick: MouseEventHandler = useRowClickPanel(item);
    let dateColor = google.base0B;
    const duration = item.getDuration();
    if (duration > 1000) {
        dateColor = base16Darcula.base0F;
    } else if (duration > 500) {
        dateColor = base16Darcula.base0E;
    } else if (duration > 300) {
        dateColor = google.base0A;
    }
    const durationWidth = Math.round(Math.min(duration / 1000, 1) * 100);
    const commonProps = {
        css: idx % 2 ? { backgroundColor: theme.oddRowBg } : {},
        date: (
            <Date
                clickable={!!meta}
                contentOnly={item instanceof ContentOnlyItem}
                oddRow={Boolean(idx % 2)}
                onClick={handleClick}>
                {duration.toFixed(2)}
                <DateUnderlay
                    color={dateColor}
                    style={{ right: `${100 - durationWidth}%` }}
                />
            </Date>
        ),
        tag: tag ? (
            <Tag
                content={tag}
                color={item.isError() ? google.base08 : undefined}
                type={item.type}
            />
        ) : null
    };
    return item instanceof ContentOnlyItem ? (
        <ContentOnly item={item} {...commonProps} />
    ) : (
        <Transaction item={item} {...commonProps} />
    );
});

Row.displayName = 'Row';
