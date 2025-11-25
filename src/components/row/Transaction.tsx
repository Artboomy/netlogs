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

const nameVerticalFragment = {
    maxWidth: '100%'
};

const NameContainer = styled.div<{ clickable: boolean }>(
    ({ theme, clickable }) => ({
        // marginRight: 'auto',
        fontSize: '13px',
        // maxWidth: '30ch',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '4px 8px',
        ...(theme.isVerticalView && nameVerticalFragment),
        [mediaQuerySmallOnly]: nameVerticalFragment,
        ...(clickable && {
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: theme.rowHover
            }
        })
    })
);

const paramsVerticalFragment = {
    gridColumn: '1/3',
    paddingLeft: '8px',
    paddingBottom: '4px'
};

const ParamsContainer = styled.div(({ theme }) => ({
    // marginRight: 'auto',
    fontSize: '13px',
    wordBreak: 'break-all',
    minHeight: '20px',
    paddingTop: '4px',
    paddingRight: '8px',
    ...(theme.isVerticalView && paramsVerticalFragment),
    [mediaQuerySmallOnly]: paramsVerticalFragment
}));

const responseVerticalFragment = {
    paddingBottom: '4px',
    paddingLeft: '8px',
    marginBottom: '4px',
    gridColumn: '1/3'
};

const ResponseStyled = styled(Response)(({ theme }) => ({
    // marginRight: 'auto',
    paddingTop: '4px',
    position: 'relative',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    ...(theme.isVerticalView && responseVerticalFragment),
    [mediaQuerySmallOnly]: responseVerticalFragment
}));

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
