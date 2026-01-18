/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    serialize,
    deserialize
} from './settings';
import { defaultSettings } from './settings/base';
import { ISettings } from './settings/types';
import { NetworkRequest } from 'models/types';

// Mock storage and utils
vi.mock('../api/storage', () => ({
    default: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
            clear: vi.fn()
        },
        onChanged: {
            addListener: vi.fn()
        }
    }
}));

vi.mock('utils', () => ({
    isSandbox: vi.fn(() => false),
    isExtension: vi.fn(() => true)
}));

vi.mock('translations/i18n', () => ({
    i18n: {
        locale: 'en-US'
    }
}));

describe('settings.ts serialization/deserialization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('serialize', () => {
        it('should serialize settings without custom function replacer', () => {
            const testSettings = {
                theme: 'dark',
                language: 'en-US'
            };

            const serialized = serialize(testSettings);
            const parsed = JSON.parse(serialized);

            expect(parsed.theme).toBe('dark');
            expect(parsed.language).toBe('en-US');
        });

        it('should handle serialize with space parameter for formatting', () => {
            const testSettings = {
                theme: 'dark'
            };

            const serialized = serialize(testSettings, '  ');
            expect(serialized).toContain('\n');
            expect(serialized).toContain('  ');
        });

        it('should serialize simple objects correctly', () => {
            const obj = {
                value: 42,
                text: 'hello'
            };

            const serialized = serialize(obj);
            const parsed = JSON.parse(serialized);

            expect(parsed.value).toBe(42);
            expect(parsed.text).toBe('hello');
        });

        it('should handle nested objects', () => {
            const obj = {
                nested: {
                    value: 123
                }
            };

            const serialized = serialize(obj);
            const parsed = JSON.parse(serialized);

            expect(parsed.nested.value).toBe(123);
        });

        it('should serialize settings without profiles', () => {
            const testSettings = {
                ...defaultSettings,
                theme: 'dark' as const
            };

            const serialized = serialize(testSettings);
            const parsed = JSON.parse(serialized);

            expect(parsed.theme).toBe('dark');
            expect((parsed as any).profiles).toBeUndefined();
        });
    });

    describe('deserialize', () => {
        it('should deserialize settings without profiles', () => {
            const serializedSettings = serialize(defaultSettings);
            const deserialized = deserialize(serializedSettings);

            expect((deserialized as any).profiles).toBeUndefined();
        });

        it('should merge with default settings', () => {
            const partialSettings = {
                theme: 'dark'
            };

            const serialized = JSON.stringify(partialSettings);
            const deserialized = deserialize(serialized);

            expect(deserialized.theme).toBe('dark');
            expect(deserialized.language).toBe(defaultSettings.language);
        });

        it('should ignore stored profiles', () => {
            const settingsWithCustomProfile = {
                ...defaultSettings,
                profiles: {
                    custom: {
                        // This will be ignored
                    }
                }
            };

            const serialized = JSON.stringify(settingsWithCustomProfile);
            const deserialized = deserialize(serialized);

            // Profiles are not part of settings anymore
            expect((deserialized as any).profiles).toBeUndefined();
        });

        it('should merge jira settings with defaults', () => {
            const settingsWithJira = {
                ...defaultSettings,
                jira: {
                    baseUrl: 'https://custom.atlassian.net',
                    apiToken: 'custom-token'
                }
            };

            const serialized = JSON.stringify(settingsWithJira);
            const deserialized = deserialize(serialized);

            expect(deserialized.jira.baseUrl).toBe('https://custom.atlassian.net');
            expect(deserialized.jira.apiToken).toBe('custom-token');
            expect(deserialized.jira.projectKey).toBe(defaultSettings.jira.projectKey);
        });

        it('should handle missing jira property', () => {
            const settingsWithoutJira = {
                theme: 'dark'
            };

            const serialized = JSON.stringify(settingsWithoutJira);
            const deserialized = deserialize(serialized);

            expect(deserialized.jira).toEqual(defaultSettings.jira);
        });

        it('should not include profiles in deserialized settings', () => {
            const settingsWithOldDefault = {
                ...defaultSettings,
                profiles: {
                    default: {
                        // This will be ignored
                    }
                }
            };

            const serialized = JSON.stringify(settingsWithOldDefault);
            const deserialized = deserialize(serialized);

            // Profiles are not part of settings anymore
            expect((deserialized as any).profiles).toBeUndefined();
        });

        it('should handle malformed JSON gracefully', () => {
            const malformedJson = '{ theme: "dark" }'; // Missing quotes

            expect(() => deserialize(malformedJson)).toThrow();
        });

        it('should deserialize without profiles', () => {
            const settingsWithEmptyProfiles = {
                ...defaultSettings,
                profiles: {}
            };

            const serialized = JSON.stringify(settingsWithEmptyProfiles);
            const deserialized = deserialize(serialized);

            expect((deserialized as any).profiles).toBeUndefined();
        });
    });

    describe('serialize and deserialize round trip', () => {
        it('should maintain data integrity through serialization round trip', () => {
            const original: ISettings = {
                ...defaultSettings,
                theme: 'dark',
                language: 'ru-RU'
            };

            const serialized = serialize(original);
            const deserialized = deserialize(serialized);

            expect(deserialized.theme).toBe(original.theme);
            expect(deserialized.language).toBe(original.language);
        });

        it('should handle complex settings object', () => {
            const complexSettings: ISettings = {
                ...defaultSettings,
                theme: 'dark',
                language: 'en-US',
                sendAnalytics: false,
                debuggerEnabled: true,
                jsonRpcIntegration: true,
                graphqlIntegration: true,
                tagsToolbarVisible: false,
                methodsSidebarVisible: true,
                hiddenTags: { tag1: 'hidden1' },
                hiddenMimeTypes: ['image/png', 'text/css'],
                methodChecks: {
                    'example.com': {
                        GET: true,
                        POST: false
                    }
                },
                jira: {
                    ...defaultSettings.jira,
                    baseUrl: 'https://test.atlassian.net'
                }
            };

            const serialized = serialize(complexSettings);
            const deserialized = deserialize(serialized);

            expect(deserialized.theme).toBe(complexSettings.theme);
            expect(deserialized.sendAnalytics).toBe(complexSettings.sendAnalytics);
            expect(deserialized.hiddenTags).toEqual(complexSettings.hiddenTags);
            expect(deserialized.hiddenMimeTypes).toEqual(complexSettings.hiddenMimeTypes);
            expect(deserialized.methodChecks).toEqual(complexSettings.methodChecks);
            expect(deserialized.jira.baseUrl).toBe(complexSettings.jira.baseUrl);
        });
    });

    describe('edge cases', () => {
        it('should handle settings with null values', () => {
            const settingsWithNull = {
                ...defaultSettings,
                jira: null
            };

            const serialized = JSON.stringify(settingsWithNull);
            const deserialized = deserialize(serialized);

            expect(deserialized.jira).toEqual(defaultSettings.jira);
        });

        it('should handle settings with undefined profiles', () => {
            const settingsWithUndefinedProfiles = {
                ...defaultSettings,
                profiles: undefined
            };

            const serialized = JSON.stringify(settingsWithUndefinedProfiles);
            const deserialized = deserialize(serialized);

            expect((deserialized as any).profiles).toBeUndefined();
        });

        it('should handle empty string serialization', () => {
            const emptyObj = {};
            const serialized = serialize(emptyObj);

            expect(serialized).toBe('{}');
        });

        it('should handle settings with additional unknown properties', () => {
            const settingsWithExtra = {
                ...defaultSettings,
                unknownProperty: 'test',
                anotherUnknown: 123
            };

            const serialized = JSON.stringify(settingsWithExtra);
            const deserialized = deserialize(serialized);

            // Should still deserialize successfully
            expect(deserialized.theme).toBe(defaultSettings.theme);
            expect((deserialized as any).unknownProperty).toBe('test');
        });
    });
});

// Helper function to create mock NetworkRequest
function createMockRequest(overrides: any = {}): NetworkRequest {
    const baseRequest = {
        request: {
            method: 'GET',
            url: 'https://example.com/api/test',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            queryString: [],
            headersSize: -1,
            bodySize: -1,
            postData: undefined
        },
        response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            content: {
                size: 100,
                mimeType: 'application/json',
                text: '{"success":true}'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: 100
        },
        cache: {},
        serverIPAddress: '127.0.0.1',
        startedDateTime: new Date().toISOString(),
        time: 110,
        timings: {
            blocked: 0,
            dns: 0,
            connect: 0,
            send: 0,
            wait: 100,
            receive: 10,
            ssl: 0
        }
    };

    // Deep merge overrides
    if (overrides.request) {
        if (overrides.request.postData) {
            baseRequest.request.postData = overrides.request.postData;
        }
        Object.assign(baseRequest.request, overrides.request);
    }

    if (overrides.response) {
        if (overrides.response.content) {
            Object.assign(baseRequest.response.content, overrides.response.content);
        }
        Object.assign(baseRequest.response, overrides.response);
    }

    if (overrides.timings) {
        Object.assign(baseRequest.timings, overrides.timings);
    }

    if (overrides.serverIPAddress) {
        baseRequest.serverIPAddress = overrides.serverIPAddress;
    }

    return baseRequest as NetworkRequest;
}

describe('Settings class', () => {
    let Settings: typeof import('./settings').default;
    let storage: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Reset module to get fresh instance
        vi.resetModules();

        // Re-import to get fresh mocks
        storage = (await import('../api/storage')).default;
        Settings = (await import('./settings')).default;
    });

    describe('constructor and listeners', () => {
        it('should initialize with default settings', () => {
            const settings = Settings.get();
            expect(settings).toBeDefined();
            expect(settings.theme).toBe(defaultSettings.theme);
        });

        it('should add and notify listeners', () => {
            const listener = vi.fn();
            Settings.addListener(listener);

            // Trigger storage change
            const storageListener = storage.onChanged.addListener.mock.calls[0][0];
            storageListener(
                {
                    settings: {
                        newValue: serialize({ ...defaultSettings, theme: 'dark' })
                    }
                },
                'local'
            );

            expect(listener).toHaveBeenCalled();
            const calledSettings = listener.mock.calls[0][0];
            expect(calledSettings.theme).toBe('dark');
        });

        it('should remove listeners', () => {
            const listener = vi.fn();
            Settings.addListener(listener);
            Settings.removeListener(listener);

            // Trigger storage change
            const storageListener = storage.onChanged.addListener.mock.calls[0][0];
            storageListener(
                {
                    settings: {
                        newValue: serialize({ ...defaultSettings, theme: 'dark' })
                    }
                },
                'local'
            );

            expect(listener).not.toHaveBeenCalled();
        });

        it('should not trigger listeners if settings is null', () => {
            const listener = vi.fn();
            Settings.addListener(listener);

            const storageListener = storage.onChanged.addListener.mock.calls[0][0];
            storageListener(
                {
                    settings: {
                        newValue: null
                    }
                },
                'local'
            );

            expect(listener).not.toHaveBeenCalled();
        });

        it('should not trigger listeners for non-local area', () => {
            const listener = vi.fn();
            Settings.addListener(listener);

            const storageListener = storage.onChanged.addListener.mock.calls[0][0];
            storageListener(
                {
                    settings: {
                        newValue: serialize(defaultSettings)
                    }
                },
                'sync'
            );

            expect(listener).not.toHaveBeenCalled();
        });

        it('should not trigger listeners if settings key not present', () => {
            const listener = vi.fn();
            Settings.addListener(listener);

            const storageListener = storage.onChanged.addListener.mock.calls[0][0];
            storageListener(
                {
                    otherKey: {
                        newValue: 'value'
                    }
                },
                'local'
            );

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        it('should load settings from storage', async () => {
            const customSettings = {
                ...defaultSettings,
                theme: 'dark'
            };

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(customSettings) });
            });

            await Settings.refresh();
            const settings = Settings.get();

            expect(settings.theme).toBe('dark');
        });

        it('should use default settings on parse error', async () => {
            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: 'invalid json' });
            });

            await Settings.refresh();
            const settings = Settings.get();

            expect(settings).toEqual(expect.objectContaining({
                theme: defaultSettings.theme
            }));
        });

        it('should notify listeners after refresh', async () => {
            const listener = vi.fn();
            Settings.addListener(listener);

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(defaultSettings) });
            });

            await Settings.refresh();

            expect(listener).toHaveBeenCalled();
        });
    });

    describe('get', () => {
        it('should return current settings', () => {
            const settings = Settings.get();
            expect(settings).toBeDefined();
            expect(settings.theme).toBe(defaultSettings.theme);
        });
    });

    describe('getMather', () => {
        it('should return default profile for regular requests', () => {
            const request = createMockRequest();
            const matcher = Settings.getMather();
            expect(matcher(request)).toBe('default');
        });

        it('should return jsonRpc profile when enabled and detected', async () => {
            const customSettings = {
                ...defaultSettings,
                jsonRpcIntegration: true
            };

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(customSettings) });
            });

            await Settings.refresh();

            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"jsonrpc":"2.0","method":"test","id":1}' }
                },
                response: {
                    content: {
                        mimeType: 'application/json',
                        text: '{"jsonrpc":"2.0","result":"success","id":1}'
                    }
                }
            });

            const matcher = Settings.getMather();
            expect(matcher(request)).toBe('jsonRpc');
        });

        it('should return default when jsonRpcIntegration is disabled', async () => {
            const customSettings = {
                ...defaultSettings,
                jsonRpcIntegration: false
            };

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(customSettings) });
            });

            await Settings.refresh();

            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"jsonrpc":"2.0","method":"test","id":1}' }
                },
                response: {
                    content: {
                        mimeType: 'application/json',
                        text: '{"jsonrpc":"2.0","result":"success","id":1}'
                    }
                }
            });

            const matcher = Settings.getMather();
            expect(matcher(request)).toBe('default');
        });

        it('should return graphql profile when enabled and detected', async () => {
            const customSettings = {
                ...defaultSettings,
                graphqlIntegration: true
            };

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(customSettings) });
            });

            await Settings.refresh();

            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"query":"query { user { id } }"}' }
                },
                response: {
                    content: {
                        mimeType: 'application/json',
                        text: '{"data":{"user":{"id":"123"}}}'
                    }
                }
            });

            const matcher = Settings.getMather();
            expect(matcher(request)).toBe('graphql');
        });

        it('should return default when graphqlIntegration is disabled', async () => {
            const customSettings = {
                ...defaultSettings,
                graphqlIntegration: false
            };

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(customSettings) });
            });

            await Settings.refresh();

            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"query":"query { user { id } }"}' }
                },
                response: {
                    content: {
                        mimeType: 'application/json',
                        text: '{"data":{"user":{"id":"123"}}}'
                    }
                }
            });

            const matcher = Settings.getMather();
            expect(matcher(request)).toBe('default');
        });

        it('should handle requests without response text', () => {
            const request = createMockRequest({
                response: {
                    content: {
                        size: 0,
                        mimeType: 'application/json',
                        text: undefined
                    }
                }
            });

            const matcher = Settings.getMather();
            expect(matcher(request)).toBe('default');
        });
    });

    describe('getFunctions', () => {
        it('should return functions for matched profile', () => {
            const request = createMockRequest();
            const functions = Settings.getFunctions(request);

            expect(functions).toBeDefined();
            expect(functions.getName).toBeTypeOf('function');
        });

        it('should return jsonRpc functions for RPC requests', async () => {
            const customSettings = {
                ...defaultSettings,
                jsonRpcIntegration: true
            };

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(customSettings) });
            });

            await Settings.refresh();

            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"jsonrpc":"2.0","method":"test","id":1}' }
                },
                response: {
                    content: {
                        mimeType: 'application/json',
                        text: '{"jsonrpc":"2.0","result":"success","id":1}'
                    }
                }
            });

            const functions = Settings.getFunctions(request);
            expect(functions.getTag(request)).toBe('RPC');
        });
    });

    describe('set', () => {
        it('should save settings to storage', async () => {
            const newSettings: ISettings = {
                ...defaultSettings,
                theme: 'dark' as 'dark' | 'light'
            };

            await Settings.set(newSettings);

            expect(storage.local.set).toHaveBeenCalledWith({
                settings: serialize(newSettings)
            });
        });
    });

    describe('reset', () => {
        it('should clear storage and refresh settings', async () => {
            storage.local.clear.mockImplementation((callback: any) => {
                callback();
            });

            storage.local.get.mockImplementation((_defaults: any, callback: any) => {
                callback({ settings: serialize(defaultSettings) });
            });

            await Settings.reset();

            expect(storage.local.clear).toHaveBeenCalled();
            expect(storage.local.get).toHaveBeenCalled();
        });
    });
});
