import React, { FC, useContext } from 'react';
import { useListStore } from '../../controllers/network';
import { Row } from '../Row';
import { List } from '../List';
import { SearchContext, useSearchParams } from 'react-inspector';
import { FilterContext } from '../../context/FilterContext';

export const ListContainer: FC = () => {
    const { list } = useListStore();
    const { value: searchValue } = useContext(SearchContext);
    const filterValue = useContext(FilterContext);
    const { marker } = useSearchParams();
    const content = list
        .filter((networkItem) =>
            networkItem.shouldShow({ marker, searchValue, filterValue })
        )
        .map((networkItem) => {
            return <Row key={networkItem.id} item={networkItem} />;
        });
    return <List content={content} />;
};
