/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    normalizeBaseUrl,
    getJiraSettings,
    createJiraError,
    handleJiraCreateIssue,
    handleJiraTestSettings,
    handleJiraGetMetadata,
    type JiraCreateMessage,
    type JiraTestMessage,
    type JiraGetMetadataMessage,
    type JiraIssuePayload
} from './jira';
import { defaultSettings } from 'controllers/settings/base';
type Port = chrome.runtime.Port;

// Mock chrome API
const mockChrome = {
    storage: {
        local: {
            get: vi.fn()
        }
    },
    debugger: {
        attach: vi.fn(),
        detach: vi.fn(),
        sendCommand: vi.fn()
    },
    tabs: {
        create: vi.fn()
    }
};

global.chrome = mockChrome as any;

// Mock fetch
global.fetch = vi.fn();

// Mock FormData
class MockFormData {
    append = vi.fn();
}
global.FormData = MockFormData as any;

// Mock Blob
class MockBlob {
    constructor(
        public parts: any[],
        public options?: any
    ) {}
}
global.Blob = MockBlob as any;

global.atob = vi.fn((str: string) => str);

// Mock console to avoid cluttering test output
global.console = {
    ...console,
    error: vi.fn()
};

describe('jira.ts', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('normalizeBaseUrl', () => {
        it('should remove trailing slashes', () => {
            expect(normalizeBaseUrl('https://example.com/')).toBe(
                'https://example.com'
            );
            expect(normalizeBaseUrl('https://example.com///')).toBe(
                'https://example.com'
            );
        });

        it('should handle URLs without trailing slashes', () => {
            expect(normalizeBaseUrl('https://example.com')).toBe(
                'https://example.com'
            );
        });

        it('should handle empty string', () => {
            expect(normalizeBaseUrl('')).toBe('');
        });
    });

    describe('getJiraSettings', () => {
        it('should return default jira settings when storage is empty', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(defaultSettings)
            });

            const settings = await getJiraSettings();

            expect(settings).toEqual(defaultSettings.jira);
        });

        it('should merge custom jira settings with defaults', async () => {
            const customSettings = {
                ...defaultSettings,
                jira: {
                    ...defaultSettings.jira,
                    baseUrl: 'https://custom.atlassian.net',
                    apiToken: 'custom-token'
                }
            };

            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(customSettings)
            });

            const settings = await getJiraSettings();

            expect(settings.baseUrl).toBe('https://custom.atlassian.net');
            expect(settings.apiToken).toBe('custom-token');
        });

        it('should handle settings without jira property', async () => {
            const customSettings = {
                ...defaultSettings,
                jira: undefined
            };

            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(customSettings)
            });

            const settings = await getJiraSettings();

            expect(settings).toEqual(defaultSettings.jira);
        });
    });

    describe('createJiraError', () => {
        it('should create error response without details', () => {
            const result = createJiraError('Test error');
            const parsed = JSON.parse(result);

            expect(parsed.ok).toBe(false);
            expect(parsed.error).toBe('Test error');
            expect(parsed.details).toBeUndefined();
        });

        it('should create error response with details', () => {
            const details = {
                url: 'https://example.com/api',
                project: 'TEST',
                issueType: 'Bug',
                status: 400,
                statusText: 'Bad Request',
                response: { error: 'validation failed' }
            };

            const result = createJiraError('Test error', details);
            const parsed = JSON.parse(result);

            expect(parsed.ok).toBe(false);
            expect(parsed.error).toBe('Test error');
            expect(parsed.details).toEqual(details);
        });
    });

    describe('handleJiraCreateIssue', () => {
        let mockPort: Port;
        let debuggerAttachedMap: Record<number, boolean>;

        beforeEach(() => {
            mockPort = {
                postMessage: vi.fn()
            } as any;
            debuggerAttachedMap = {};

            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST'
                    }
                })
            });
        });

        it('should handle missing Jira settings', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(defaultSettings)
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockPort.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'jira.response',
                    requestId: 'req-1'
                })
            );

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toContain('Missing Jira settings');
        });

        it('should create issue successfully without tabId', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-123' })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://test.atlassian.net/rest/api/2/issue',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-token'
                    })
                })
            );

            expect(mockPort.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'jira.response',
                    requestId: 'req-1'
                })
            );

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
            expect(data.key).toBe('TEST-123');
            expect(data.url).toBe('https://test.atlassian.net/browse/TEST-123');
        });

        it('should send assignee when jira user is set with API v3', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'assignee@example.com',
                        apiVersion: '3'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            accountId: 'account-123',
                            emailAddress: 'assignee@example.com'
                        }
                    ]
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-124' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockFetch).toHaveBeenNthCalledWith(
                1,
                'https://test.atlassian.net/rest/api/3/user/assignable/multiProjectSearch?projectKeys=TEST&query=assignee%40example.com',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token'
                    })
                })
            );

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toEqual({ id: 'account-123' });
        });

        it('should send assignee when jira user is set with API v2 using user picker', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'assignee@example.com',
                        apiVersion: '2'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        users: [
                            {
                                name: 'jsmith',
                                key: 'jsmithKey',
                                html: '<span>John Smith</span>',
                                displayName: 'John Smith'
                            }
                        ],
                        total: 1,
                        header: 'Showing 1 of 1 matching users'
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-125' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockFetch).toHaveBeenNthCalledWith(
                1,
                'https://test.atlassian.net/rest/api/2/user/picker?query=assignee%40example.com',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token'
                    })
                })
            );

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toEqual({ name: 'jsmith' });
        });

        it('should omit assignee when API v2 user picker returns empty users', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'missing@example.com',
                        apiVersion: '2'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        users: [],
                        total: 0,
                        header: 'Showing 0 of 0 matching users'
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-126' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toBeUndefined();
        });

        it('should omit assignee when API v2 user picker request fails', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'user@example.com',
                        apiVersion: '2'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 403,
                    statusText: 'Forbidden'
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-127' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toBeUndefined();
        });

        it('should handle API v2 user picker JSON parse error gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'user@example.com',
                        apiVersion: '2'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => {
                        throw new Error('Invalid JSON');
                    }
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-128' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toBeUndefined();
        });

        it('should handle API v2 user picker response with invalid users array', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'user@example.com',
                        apiVersion: '2'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        users: 'not an array',
                        total: 0,
                        header: ''
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-129' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toBeUndefined();
        });

        it('should omit assignee when API v3 lookup returns no users', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        user: 'missing@example.com',
                        apiVersion: '3'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-124' })
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[1];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.assignee).toBeUndefined();
        });

        it('should use custom issueType from payload', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-124' })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description',
                issueType: 'Bug'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.issuetype.name).toBe('Bug');
        });

        it('should include custom fields from payload', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-124' })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description',
                fields: {
                    customfield_123: 'custom value',
                    priority: { name: 'High' }
                }
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.customfield_123).toBe('custom value');
            expect(body.fields.priority).toEqual({ name: 'High' });
        });

        it('should handle API errors with missing fields', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({
                    errors: {
                        priority: 'Priority is required',
                        customfield_123: 'Field is required'
                    }
                })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.missingFields).toEqual(['priority', 'customfield_123']);
        });

        it('should handle API errors with errorMessages', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: async () => ({
                    errorMessages: ['Permission denied', 'Access restricted']
                })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Permission denied, Access restricted');
        });

        it('should handle fetch errors', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test description'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Network error');
        });

        it('should gather page state when tabId is provided', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-125' })
            });

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com',
                        title: 'Example Page',
                        userAgent: 'Test Agent'
                    })
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Found at $site$ - $service_info$',
                tabId: 123
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockChrome.debugger.attach).toHaveBeenCalledWith(
                { tabId: 123 },
                '1.3'
            );
            expect(mockChrome.debugger.sendCommand).toHaveBeenCalledWith(
                { tabId: 123 },
                'Runtime.evaluate',
                expect.any(Object)
            );
            expect(mockChrome.debugger.detach).toHaveBeenCalledWith({
                tabId: 123
            });

            const fetchCall = mockFetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.description).toContain('https://example.com');
            expect(body.fields.description).toContain('userAgent: Test Agent');
        });

        it('should use template for description when provided', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-126' })
            });

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com',
                        title: 'Example Page',
                        userAgent: 'Test Agent'
                    })
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Original description',
                template: 'Template: $site$ - $service_info$',
                tabId: 123
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const fetchCall = mockFetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.fields.description).toContain('Template:');
            expect(body.fields.description).toContain('https://example.com');
        });

        it('should not detach debugger if it was already attached', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-127' })
            });

            debuggerAttachedMap[123] = true;

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com'
                    })
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockChrome.debugger.attach).not.toHaveBeenCalled();
            expect(mockChrome.debugger.detach).not.toHaveBeenCalled();
        });

        it('should handle debugger errors gracefully', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-128' })
            });

            mockChrome.debugger.attach.mockRejectedValueOnce(
                new Error('Debugger error')
            );

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should still create the issue despite debugger error
            expect(mockFetch).toHaveBeenCalled();
            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });

        it('should attach screenshot when attachScreenshot is true', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-130' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({})
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({})
                });

            mockChrome.debugger.sendCommand
                .mockResolvedValueOnce({
                    result: {
                        value: JSON.stringify({
                            location: 'https://example.com'
                        })
                    }
                })
                .mockResolvedValueOnce({
                    data: 'base64screenshot'
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123,
                attachScreenshot: true
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockChrome.debugger.sendCommand).toHaveBeenCalledWith(
                { tabId: 123 },
                'Page.captureScreenshot',
                { format: 'png' }
            );

            // Expect 3 fetches: 1 for issue creation, 1 for screenshot, 1 for meta.txt
            expect(mockFetch).toHaveBeenCalledTimes(3);
            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                'https://test.atlassian.net/rest/api/2/issue/TEST-130/attachments',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'X-Atlassian-Token': 'no-check',
                        Authorization: 'Bearer test-token'
                    })
                })
            );
        });

        it('should handle screenshot capture errors', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-129' })
            });

            mockChrome.debugger.sendCommand
                .mockResolvedValueOnce({
                    result: {
                        value: JSON.stringify({
                            location: 'https://example.com'
                        })
                    }
                })
                .mockRejectedValueOnce(new Error('Screenshot failed'));

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123,
                attachScreenshot: true
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should still succeed despite screenshot failure
            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });

        it('should attach HAR zip when harZipData is provided', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-132' })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                harZipData: 'data:application/zip;base64,mockdata',
                harFileName: 'custom.har.zip'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                'https://test.atlassian.net/rest/api/2/issue/TEST-132/attachments',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'X-Atlassian-Token': 'no-check'
                    })
                })
            );
        });

        it('should attach page state meta.txt when pageState is provided', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-133' })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                pageState: JSON.stringify({ test: 'data' })
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                'https://test.atlassian.net/rest/api/2/issue/TEST-133/attachments',
                expect.any(Object)
            );
        });

        it('should open ticket in new tab when openTicketInNewTab is true', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        openTicketInNewTab: true
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-134' })
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockChrome.tabs.create).toHaveBeenCalledWith({
                url: 'https://test.atlassian.net/browse/TEST-134'
            });
        });

        it('should use incomingTabId when tabId is not in payload', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-135' })
            });

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com'
                    })
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(
                mockPort,
                message,
                debuggerAttachedMap,
                456 // incomingTabId
            );

            expect(mockChrome.debugger.attach).toHaveBeenCalledWith(
                { tabId: 456 },
                '1.3'
            );
        });

        it('should handle non-200 errors and detach debugger when needed', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({})
            });

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com'
                    })
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 999
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockChrome.debugger.detach).toHaveBeenCalledWith({
                tabId: 999
            });
        });

        it('should handle JSON parse errors in response', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Internal Server Error');
        });

        it('should handle errors.summary in response body', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({
                    errors: {
                        summary: 'Summary is required'
                    }
                })
            });

            const payload: JiraIssuePayload = {
                summary: '',
                description: 'Test'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Summary is required');
        });

        it('should handle HAR attachment errors gracefully', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-136' })
                })
                .mockRejectedValueOnce(new Error('Attachment failed'));

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                harZipData: 'data:application/zip;base64,mockdata'
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should still succeed despite attachment failure
            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });

        it('should handle meta.txt attachment errors gracefully', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-137' })
                })
                .mockRejectedValueOnce(new Error('Meta attachment failed'));

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                pageState: JSON.stringify({ test: 'data' })
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should still succeed despite attachment failure
            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });

        it('should not keep debugger attached if attachScreenshot is false', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-138' })
            });

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com'
                    })
                }
            });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123,
                attachScreenshot: false
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            expect(mockChrome.debugger.detach).toHaveBeenCalledWith({
                tabId: 123
            });
        });

        it('should handle detach errors in error path', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({})
            });

            mockChrome.debugger.sendCommand.mockResolvedValueOnce({
                result: {
                    value: JSON.stringify({
                        location: 'https://example.com'
                    })
                }
            });

            mockChrome.debugger.detach.mockRejectedValueOnce(
                new Error('Detach failed')
            );

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should handle error gracefully
            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
        });

        it('should handle detach errors in screenshot error path', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ key: 'TEST-139' })
            });

            mockChrome.debugger.sendCommand
                .mockResolvedValueOnce({
                    result: {
                        value: JSON.stringify({
                            location: 'https://example.com'
                        })
                    }
                })
                .mockRejectedValueOnce(new Error('Screenshot failed'));

            mockChrome.debugger.detach.mockRejectedValueOnce(
                new Error('Detach failed')
            );

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123,
                attachScreenshot: true
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should still succeed
            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });

        it('should detach debugger if already attached during screenshot', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST-140' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({})
                });

            debuggerAttachedMap[123] = true;

            mockChrome.debugger.sendCommand
                .mockResolvedValueOnce({
                    result: {
                        value: JSON.stringify({
                            location: 'https://example.com'
                        })
                    }
                })
                .mockResolvedValueOnce({
                    data: 'base64screenshot'
                });

            const payload: JiraIssuePayload = {
                summary: 'Test issue',
                description: 'Test',
                tabId: 123,
                attachScreenshot: true
            };

            const message: JiraCreateMessage = {
                type: 'jira.createIssue',
                requestId: 'req-1',
                data: JSON.stringify(payload)
            };

            await handleJiraCreateIssue(mockPort, message, debuggerAttachedMap);

            // Should not detach as it was already attached
            expect(mockChrome.debugger.detach).not.toHaveBeenCalled();
        });
    });

    describe('handleJiraTestSettings', () => {
        beforeEach(() => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        issueType: 'Bug'
                    }
                })
            });
        });

        it('should test settings successfully with sendResponse callback', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        { name: 'Task' },
                        { name: 'Bug' },
                        { name: 'Story' }
                    ]
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            expect(sendResponse).toHaveBeenCalledWith(
                JSON.stringify({ ok: true })
            );
        });

        it('should test settings successfully with port', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ name: 'Bug' }]
                });

            const mockPort = {
                postMessage: vi.fn()
            } as any;

            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, undefined, mockPort);

            expect(mockPort.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'jira.response',
                    requestId: 'req-1',
                    data: JSON.stringify({ ok: true })
                })
            );
        });

        it('should handle missing baseUrl or apiToken', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(defaultSettings)
            });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toContain('Missing Jira settings');
        });

        it('should handle authentication failure', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({ errorMessages: ['Invalid credentials'] })
            });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Invalid credentials');
        });

        it('should handle project not found', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                    statusText: 'Not Found',
                    json: async () => ({})
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('jira_testProjectNotFound');
        });

        it('should handle issue type not found', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ name: 'Task' }, { name: 'Story' }]
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('jira_testIssueTypeNotFound');
        });

        it('should handle fetch errors', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Error: Network error');
        });

        it('should skip project check if projectKey is empty', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: '',
                        issueType: 'Task'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ name: 'Task' }]
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            // Should only call fetch twice (auth and issue type)
            expect(mockFetch).toHaveBeenCalledTimes(2);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(true);
        });

        it('should handle non-array issue types response', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ invalid: 'format' })
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            // Should still succeed as it doesn't validate if not array
            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(true);
        });

        it('should handle issue type fetch failure', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error',
                    json: async () => ({})
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            // Should still succeed as issue type check is not mandatory
            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(true);
        });

        it('should handle auth response without errorMessages', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error',
                json: async () => ({})
            });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Server Error');
        });

        it('should handle issue types JSON parse error', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => {
                        throw new Error('Invalid JSON');
                    }
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            // JSON parse error is caught and returns [], which is empty array
            // Then it checks if Bug is in empty array, which fails
            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('jira_testIssueTypeNotFound');
        });

        it('should handle project response JSON parse error', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error',
                    json: async () => {
                        throw new Error('Invalid JSON');
                    }
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('jira_testProjectNotFound');
        });

        it('should handle auth response JSON parse error', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });

        it('should use default issueType when not provided', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        issueType: undefined
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ name: 'Task' }]
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(true);
        });

        it('should use default apiVersion when not provided', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST',
                        issueType: 'Bug',
                        apiVersion: undefined
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ displayName: 'Test User' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ key: 'TEST' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ name: 'Bug' }]
                });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            // Should use API version 2 by default
            expect(mockFetch).toHaveBeenCalledWith(
                'https://test.atlassian.net/rest/api/2/myself',
                expect.any(Object)
            );

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(true);
        });

        it('should handle neither port nor sendResponse provided', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TEST'
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ displayName: 'Test User' })
            });

            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            // Should not throw when neither port nor sendResponse is provided
            await expect(
                handleJiraTestSettings(message, undefined, undefined)
            ).resolves.not.toThrow();
        });

        it('should handle response with empty errorMessages array', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error',
                json: async () => ({ errorMessages: [] })
            });

            const sendResponse = vi.fn();
            const message: JiraTestMessage = {
                type: 'jira.testSettings',
                requestId: 'req-1'
            };

            await handleJiraTestSettings(message, sendResponse);

            const call = sendResponse.mock.calls[0][0];
            const data = JSON.parse(call);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Server Error');
        });
    });

    describe('handleJiraGetMetadata', () => {
        let mockPort: Port;
        let testCounter = 0;

        beforeEach(() => {
            mockPort = {
                postMessage: vi.fn()
            } as any;

            // Use unique projectKey for each test to invalidate cache
            testCounter++;
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: `https://test${testCounter}.atlassian.net`,
                        apiToken: 'test-token',
                        projectKey: `TEST${testCounter}`,
                        issueType: 'Bug'
                    }
                })
            });
        });

        it('should fetch and cache metadata successfully', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [
                            { id: '10001', name: 'Bug' },
                            { id: '10002', name: 'Task' }
                        ]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fields: [
                            {
                                key: 'summary',
                                name: 'Summary',
                                required: true,
                                hasDefaultValue: false,
                                schema: { type: 'string' }
                            },
                            {
                                key: 'priority',
                                name: 'Priority',
                                required: true,
                                hasDefaultValue: false,
                                schema: { type: 'priority' },
                                allowedValues: [
                                    { id: '1', value: 'High' },
                                    { id: '2', name: 'Medium' }
                                ]
                            },
                            {
                                key: 'description',
                                name: 'Description',
                                required: false,
                                schema: { type: 'string' }
                            }
                        ]
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            expect(mockPort.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'jira.response',
                    requestId: 'req-1'
                })
            );

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
            expect(data.fields).toHaveLength(1); // Only priority (summary is excluded)
            expect(data.fields[0].key).toBe('priority');
            expect(data.allFields).toHaveLength(3);
        });

        it('should use cached metadata on subsequent calls', async () => {
            // Override settings to use same projectKey for cache test
            const cacheTestSettings = {
                ...defaultSettings,
                jira: {
                    ...defaultSettings.jira,
                    baseUrl: 'https://cache-test.atlassian.net',
                    apiToken: 'test-token',
                    projectKey: 'CACHE',
                    issueType: 'Bug'
                }
            };

            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(cacheTestSettings)
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fields: [
                            {
                                key: 'priority',
                                name: 'Priority',
                                required: true,
                                hasDefaultValue: false,
                                schema: { type: 'priority' }
                            }
                        ]
                    })
                });

            const message1: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message1, mockPort);

            // Second call should use cache
            const message2: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-2'
            };

            await handleJiraGetMetadata(message2, mockPort);

            // Should only fetch once (first call fetches, second uses cache)
            expect(mockFetch).toHaveBeenCalledTimes(2);

            expect(mockPort.postMessage).toHaveBeenCalledTimes(2);
        });

        it('should handle missing Jira settings', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify(defaultSettings)
            });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toContain('Missing Jira settings');
        });

        it('should handle project fetch error', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({ errorMessages: ['Project not found'] })
            });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Project not found');
        });

        it('should handle issue type not found in project', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    issueTypes: [
                        { id: '10001', name: 'Task' },
                        { id: '10002', name: 'Story' }
                    ]
                })
            });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toContain('Issue type "Bug" not found');
        });

        it('should handle metadata fetch error', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error',
                    json: async () => ({
                        errorMessages: ['Internal error']
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Internal error');
        });

        it('should handle metadata with fieldId instead of key', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fields: [
                            {
                                fieldId: 'customfield_123',
                                name: 'Custom Field',
                                required: true,
                                hasDefaultValue: false,
                                schema: { type: 'string' }
                            }
                        ]
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
            expect(data.allFields[0].key).toBe('customfield_123');
        });

        it('should filter out fields with hasDefaultValue', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fields: [
                            {
                                key: 'priority',
                                name: 'Priority',
                                required: true,
                                hasDefaultValue: true,
                                schema: { type: 'priority' }
                            },
                            {
                                key: 'customfield_456',
                                name: 'Custom',
                                required: true,
                                hasDefaultValue: false,
                                schema: { type: 'string' }
                            }
                        ]
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
            expect(data.fields).toHaveLength(1);
            expect(data.fields[0].key).toBe('customfield_456');
        });

        it('should handle metadata with values instead of fields', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        values: [
                            {
                                key: 'priority',
                                name: 'Priority',
                                required: true,
                                schema: { type: 'priority' }
                            }
                        ]
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
            expect(data.allFields).toHaveLength(1);
        });

        it('should handle fetch exception', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockRejectedValueOnce(new Error('Network failure'));

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Error: Network failure');
        });

        it('should handle metadata response without statusText', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: '',
                    json: async () => ({})
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Failed to fetch metadata');
        });

        it('should handle project response without statusText', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: '',
                json: async () => ({})
            });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Failed to fetch project details');
        });

        it('should handle JSON parse error in project response', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error',
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Server Error');
        });

        it('should handle JSON parse error in metadata response', async () => {
            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error',
                    json: async () => {
                        throw new Error('Invalid JSON');
                    }
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(false);
            expect(data.error).toBe('Server Error');
        });

        it('should use default issueType when not provided in getMetadata', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test-default.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TESTDEFAULT',
                        issueType: undefined
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Task' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fields: []
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });

        it('should use default apiVersion when not provided in getMetadata', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                settings: JSON.stringify({
                    ...defaultSettings,
                    jira: {
                        ...defaultSettings.jira,
                        baseUrl: 'https://test-api.atlassian.net',
                        apiToken: 'test-token',
                        projectKey: 'TESTAPI',
                        issueType: 'Bug',
                        apiVersion: undefined
                    }
                })
            });

            const mockFetch = global.fetch as any;
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        issueTypes: [{ id: '10001', name: 'Bug' }]
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fields: []
                    })
                });

            const message: JiraGetMetadataMessage = {
                type: 'jira.getMetadata',
                requestId: 'req-1'
            };

            await handleJiraGetMetadata(message, mockPort);

            // Should use API version 2 by default
            expect(mockFetch).toHaveBeenCalledWith(
                'https://test-api.atlassian.net/rest/api/2/project/TESTAPI',
                expect.any(Object)
            );

            const call = (mockPort.postMessage as any).mock.calls[0][0];
            const data = JSON.parse(call.data);
            expect(data.ok).toBe(true);
        });
    });
});
