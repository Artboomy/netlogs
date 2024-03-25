import React, {
    FC,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { useListStore } from 'controllers/network';
import { List } from '../List';
import { SearchContext, useSearchParams } from 'react-inspector';
import { FilterContext } from 'context/FilterContext';
import shallow from 'zustand/shallow';
import { useSettings } from 'hooks/useSettings';

export const ListContainer: FC = () => {
    const [settings] = useSettings();
    const list = useListStore((state) => state.list, shallow);
    const [visibleList, setVisibleList] = useState(list);
    const { value: searchValue } = useContext(SearchContext);
    const filterValue = useContext(FilterContext);
    const { marker } = useSearchParams();

    const hiddenMimeTypes = useMemo(() => {
        return new Set(settings.hiddenMimeTypes);
    }, [settings]);

    // generate map item: visibility
    const filterMapRef = useRef(new WeakMap());
    // recalculate map entirely on new filter values
    useEffect(() => {
        const currentList = useListStore.getState().list;
        const filterMap = filterMapRef.current;
        const visibleList = currentList.filter((i) => {
            const shouldShow =
                !settings.hiddenTags[i.getTag()] &&
                !hiddenMimeTypes.has(i.toJSON().response?.content.mimeType) &&
                i.shouldShow({
                    marker,
                    searchValue,
                    filterValue
                });
            filterMap.set(i, shouldShow);
            return shouldShow;
        });
        setVisibleList(visibleList);
        useListStore.setState({
            visibleCount: visibleList.length,
            totalCount: currentList.length
        });
    }, [filterValue, searchValue, marker, settings, hiddenMimeTypes]);
    // use map in useEffect on new item to detect if it visible
    useEffect(() => {
        const filterMap = filterMapRef.current;
        const visibleList = list.filter((i) => {
            let computedVisibility = filterMap.get(i);
            if (computedVisibility === undefined) {
                computedVisibility =
                    !settings.hiddenTags[i.getTag()] &&
                    !hiddenMimeTypes.has(
                        i.toJSON().response?.content.mimeType
                    ) &&
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
        useListStore.setState({
            visibleCount: visibleList.length,
            totalCount: list.length
        });
    }, [list, hiddenMimeTypes]);
    return <List items={visibleList} />;
};
