import create, { PartialState } from 'zustand';

import NetworkItem from '../models/NetworkItem';
import ContentOnlyItem from '../models/ContentOnlyItem';
import network from '../api/network';
import TransactionItem from '../models/TransactionItem';
import { NetworkRequest } from '../models/types';
import { insertSorted } from '../utils';
import Settings from './settings';

export type ItemList = Array<NetworkItem | TransactionItem | ContentOnlyItem>;

type TStore = {
    list: ItemList;
    isDynamic: boolean;
    isPreserve: boolean;
    clear: () => void;
    mimeTypes: Set<string>;
    setList: (newList: ItemList, isDynamic?: boolean) => void;
};

export const useListStore = create<TStore>((set) => ({
    list: [],
    isDynamic: true,
    isPreserve: false,
    mimeTypes: new Set(),
    clear: () => set({ list: [], isDynamic: true, mimeTypes: new Set() }),
    setList: (newList: ItemList, isDynamic = true) =>
        set({ list: newList, isDynamic })
}));

class Network {
    constructor() {
        Settings.addListener(() => {
            const { list, setList } = useListStore.getState();
            list.forEach((i) => i.setComputedFields());
            setList([...list]);
        });
        network.onRequestFinished.addListener((request: NetworkRequest) => {
            const { list, isDynamic, mimeTypes } = useListStore.getState();
            if (isDynamic) {
                const newState: PartialState<TStore, 'mimeTypes' | 'list'> = {
                    list: insertSorted(new NetworkItem({ request }), list),
                    mimeTypes
                };
                const mimeType = request.response.content.mimeType;
                if (mimeType && !mimeTypes.has(mimeType)) {
                    newState.mimeTypes = new Set([
                        ...useListStore.getState().mimeTypes,
                        mimeType
                    ]);
                }
                useListStore.setState(newState);
            }
        });
        network.onNavigated.addListener((url) => {
            const { list, isPreserve } = useListStore.getState();
            useListStore.setState({
                isDynamic: true,
                list: [
                    ...(isPreserve ? list : []),
                    new ContentOnlyItem({
                        timestamp: new Date().getTime(),
                        tag: 'NAV',
                        content: `Navigated to ${url}`
                    })
                ]
            });
        });
    }
}

const NetworkInstance = new Network();

export default NetworkInstance;
