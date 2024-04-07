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

const Container = styled.div({
    display: 'flex',
    alignItems: 'baseline',
    gridColumn: '2/5',
    padding: '4px 8px',
    [mediaQuerySmallOnly]: {
        gridColumn: '1/3',
        flexDirection: 'column'
    }
});

const ResponseStyled = styled(Response)({
    minHeight: '20px',
    [mediaQuerySmallOnly]: {
        paddingTop: '4px'
    }
});

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
