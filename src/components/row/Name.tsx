import React, { FC, useContext } from 'react';
import { partialHighlight } from 'react-inspector';
import { FilterContext } from '../../context/FilterContext';

export const Name: FC<{ value: string }> = ({ value }) => {
    const filterValue = useContext(FilterContext);
    return (
        <>
            {filterValue
                ? partialHighlight(value, filterValue, { style: null })
                : value}
        </>
    );
};
