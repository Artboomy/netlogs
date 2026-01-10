import { create } from 'zustand';

import NetworkItem from '../models/NetworkItem';
import ContentOnlyItem from '../models/ContentOnlyItem';
import PendingItem from '../models/PendingItem';
import network from '../api/network';
import TransactionItem from '../models/TransactionItem';
import { NetworkRequest } from 'models/types';
import { insertSorted, subscribeParent } from 'utils';
import WebSocketItem from '../models/WebSocketItem';
import { Id, toast } from 'react-toastify';
import type { PendingRequestData } from '../types';

export type AnyItem =
    | NetworkItem
    | TransactionItem
    | ContentOnlyItem
    | WebSocketItem
    | PendingItem;
export type ItemList = AnyItem[];

type TStore = {
    list: ItemList;
    isDynamic: boolean;
    isPreserve: boolean;
    isUnpack: boolean;
    clear: () => void;
    mimeTypes: Set<string>;
    setList: (newList: ItemList, isDynamic?: boolean) => void;

    totalCount: number;
    visibleCount: number;
};

export const toggleUnpack = () => {
    useListStore.setState((prev) => ({
        isUnpack: !prev.isUnpack
    }));
};

export const useListStore = create<TStore>((set, get) => ({
    list: [],
    isDynamic: true,
    isPreserve: false,
    isUnpack: true,
    mimeTypes: new Set(),

    totalCount: 0,
    visibleCount: 0,
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

/** Minimum duration (ms) before showing pending request indicator */
const PENDING_DISPLAY_DELAY = 100;

type PendingTimerEntry = { timer: number; item: PendingItem };

class Network {
    cachedTimer: number | null = null;
    cachedData: NetworkRequest[] = [];
    toastId: Id = '';
    /** Tracks pending request timeouts by URL+method key (FIFO queue per key). */
    pendingTimers: Map<string, PendingTimerEntry[]> = new Map();

    /** Generate a key for matching pending requests */
    private getPendingKey(method: string, url: string): string {
        return `${method}:${url}`;
    }

    /** Add a pending timer to the queue for a given key */
    private addPendingTimer(key: string, entry: PendingTimerEntry): void {
        const queue = this.pendingTimers.get(key) || [];
        queue.push(entry);
        this.pendingTimers.set(key, queue);
    }

    /** Remove and return the first pending timer from the queue for a given key */
    private shiftPendingTimer(key: string): PendingTimerEntry | undefined {
        const queue = this.pendingTimers.get(key);
        if (!queue || queue.length === 0) {
            return undefined;
        }
        const entry = queue.shift();
        if (queue.length === 0) {
            this.pendingTimers.delete(key);
        }
        return entry;
    }

    constructor() {
        // NOTE: looks like this isn't needed anymore
        /*Settings.addListener(function recomputeFieldsOnSettingsChangeNetwork()  {
            const { list, setList } = useListStore.getState();
            list.forEach((i) => i.setComputedFields());
            setList([...list]);
        });*/
        network.onRequestFinished.addListener((request: NetworkRequest) => {
            const { list, isDynamic, mimeTypes } = useListStore.getState();
            if (isDynamic) {
                const key = this.getPendingKey(
                    request.request.method,
                    request.request.url
                );

                // Check if there's a pending timer that hasn't fired yet (request completed in < 100ms)
                const pendingTimer = this.shiftPendingTimer(key);
                if (pendingTimer) {
                    // Request completed quickly - cancel the timer, don't show pending indicator
                    window.clearTimeout(pendingTimer.timer);
                }

                // Remove only ONE matching pending item when real request completes (FIFO)
                // This ensures multiple concurrent requests to the same URL+method are handled correctly
                let removedOne = false;
                const filteredList = list.filter((item) => {
                    if (item instanceof PendingItem && !removedOne) {
                        // Match by URL and method
                        const matches =
                            item.getUrl() === request.request.url &&
                            item.getMethod() === request.request.method;
                        if (matches) {
                            removedOne = true;
                            return false; // Remove this item
                        }
                    }
                    return true;
                });
                if (removedOne) {
                    // console.log(
                    //     '[NETLOGS:network] Removed 1 pending item for completed request:',
                    //     request.request.url
                    // );
                }

                const newState: Pick<TStore, 'mimeTypes' | 'list'> = {
                    list: insertSorted(
                        new NetworkItem({ request }),
                        filteredList
                    ),
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

        // Subscribe to pending requests from inject script
        subscribeParent('pendingRequest', (data) => {
            console.log(
                '[NETLOGS:network] Received pendingRequest event:',
                data
            );
            const { isDynamic } = useListStore.getState();
            if (isDynamic) {
                try {
                    const pendingData: PendingRequestData =
                        typeof data === 'string' ? JSON.parse(data) : data;
                    console.log(
                        '[NETLOGS:network] Scheduling PendingItem display:',
                        {
                            id: pendingData.id,
                            method: pendingData.request.method,
                            url: pendingData.request.url
                        }
                    );

                    const pendingItem = new PendingItem(pendingData);
                    const key = this.getPendingKey(
                        pendingData.request.method,
                        pendingData.request.url
                    );

                    // Delay showing pending item by 100ms to avoid blinking for fast requests
                    const timer = window.setTimeout(() => {
                        const { list, isDynamic: stillDynamic } =
                            useListStore.getState();
                        if (stillDynamic) {
                            useListStore.setState({
                                list: insertSorted(pendingItem, list)
                            });
                        }
                    }, PENDING_DISPLAY_DELAY);

                    this.addPendingTimer(key, { timer, item: pendingItem });
                } catch (e) {
                    console.error(
                        '[NETLOGS:network] Failed to create PendingItem:',
                        e
                    );
                }
            }
        });
        network.onNavigated.addListener(function networkOnNavigated(url) {
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
        subscribeParent('cachedNetworkRequest', (data) => {
            const { request, idx, total } = JSON.parse(data);
            this.cachedData.push(request);
            if (this.cachedTimer) {
                window.clearTimeout(this.cachedTimer);
            }
            const progress = idx + 1 / total;
            if (this.toastId) {
                toast.update(this.toastId, { progress });
            } else {
                this.toastId = toast('⌛', {
                    progress
                });
            }
            this.cachedTimer = window.setTimeout(() => {
                const newState: Pick<TStore, 'mimeTypes' | 'list'> = {
                    list: this.cachedData.map(
                        (request) => new NetworkItem({ request })
                    ),
                    mimeTypes: new Set(
                        this.cachedData.map(
                            (request) => request.response.content.mimeType
                        )
                    )
                };
                useListStore.setState(newState);
                toast.done(this.toastId);
                this.toastId = '';
                this.cachedTimer = null;
            }, 500);
        });
    }
}

const NetworkInstance = new Network();

export default NetworkInstance;
