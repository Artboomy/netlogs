import { IProfile, ISettings, ProfileName } from './settings/types';
import { defaultSettings } from './settings/base';
import storage from '../api/storage';
import { defaultProfile } from './settings/profiles/default';
import { NetworkRequest } from 'models/types';
import { isJsonRpc, jsonRpcProfile } from './settings/profiles/jsonRpc';
import { graphqlProfile, isGraphql } from './settings/profiles/graphql';
import { i18n } from 'translations/i18n';

// Serialization/deserialization of functions has been removed
// Profiles are now imported directly where needed

export function deserialize(strSettings: string): ISettings {
    const deserialized = JSON.parse(strSettings) as Partial<ISettings & { profiles?: unknown }>;
    const { profiles: _profiles, ...settingsWithoutProfiles } = deserialized;
    return {
        ...defaultSettings,
        ...settingsWithoutProfiles,
        jira: {
            ...defaultSettings.jira,
            ...(deserialized.jira || {})
        }
    };
}

export function serialize(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings: any,
    space?: string
): string {
    // Remove profiles if present before serialization
    const { profiles: _profiles, ...settingsWithoutProfiles } = settings;
    return JSON.stringify(settingsWithoutProfiles, null, space);
}

export type SettingsListener = (newSettings: ISettings) => void;

function setLanguage(language: string) {
    i18n.locale = language;
}

class Settings {
    private settings: ISettings = defaultSettings;
    private listeners: SettingsListener[] = [];

    constructor() {
        this.settings = defaultSettings;
        storage.onChanged.addListener(
            (
                changes: { [key: string]: chrome.storage.StorageChange },
                areaName: string
            ) => {
                if (
                    areaName === 'local' &&
                    Object.prototype.hasOwnProperty.call(changes, 'settings') &&
                    changes.settings.newValue
                ) {
                    this.settings = deserialize(changes.settings.newValue);
                    setLanguage(this.settings.language);
                    this.listeners.forEach((listener) => {
                        if (this.settings) {
                            listener(this.settings);
                        }
                    });
                }
            }
        );
    }

    addListener(listener: SettingsListener) {
        this.listeners.push(listener);
    }
    removeListener(listener: SettingsListener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    refresh() {
        return new Promise((resolve) => {
            storage.local.get(
                { settings: serialize(defaultSettings) },
                ({ settings }) => {
                    try {
                        this.settings = deserialize(settings);
                        setLanguage(this.settings.language);
                    } catch (_e) {
                        this.settings = defaultSettings;
                    }
                    resolve(this.settings);
                    this.listeners.forEach((listener) => {
                        if (this.settings) {
                            listener(this.settings);
                        }
                    });
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

    getMather(): (request: NetworkRequest) => ProfileName {
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
            return 'default';
        };
    }

    getFunctions(request: NetworkRequest): IProfile['functions'] {
        const profileName = this.getMather()(request);
        switch (profileName) {
            case 'jsonRpc':
                return jsonRpcProfile.functions;
            case 'graphql':
                return graphqlProfile.functions;
            default:
                return defaultProfile.functions;
        }
    }

    set(newSettings: ISettings) {
        return storage.local.set({ settings: serialize(newSettings) });
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
