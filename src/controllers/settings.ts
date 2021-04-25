import { useEffect, useState } from 'react';
import {
    IProfile,
    IProfileSerialized,
    ISettings,
    ISettingsSerialized
} from './settings/types';
import { defaultProfile, defaultSettings } from './settings/base';
import storage from '../api/storage';
import { isSandbox } from '../utils';

function deserializeFunctionRaw<T>(strFunction: string): T {
    return isSandbox() ? new Function(`return ${strFunction}`)() : strFunction;
}

function deserializeMatcher(strFunction: string): ISettings['matcher'] {
    try {
        return deserializeFunctionRaw(strFunction);
    } catch (e) {
        return defaultSettings.matcher;
    }
}

export function deserializeFunctionsRaw(
    functions: Record<string, string>
): IProfile['functions'] {
    return Object.assign(
        {},
        ...Object.entries(functions).map(([key, strFunction]) => {
            return { [key]: deserializeFunctionRaw(strFunction) };
        })
    );
}

function deserializeFunctions(
    functions: Record<string, string>
): IProfile['functions'] {
    let deserializedFunctions;
    try {
        deserializedFunctions = deserializeFunctionsRaw(functions);
    } catch (e) {
        deserializedFunctions = defaultProfile.functions;
    }
    return { ...defaultProfile.functions, ...deserializedFunctions };
}

function deserializeProfile(profile: IProfileSerialized): IProfile {
    return {
        ...profile,
        functions: deserializeFunctions(profile.functions)
    };
}

function deserialize(strSettings: string): ISettings {
    const deserialized = JSON.parse(strSettings) as ISettingsSerialized;
    return {
        ...deserialized,
        ...{ matcher: deserializeMatcher(deserialized.matcher) },
        ...{
            profiles: Object.assign(
                {},
                ...Object.entries(deserialized.profiles).map(
                    ([key, profile]) => ({
                        [key]: deserializeProfile(profile)
                    })
                )
            )
        }
    };
}

export function serialize(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    settings: any,
    space?: string
): string {
    return JSON.stringify(
        settings,
        (key, value: unknown) => {
            if (typeof value === 'function') {
                return value.toString();
            }
            return value;
        },
        space
    );
}

type Listener = (newSettings: ISettings) => void;

class Settings {
    private settings: ISettings = defaultSettings;
    private listeners: Listener[] = [];

    constructor() {
        storage.onChanged.addListener(
            (
                changes: { [key: string]: chrome.storage.StorageChange },
                areaName: string
            ) => {
                if (
                    areaName === 'local' &&
                    changes.hasOwnProperty('settings') &&
                    changes.settings.newValue
                ) {
                    this.settings = deserialize(changes.settings.newValue);
                    this.listeners.forEach(
                        (listener) => this.settings && listener(this.settings)
                    );
                }
            }
        );
    }

    addListener(listener: Listener) {
        this.listeners.push(listener);
    }

    refresh() {
        return new Promise((resolve) => {
            storage.local.get(
                { settings: serialize(defaultSettings) },
                ({ settings }) => {
                    this.settings = deserialize(settings);
                    resolve(this.settings);
                }
            );
        });
    }

    get(): ISettings {
        if (this.settings) {
            return this.settings;
        } else {
            throw Error('Non possible path');
        }
    }

    getProfile(url: string): IProfile {
        return {
            ...defaultProfile,
            ...this.settings.profiles[this.settings.matcher(url)]
        };
    }

    getFunctions(url: string): IProfile['functions'] {
        return {
            ...defaultProfile.functions,
            ...this.settings.profiles[this.settings.matcher(url)]?.functions
        };
    }

    set(newSettings: ISettings | ISettingsSerialized) {
        storage.local.set({ settings: serialize(newSettings) });
    }

    reset() {
        return new Promise((resolve) => {
            storage.local.clear(() => {
                this.refresh().then(resolve);
            });
        });
    }
}

const instance = new Settings();
export default instance;

export const useSettings = (): [
    settings: ISettings,
    setSettings: (newSettings: ISettings | ISettingsSerialized) => void,
    resetSettings: () => void
] => {
    const [settings, setSettings] = useState<ISettings>(instance.get());
    useEffect(() => {
        instance.addListener((newSettings) => {
            //pass
            setSettings(newSettings);
        });
    }, []);
    return [
        settings,
        (newSettings) => instance.set(newSettings),
        () => instance.reset().then(() => setSettings(instance.get()))
    ];
};
