import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { useListStore } from '../../controllers/network';
import { Row } from '../Row';
import { List } from '../List';
import { SearchContext, useSearchParams } from 'react-inspector';
import { FilterContext } from '../../context/FilterContext';
import shallow from 'zustand/shallow';
import { useSettings } from '../../hooks/useSettings';
export const ListContainer: FC<{
    onCountChange: (count: {
        totalCount: number;
        visibleCount: number;
    }) => void;
}> = ({ onCountChange }) => {
    const [settings] = useSettings();
    const list = useListStore((state) => state.list, shallow);
    const [visibleList, setVisibleList] = useState(list);
    const { value: searchValue } = useContext(SearchContext);
    const filterValue = useContext(FilterContext);
    const { marker } = useSearchParams();

    // generate map item: visibility
    const filterMapRef = useRef(new WeakMap());
    // recalculate map entirely on new filter values
    useEffect(() => {
        const filterMap = filterMapRef.current;
        const visibleList = list.filter((i) => {
            const shouldShow =
                !settings.hiddenTags[i.getTag()] &&
                i.shouldShow({
                    marker,
                    searchValue,
                    filterValue
                });
            filterMap.set(i, shouldShow);
            return shouldShow;
        });
        setVisibleList(visibleList);
        onCountChange({
            totalCount: list.length,
            visibleCount: visibleList.length
        });
    }, [filterValue, searchValue, marker, settings]);
    // use map in useEffect on new item to detect if it visible
    useEffect(() => {
        const filterMap = filterMapRef.current;
        const visibleList = list.filter((i) => {
            let computedVisibility = filterMap.get(i);
            if (computedVisibility === undefined) {
                computedVisibility =
                    !settings.hiddenTags[i.getTag()] &&
                    i.shouldShow({
                        marker,
                        searchValue,
                        filterValue
                    });
                filterMap.set(i, computedVisibility);
            }
            return computedVisibility;
        });
        setVisibleList(visibleList);
        onCountChange({
            totalCount: list.length,
            visibleCount: visibleList.length
        });
    }, [list]);
    const content = visibleList.map((networkItem) => {
        return <Row key={networkItem.id} item={networkItem} />;
    });
    return <List content={content} />;
};
