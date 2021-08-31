import React, { FC, ReactNode } from 'react';
import { TransactionItemAbstract } from '../../models/TransactionItem';
import { createUseStyles } from 'react-jss';
import { mediaQuerySmallOnly, nameTrimmer } from '../../utils';
import cn from 'classnames';
import { Response } from '../Response';
import { InspectorWrapper } from '../InspectorWrapper';
import { Name } from './Name';

interface ITransactionProps {
    className?: string;
    item: TransactionItemAbstract;
    date: ReactNode;
    tag: ReactNode;
}

const useStyles = createUseStyles(() => {
    const minHeight = '20px';
    return {
        name: {
            // marginRight: 'auto',
            fontSize: '13px',
            // maxWidth: '30ch',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            padding: '4px 8px',
            [mediaQuerySmallOnly]: {
                maxWidth: '100%'
            }
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
        response: {
            // marginRight: 'auto',
            paddingTop: '4px',
            position: 'relative',
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            [mediaQuerySmallOnly]: {
                paddingBottom: '4px',
                paddingLeft: '8px',
                marginBottom: '4px',
                gridColumn: '1/3'
            }
        }
    };
});

export const Transaction: FC<ITransactionProps> = ({
    className,
    item,
    date,
    tag
}) => {
    const styles = useStyles();
    const name = nameTrimmer(item.getName());
    return (
        <>
            {date}
            <div className={cn(styles.name, className)} title={name}>
                {tag}
                <Name value={name} />
            </div>
            <div className={cn(styles.params, className)}>
                <InspectorWrapper data={item.getParams()} tagName='params' />
            </div>
            <Response item={item} className={cn(styles.response, className)} />
        </>
    );
};
Transaction.displayName = 'TransactionRow';
