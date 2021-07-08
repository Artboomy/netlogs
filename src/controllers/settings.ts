import {
    IProfile,
    IProfileSerialized,
    ISettings,
    ISettingsSerialized
} from './settings/types';
import { defaultSettings } from './settings/base';
import storage from '../api/storage';
import { isSandbox } from '../utils';
import { defaultProfile } from './settings/profiles/default';
import { NetworkRequest } from '../models/types';
import { isJsonRpc, jsonRpcProfile } from './settings/profiles/jsonRpc';
import { graphqlProfile, isGraphql } from './settings/profiles/graphql';

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
                ),
                // default should always be latest, not from storage
                { default: defaultProfile }
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

function injectStaticProfiles(settings: ISettings): void {
    settings.profiles.default = defaultProfile;
    settings.profiles.jsonRpc = jsonRpcProfile;
    settings.profiles.graphql = graphqlProfile;
}

class Settings {
    private settings: ISettings = defaultSettings;
    private listeners: Listener[] = [];

    constructor() {
        this.settings = defaultSettings;
        injectStaticProfiles(this.settings);
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
                    injectStaticProfiles(this.settings);
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
                    try {
                        this.settings = deserialize(settings);
                    } catch (e) {
                        this.settings = defaultSettings;
                    }
                    injectStaticProfiles(this.settings);
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

    getMather(): ISettings['matcher'] {
        return (request: NetworkRequest) => {
            const params = defaultProfile.functions.getParams(request);
            const result = request.response.content.text
                ? defaultProfile.functions.getResult(
                      request,
                      request.response.content.text
                  )
                : null;
            if (isJsonRpc(params, result) && this.settings.jsonRpcIntegration) {
                return 'jsonRpc';
            }
            if (
                isGraphql(params, result, request.response.content.text) &&
                this.settings.graphqlIntegration
            ) {
                return 'graphql';
            }
            return this.settings.matcher(request);
        };
    }

    getProfile(request: NetworkRequest): IProfile {
        return {
            ...defaultProfile,
            ...this.settings.profiles[this.getMather()(request)]
        };
    }

    getFunctions(request: NetworkRequest): IProfile['functions'] {
        return this.settings.profiles[this.getMather()(request)]?.functions;
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
