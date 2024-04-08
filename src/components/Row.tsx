import React, {
    memo,
    MouseEventHandler,
    useContext,
    useEffect,
    useRef
} from 'react';
import ContentOnlyItem from '../models/ContentOnlyItem';
import { TransactionItemAbstract } from 'models/TransactionItem';
import { google } from 'base16';
import { Tag } from './Tag';
import { PropTree } from './PropTree';
import { ModalContext } from './modal/Context';
import { ContentOnly } from './row/ContentOnly';
import { Transaction } from './row/Transaction';
import { mediaQuerySmallOnly } from 'utils';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';

const Date = styled.div<{
    clickable: boolean;
    contentOnly: boolean;
    oddRow: boolean;
}>(({ theme, clickable, contentOnly, oddRow }) => ({
    color: theme.dateColor,
    fontSize: '12px',
    padding: '4px 4px 4px 8px',
    whiteSpace: 'nowrap',
    ...(clickable && {
        cursor: 'pointer',
        textDecoration: 'underline'
    }),
    ...(contentOnly && {
        [mediaQuerySmallOnly]: {
            gridColumn: '1/3'
        }
    }),
    ...(oddRow && {
        backgroundColor: theme.oddRowBg
    })
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
    const { setValue } = useContext(ModalContext);
    const theme = useTheme();
    const tag = item.getTag();
    const meta = item.getMeta();
    const shouldClean = useRef(false);
    const handleClick: MouseEventHandler = (e) => {
        if (e.target === e.currentTarget) {
            if (meta) {
                setValue(<PropTree data={meta} />);
                shouldClean.current = true;
            }
        }
    };
    useEffect(() => {
        return () => {
            if (shouldClean.current) {
                setValue(null);
                shouldClean.current = false;
            }
        };
    }, []);
    const commonProps = {
        css: idx % 2 ? { backgroundColor: theme.oddRowBg } : {},
        date: (
            <Date
                clickable={!!meta}
                contentOnly={item instanceof ContentOnlyItem}
                oddRow={Boolean(idx % 2)}
                onClick={handleClick}>
                {item.getDuration().toFixed(2)} ms
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
