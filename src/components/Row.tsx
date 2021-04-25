import React, { memo, MouseEventHandler, useContext } from 'react';
import ContentOnlyItem from '../models/ContentOnlyItem';
import { TransactionItemAbstract } from '../models/TransactionItem';
import { Response } from './Response';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';
import { Tag } from './Tag';
import { InspectorWrapper } from './InspectorWrapper';
import { PropTree } from './PropTree';
import { ModalContext } from './modal/Context';
import cn from 'classnames';
import { mediaQuerySmallOnly } from '../utils';

export interface IRowProps {
    className?: string;
    item: ContentOnlyItem | TransactionItemAbstract;
}

const useStyles = createUseStyles(() => {
    const minHeight = '20px';
    return {
        contentOnly: {
            display: 'flex',
            alignItems: 'baseline',
            gridColumn: '2/5',
            padding: '4px 8px',
            [mediaQuerySmallOnly]: {
                gridColumn: '1/3'
            }
        },
        name: {
            // marginRight: 'auto',
            fontSize: '13px',
            maxWidth: '30ch',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            padding: '4px 8px',
            [mediaQuerySmallOnly]: {
                maxWidth: '100%'
            }
        },
        date: {
            color: google.base02,
            fontSize: '13px',
            padding: '4px 4px 4px 8px'
        },
        dateClickable: {
            cursor: 'pointer',
            textDecoration: 'underline'
        },
        params: {
            // marginRight: 'auto',
            fontSize: '13px',
            wordBreak: 'break-all',
            minHeight,
            paddingTop: '4px',
            paddingRight: '8px',
            [mediaQuerySmallOnly]: {
                gridColumn: '1/3',
                paddingLeft: '8px',
                paddingBottom: '4px'
            }
        },
        content: {
            minHeight
        },
        response: {
            // marginRight: 'auto',
            paddingTop: '4px',
            position: 'relative',
            wordBreak: 'break-all',
            [mediaQuerySmallOnly]: {
                paddingBottom: '4px',
                paddingLeft: '8px',
                marginBottom: '4px',
                gridColumn: '1/3'
            }
        }
    };
});
const nameTrimmer = (value: string) =>
    value.length > 100 ? value.slice(0, 100) + '…' : value;

export const Row: React.FC<IRowProps> = memo(({ item, className }) => {
    const styles = useStyles();
    const tag = item.getTag();
    const transactionItem = (item: TransactionItemAbstract) => {
        const name = nameTrimmer(item.getName());
        return (
            <>
                <div className={cn(styles.name, className)} title={name}>
                    {tag && (
                        <Tag
                            content={tag}
                            color={item.isError() ? google.base08 : undefined}
                        />
                    )}
                    {name}
                </div>
                <div className={cn(styles.params, className)}>
                    <InspectorWrapper
                        data={item.getParams()}
                        tagName='params'
                    />
                </div>
                <Response
                    item={item}
                    className={cn(styles.response, className)}
                />
            </>
        );
    };
    const handleClick: MouseEventHandler = (e) => {
        if (e.target === e.currentTarget) {
            if (meta) {
                setValue(<PropTree data={meta} />);
            }
        }
    };
    const meta = item.getMeta();
    const { setValue } = useContext(ModalContext);
    return (
        <>
            <div
                className={cn(
                    styles.date,
                    { [styles.dateClickable]: !!meta },
                    className
                )}
                onClick={handleClick}>
                {new Date(item.timestamp).toLocaleTimeString('en-GB')}
            </div>
            {item instanceof ContentOnlyItem ? (
                <div className={cn(styles.contentOnly, className)}>
                    {tag && <Tag content={tag} color={google.base0B} />}
                    <Response className={styles.content} item={item} />
                </div>
            ) : (
                transactionItem(item)
            )}
        </>
    );
});

Row.displayName = 'Row';
