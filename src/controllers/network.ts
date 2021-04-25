import create from 'zustand';

import NetworkItem from '../models/NetworkItem';
import ContentOnlyItem from '../models/ContentOnlyItem';
import network from '../api/network';
import TransactionItem from '../models/TransactionItem';
import { NetworkRequest } from '../models/types';

export type ItemList = Array<NetworkItem | TransactionItem | ContentOnlyItem>;

type TStore = {
    list: ItemList;
    isDynamic: boolean;
    clear: () => void;
    setList: (newList: ItemList, isDynamic?: boolean) => void;
};

export const useListStore = create<TStore>((set) => ({
    list: [],
    isDynamic: true,
    clear: () => set({ list: [], isDynamic: true }),
    setList: (newList: ItemList, isDynamic = true) =>
        set({ list: newList, isDynamic })
}));

class Network {
    constructor() {
        network.onRequestFinished.addListener((request: NetworkRequest) => {
            const { list, isDynamic } = useListStore.getState();
            if (isDynamic) {
                useListStore.setState({
                    list: [...list, new NetworkItem({ request })]
                });
            }
        });
        network.onNavigated.addListener((url) => {
            useListStore.setState({
                isDynamic: true,
                list: [
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
