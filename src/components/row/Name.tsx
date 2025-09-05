import React, { FC, useContext } from 'react';
import { partialHighlight } from 'react-inspector';
import { FilterContext } from 'context/FilterContext';
import { useListStore } from 'controllers/network';
import { useTheme } from '@emotion/react';

const guidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isGibberish(input: string): boolean {
    return (
        input.split('.').some((part) => guidRegex.test(part)) ||
        input.length > 50
    );
}

function isImg(input: string): string {
    const match = input.match(/^image\/(jpeg|png|gif|bmp|webp|tiff|svg\+xml);/);
    return match ? match[0] : '';
}

export const Name: FC<{ value: string }> = ({ value }) => {
    const filterValue = useContext(FilterContext);
    const { name, icon } = useTheme();
    const isUnpack = useListStore((state) => state.isUnpack);
    if (filterValue) {
        return <>{partialHighlight(value, filterValue, { style: null })}</>;
    }
    const splitValue = (value && value.length > 1 && value.split('/')) || [
        value
    ];
    let renderValue = value;
    if (isUnpack) {
        if (value && isImg(value)) {
            renderValue = `data:${isImg(value)}`;
        } else if (splitValue.length > 1 && !value?.startsWith('image/svg')) {
            renderValue = splitValue.reduce((acc, curr) => {
                return curr.length > acc.length && !isGibberish(curr)
                    ? curr
                    : acc;
            }, splitValue[0]);
        }
    }
    if (renderValue != value) {
        return (
            <span
                style={{
                    textDecoration: 'underline',
                    textDecorationColor:
                        name === 'dark' ? icon.normal : 'lightgrey'
                }}>
                {renderValue}
            </span>
        );
    }
    return <>{renderValue}</>;
};
