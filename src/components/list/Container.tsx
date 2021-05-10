import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import { useListStore } from '../../controllers/network';
import { Row } from '../Row';
import { List } from '../List';
import { nanoid } from 'nanoid';
import { SearchContext } from 'react-inspector';
import { FilterContext } from '../../context/FilterContext';
import { useSettings } from '../../hooks/useSettings';

export const ListContainer: FC = () => {
    const { list } = useListStore();
    const [key, setKey] = useState(nanoid());
    const [settings] = useSettings();
    const searchValue = useContext(SearchContext);
    const filterValue = useContext(FilterContext);
    const symbol = useMemo(
        () => (searchValue ? Symbol.for(searchValue) : undefined),
        [searchValue]
    );
    useEffect(() => {
        setKey(nanoid());
    }, [settings]);
    const content = list
        .filter((networkItem) =>
            networkItem.shouldShow({ symbol, searchValue, filterValue })
        )
        .map((networkItem) => {
            return <Row key={networkItem.id} item={networkItem} />;
        });
    return <List key={key} content={content} />;
};
