import React, { FC, MouseEventHandler, ReactNode } from 'react';
import { TransactionItemAbstract } from 'models/TransactionItem';
import { mediaQuerySmallOnly, nameTrimmer } from 'utils';
import { Response } from '../Response';
import { InspectorWrapper } from '../InspectorWrapper';
import { Name } from './Name';
import styled from '@emotion/styled';
import { useRowClickPanel } from 'components/row/useRowClickPanel';

interface ITransactionProps {
    className?: string;
    item: TransactionItemAbstract;
    date: ReactNode;
    tag: ReactNode;
}

const NameContainer = styled.div<{ clickable: boolean }>(
    ({ theme, clickable }) => ({
        // marginRight: 'auto',
        fontSize: '13px',
        // maxWidth: '30ch',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '4px 8px',
        [mediaQuerySmallOnly]: {
            maxWidth: '100%'
        },
        ...(clickable && {
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: theme.rowHover
            }
        })
    })
);

const ParamsContainer = styled.div({
    // marginRight: 'auto',
    fontSize: '13px',
    wordBreak: 'break-all',
    minHeight: '20px',
    paddingTop: '4px',
    paddingRight: '8px',
    [mediaQuerySmallOnly]: {
        gridColumn: '1/3',
        paddingLeft: '8px',
        paddingBottom: '4px'
    }
});

const ResponseStyled = styled(Response)({
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
});

export const Transaction: FC<ITransactionProps> = ({
    className,
    item,
    date,
    tag
}) => {
    const name = nameTrimmer(item.getName());
    const handleClick: MouseEventHandler = useRowClickPanel(item);
    return (
        <>
            {date}
            <NameContainer
                className={className}
                onClick={handleClick}
                clickable={!!item.getMeta()}>
                {tag}
                <Name value={name} />
            </NameContainer>
            <ParamsContainer className={className}>
                <InspectorWrapper data={item.getParams()} tagName='params' />
            </ParamsContainer>
            <ResponseStyled item={item} className={className} />
        </>
    );
};
Transaction.displayName = 'TransactionRow';
