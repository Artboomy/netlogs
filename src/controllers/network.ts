import create, { PartialState } from 'zustand';

import NetworkItem from '../models/NetworkItem';
import ContentOnlyItem from '../models/ContentOnlyItem';
import network from '../api/network';
import TransactionItem from '../models/TransactionItem';
import { NetworkRequest } from '../models/types';
import { insertSorted } from '../utils';
import Settings from './settings';
import WebSocketItem from '../models/WebSocketItem';

export type ItemList = Array<
    NetworkItem | TransactionItem | ContentOnlyItem | WebSocketItem
>;

type TStore = {
    list: ItemList;
    isDynamic: boolean;
    isPreserve: boolean;
    isUnpack: boolean;
    clear: () => void;
    mimeTypes: Set<string>;
    setList: (newList: ItemList, isDynamic?: boolean) => void;
};

export const useListStore = create<TStore>((set, get) => ({
    list: [],
    isDynamic: true,
    isPreserve: false,
    isUnpack: true,
    mimeTypes: new Set(),
    clear: () => set({ list: [], isDynamic: true, mimeTypes: new Set() }),
    setList: (newList: ItemList, isDynamic = true) => {
        const newState = {
            list: newList,
            isDynamic,
            mimeTypes: new Set([...get().mimeTypes])
        };
        if (!isDynamic) {
            newList.forEach((request) => {
                const mimeType = request.toJSON().response.content.mimeType;
                if (mimeType && !newState.mimeTypes.has(mimeType)) {
                    newState.mimeTypes.add(mimeType);
                }
            });
        }
        set(newState);
    }
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
