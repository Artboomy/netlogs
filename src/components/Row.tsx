import React, { memo, MouseEventHandler, useContext } from 'react';
import ContentOnlyItem from '../models/ContentOnlyItem';
import { TransactionItemAbstract } from '../models/TransactionItem';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';
import { Tag } from './Tag';
import { PropTree } from './PropTree';
import { ModalContext } from './modal/Context';
import cn from 'classnames';
import { ContentOnly } from './row/ContentOnly';
import { Transaction } from './row/Transaction';
import { mediaQuerySmallOnly } from '../utils';

const useStyles = createUseStyles(() => ({
    date: {
        color: google.base02,
        fontSize: '13px',
        padding: '4px 4px 4px 8px'
    },
    dateContentOnly: {
        [mediaQuerySmallOnly]: {
            gridColumn: '1/3'
        }
    },
    dateClickable: {
        cursor: 'pointer',
        textDecoration: 'underline'
    }
}));

interface IRowProps {
    className?: string;
    item: ContentOnlyItem | TransactionItemAbstract;
}

export const Row: React.FC<IRowProps> = memo(({ item, className }) => {
    const styles = useStyles();
    const { setValue } = useContext(ModalContext);
    const tag = item.getTag();
    const meta = item.getMeta();
    const handleClick: MouseEventHandler = (e) => {
        if (e.target === e.currentTarget) {
            if (meta) {
                setValue(<PropTree data={meta} />);
            }
        }
    };
    const commonProps = {
        className,
        date: (
            <div
                className={cn(
                    styles.date,
                    {
                        [styles.dateClickable]: !!meta,
                        [styles.dateContentOnly]:
                            item instanceof ContentOnlyItem
                    },
                    className
                )}
                onClick={handleClick}>
                {new Date(item.timestamp).toLocaleTimeString('en-GB')}
            </div>
        ),
        tag: tag ? (
            <Tag
                content={tag}
                color={item.isError() ? google.base08 : undefined}
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
