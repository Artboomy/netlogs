import React, { memo, MouseEventHandler } from 'react';
import ContentOnlyItem from '../models/ContentOnlyItem';
import PendingItem from '../models/PendingItem';
import { TransactionItemAbstract } from 'models/TransactionItem';
import { google } from 'base16';
import { Tag } from './Tag';
import { ContentOnly } from './row/ContentOnly';
import { Transaction } from './row/Transaction';
import { PendingDuration } from './row/PendingDuration';
import { mediaQuerySmallOnly } from 'utils';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { base16Darcula } from 'theme/dark';
import { useRowClickPanel } from 'components/row/useRowClickPanel';

const dateVerticalFragment = {
    gridColumn: '1/3'
};

const Date = styled.div<{
    clickable: boolean;
    contentOnly: boolean;
    oddRow: boolean;
    isPending?: boolean;
}>(({ theme: { isVerticalView, ...theme }, clickable, contentOnly, oddRow, isPending }) => ({
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
    ...(contentOnly && isVerticalView && dateVerticalFragment),
    ...(contentOnly && { [mediaQuerySmallOnly]: dateVerticalFragment }),
    ...(oddRow && {
        backgroundColor: theme.oddRowBg
    }),
    // Only show " ms" suffix for non-pending items (PendingDuration has its own suffix)
    ...(!isPending && {
        '&:after': {
            content: '" ms"',
            fontSize: '0.8em',
            color: theme.icon.normal
        }
    })
}));

const DateUnderlay = styled.div<{ color: string }>(({ color }) => ({
    position: 'absolute',
    left: 0,
    height: '3px',
    bottom: 0,
    backgroundColor: color,
    willChange: 'transform'
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
    const isPending = item instanceof PendingItem;

    // For pending items, we use the animated PendingDuration component
    // For regular items, use static duration with color coding
    let dateColor = google.base0B;
    const duration = item.getDuration();
    if (!isPending) {
        if (duration > 1000) {
            dateColor = base16Darcula.base0F;
        } else if (duration > 500) {
            dateColor = base16Darcula.base0E;
        } else if (duration > 300) {
            dateColor = google.base0A;
        }
    }
    const durationWidth = isPending ? 0 : Math.round(Math.min(duration / 1000, 1) * 100);

    const dateContent = isPending ? (
        <PendingDuration startTimestamp={item.timestamp} />
    ) : (
        <>
            {duration.toFixed(2)}
            <DateUnderlay
                color={dateColor}
                style={{ right: `${100 - durationWidth}%` }}
            />
        </>
    );

    const commonProps = {
        css: idx % 2 ? { backgroundColor: theme.oddRowBg } : {},
        date: (
            <Date
                clickable={!!meta}
                contentOnly={item instanceof ContentOnlyItem}
                oddRow={Boolean(idx % 2)}
                onClick={handleClick}
                isPending={isPending}>
                {dateContent}
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
