import React, { FC, ReactNode } from 'react';
import styled from '@emotion/styled';

export type TItem = {
    name: string;
    value: ReactNode;
};

export type TSection = {
    title: string;
    items: TItem[];
};

const Container = styled.details({
    borderBottom: '1px solid #eaeaea',
    marginBottom: '4px',
    paddingBottom: '4px'
});

const Item = styled.div({
    marginLeft: '16px'
});

const Key = styled.span(({ theme }) => ({
    fontWeight: 'bold',
    color: theme.section.key
}));

const Value = styled.span<{ type: 'number' | 'string' | '' }>(
    ({ theme, type }) => ({
        ...(type === 'number' && { color: theme.valueNumber }),
        ...(type === 'string' && { color: theme.valueString }),
        whiteSpace: 'pre-wrap'
    })
);

const isQuoted = (s: unknown) =>
    typeof s === 'string' && s.startsWith('"') && s.endsWith('"');

export const Section: FC<TSection> = ({ title, items }) => {
    const getValueType = (v: unknown) => {
        if (isQuoted(v)) {
            return 'string';
        }
        if (typeof v === 'number' || !isNaN(Number(v))) {
            return 'number';
        }
        return '';
    };
    return (
        <Container open>
            <summary>
                <strong>{title}</strong>
            </summary>
            {items.map(({ name, value }, index) => {
                return (
                    <Item key={`${name}${index}`}>
                        <Key>{name}</Key>:{' '}
                        <Value type={getValueType(value)}>{value}</Value>
                    </Item>
                );
            })}
        </Container>
    );
};
