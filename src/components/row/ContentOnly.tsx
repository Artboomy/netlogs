import React, { FC, ReactNode } from 'react';
import ContentOnlyItem from '../../models/ContentOnlyItem';
import { mediaQuerySmallOnly } from 'utils';
import { Response } from '../Response';
import styled from '@emotion/styled';

interface IContentOnlyProp {
    className?: string;
    item: ContentOnlyItem;
    date: ReactNode;
    tag: ReactNode;
}

const containerVerticalFragment = {
    gridColumn: '1/3',
    flexDirection: 'column'
} as const;

const Container = styled.div(({ theme: { isVerticalView } }) => ({
    display: 'flex',
    alignItems: 'baseline',
    gridColumn: '2/5',
    padding: '4px 8px',
    ...(isVerticalView && containerVerticalFragment),
    [mediaQuerySmallOnly]: containerVerticalFragment
}));

const responseVerticalFragment = {
    paddingTop: '4px'
};

const ResponseStyled = styled(Response)(({ theme: { isVerticalView } }) => ({
    minHeight: '20px',
    ...(isVerticalView && responseVerticalFragment),
    [mediaQuerySmallOnly]: responseVerticalFragment
}));

export const ContentOnly: FC<IContentOnlyProp> = ({
    className,
    item,
    date,
    tag
}) => {
    return (
        <>
            {date}
            <Container className={className}>
                {tag}
                <ResponseStyled item={item} />
            </Container>
        </>
    );
};
ContentOnly.displayName = 'ContentOnlyRow';
