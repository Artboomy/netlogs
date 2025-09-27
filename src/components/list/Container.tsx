import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { AnyItem, useListStore } from 'controllers/network';
import { List } from '../List';
import { SearchContext, useSearchParams } from 'react-inspector';
import { FilterContext } from 'context/FilterContext';
import { useSettings } from 'hooks/useSettings';
import { useShallow } from 'zustand/react/shallow';
import { isTransactionItem } from 'models/utils';
import { ISettings } from 'controllers/settings/types';
import Host from 'controllers/host';

const computeVisibility = ({
    i,
    hiddenTags,
    hiddenMimeTypesArray,
    marker,
    searchValue,
    filterValue,
    methodChecks
}: {
    i: AnyItem;
    hiddenTags: Record<string, string>;
    hiddenMimeTypesArray: string[];
    marker: ReturnType<typeof useSearchParams>['marker'];
    searchValue: string;
    filterValue: string;
    methodChecks: ISettings['methodChecks'][string];
}) => {
    let methodFilter = true;
    if (isTransactionItem(i)) {
        if (methodChecks) {
            if (
                methodChecks[i.getName()] === false ||
                methodChecks[i.getName().slice(1)] === false ||
                Object.entries(methodChecks)
                    .filter(([_, v]) => v === false)
                    .some(([k]) => {
                        return i.getName().startsWith(k);
                    })
            ) {
                methodFilter = false;
            }
        }
    }
    return (
        !hiddenTags[i.getTag()] &&
        !hiddenMimeTypesArray.includes(i.toJSON().response?.content.mimeType) &&
        i.shouldShow({
            marker,
            searchValue,
            filterValue
        }) &&
        methodFilter
    );
};

export const ListContainer: FC = () => {
    const list = useListStore(useShallow((state) => state.list));
    const [visibleList, setVisibleList] = useState(list);
    const { value: searchValue } = useContext(SearchContext);
    const filterValue = useContext(FilterContext);
    const { marker } = useSearchParams();
    const methodChecks = useSettings(
        useShallow((state) => state.settings.methodChecks[Host.host])
    );

    const hiddenMimeTypesArray = useSettings(
        useShallow((state) => state.settings.hiddenMimeTypes)
    );

    // generate map item: visibility
    const filterMapRef = useRef(new WeakMap());
    const hiddenTags = useSettings(
        useShallow((state) => state.settings.hiddenTags)
    );
    // recalculate the map entirely on new filter values
    useEffect(() => {
        const currentList = useListStore.getState().list;
        const filterMap = filterMapRef.current;
        const visibleList = currentList.filter((i) => {
            const shouldShow = computeVisibility({
                i,
                hiddenTags,
                hiddenMimeTypesArray,
                marker,
                searchValue,
                filterValue,
                methodChecks
            });
            filterMap.set(i, shouldShow);
            return shouldShow;
        });
        setVisibleList(visibleList);
        useListStore.setState({
            visibleCount: visibleList.length,
            totalCount: currentList.length
        });
    }, [
        filterValue,
        searchValue,
        marker,
        hiddenTags,
        hiddenMimeTypesArray,
        methodChecks
    ]);

    // use map in useEffect on a new item to detect if it visible
    useEffect(() => {
        const filterMap = filterMapRef.current;
        const visibleList = list.filter((i) => {
            let computedVisibility = filterMap.get(i);
            if (computedVisibility === undefined) {
                const methodChecks =
                    useSettings.getState().settings.methodChecks[Host.host];
                computedVisibility = computeVisibility({
                    i,
                    hiddenTags,
                    hiddenMimeTypesArray,
                    marker,
                    searchValue,
                    filterValue,
                    methodChecks
                });
                filterMap.set(i, computedVisibility);
            }
            return computedVisibility;
        });
        setVisibleList(visibleList);
        useListStore.setState({
            visibleCount: visibleList.length,
            totalCount: list.length
        });
    }, [list]);
    return <List items={visibleList} />;
};
