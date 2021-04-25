import {
    callParent,
    callParentVoid,
    isSandbox,
    subscribeParent
} from '../utils';

type StorageArea = chrome.storage.StorageArea;

type Callback = (
    changes: { settings: { newValue: string } },
    areaName: 'local'
) => void;

class InMemoryStorage {
    static _listeners: Callback[] = [];
    static _data: string;
    static onChanged = {
        addListener(callback: Callback) {
            InMemoryStorage._listeners.push(callback);
        }
    };
    static local = {
        get: (...args: Parameters<chrome.storage.StorageArea['get']>) => {
            if (args[0] && typeof args[0] === 'object') {
                args[1](args[0]);
            }
        },
        set: (data: Parameters<StorageArea['set']>[0]) => {
            //pass
            InMemoryStorage._data = JSON.stringify(data);
            InMemoryStorage._listeners.forEach((callback) =>
                callback(
                    { settings: { newValue: InMemoryStorage._data } },
                    'local'
                )
            );
        },
        clear: (callback: Parameters<StorageArea['clear']>[0]) => {
            callback?.();
        }
    };
}

class SandboxStorage {
    static _listeners: Callback[] = [];

    constructor() {
        subscribeParent(
            'chrome.storage.onChanged',
            (newSettings: string | undefined) => {
                if (newSettings) {
                    SandboxStorage._listeners.forEach((callback) =>
                        callback(
                            { settings: { newValue: JSON.parse(newSettings) } },
                            'local'
                        )
                    );
                }
            }
        );
        callParentVoid('chrome.storage.onChanged.addListener');
    }

    onChanged = {
        addListener(callback: Callback) {
            SandboxStorage._listeners.push(callback);
        }
    };
    local = {
        get: (...args: Parameters<chrome.storage.StorageArea['get']>) => {
            if (args[0] && typeof args[0] === 'object') {
                callParent('chrome.storage.local.get').then((data) => {
                    args[1]({ settings: data });
                });
            }
        },
        set: (data: Parameters<StorageArea['set']>[0]) => {
            callParentVoid('chrome.storage.local.set', JSON.stringify(data));
        },
        clear: (callback: Parameters<StorageArea['clear']>[0]) => {
            callParent('chrome.storage.local.clear').then(() => {
                callback?.();
            });
        }
    };
}
const currentStorage = isSandbox()
    ? new SandboxStorage()
    : chrome.storage
    ? chrome.storage
    : InMemoryStorage;

export default currentStorage;
