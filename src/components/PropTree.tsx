import React, { FC, useEffect, useRef } from 'react';
import { Section, TSection } from './Section';
import { callParentVoid } from 'utils';
import styled from '@emotion/styled';
import ErrorBoundary from 'components/ErrorBoundary';

export type PropTreeProps = {
    data: {
        [key: string]: TSection;
    };
};

const Container = styled.section({
    fontFamily: 'Tahoma, sans-serif',
    fontSize: '12px',
    lineHeight: 1.7
});

export const PropTree: FC<PropTreeProps> = ({ data }) => {
    const openedRef = useRef(Date.now());
    useEffect(() => {
        return () => {
            callParentVoid(
                'analytics.propTreeViewed',
                String(Date.now() - openedRef.current)
            );
        };
    }, []);
    return (
        <Container>
            <ErrorBoundary>
                {Object.entries(data).map(([key, sectionData]) => (
                    <Section key={key} {...sectionData} />
                ))}
            </ErrorBoundary>
        </Container>
    );
};
