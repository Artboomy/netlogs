import create from 'zustand';

import NetworkItem from '../models/NetworkItem';
import ContentOnlyItem from '../models/ContentOnlyItem';
import network from '../api/network';
import TransactionItem from '../models/TransactionItem';
import { NetworkRequest } from '../models/types';
import { insertSorted } from '../utils';

export type ItemList = Array<NetworkItem | TransactionItem | ContentOnlyItem>;

type TStore = {
    list: ItemList;
    isDynamic: boolean;
    isPreserve: boolean;
    clear: () => void;
    setList: (newList: ItemList, isDynamic?: boolean) => void;
    setPreserve: (isPreserve: boolean) => void;
};

export const useListStore = create<TStore>((set) => ({
    list: [],
    isDynamic: true,
    isPreserve: false,
    clear: () => set({ list: [], isDynamic: true }),
    setList: (newList: ItemList, isDynamic = true) =>
        set({ list: newList, isDynamic }),
    setPreserve: (isPreserve) => set({ isPreserve })
}));

class Network {
    constructor() {
        network.onRequestFinished.addListener((request: NetworkRequest) => {
            const { list, isDynamic } = useListStore.getState();
            if (isDynamic) {
                useListStore.setState({
                    list: insertSorted(new NetworkItem({ request }), list)
                });
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
                        tag: 'NET LOGS',
                        content: `Navigated to ${url}`
                    })
                ]
            });
        });
    }
}

const NetworkInstance = new Network();

export default NetworkInstance;
