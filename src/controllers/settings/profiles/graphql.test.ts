/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { graphqlProfile, isGraphql } from './graphql';
import { NetworkRequest } from 'models/types';

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

describe('graphql profile functions', () => {
    describe('getName', () => {
        it('should return operation name from params', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"operationName":"GetUser","query":"query GetUser { user { id } }"}' }
                }
            });
            expect(graphqlProfile.functions.getName(request)).toBe('GetUser');
        });

        it('should extract name from query string', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"query":"query GetUser({ user { id } })"}' }
                }
            });
            expect(graphqlProfile.functions.getName(request)).toBe('query::GetUser');
        });

        it('should handle mutation type', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"query":"mutation CreateUser({ createUser { id } })"}' }
                }
            });
            expect(graphqlProfile.functions.getName(request)).toBe('mutation::CreateUser');
        });

        it('should handle unnamed queries', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"query":"query { user { id } }"}' }
                }
            });
            expect(graphqlProfile.functions.getName(request)).toBe('query::Unnamed');
        });

        it('should use query_hash if available', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"query_hash":"abc123"}' }
                }
            });
            expect(graphqlProfile.functions.getName(request)).toBe('abc123');
        });

        it('should return empty string for invalid params', () => {
            const request = createMockRequest({
                request: {
                    method: 'GET',
                    url: 'https://example.com/api'
                }
            });
            expect(graphqlProfile.functions.getName(request)).toBe('');
        });
    });

    describe('getTag', () => {
        it('should return GQL tag', () => {
            const request = createMockRequest();
            expect(graphqlProfile.functions.getTag(request)).toBe('GQL');
        });
    });

    describe('isError', () => {
        it('should detect errors in GraphQL response', () => {
            const request = createMockRequest({
                response: {
                    status: 200,
                    content: {
                        mimeType: 'application/json',
                        text: '{"errors":[{"message":"Error"}]}'
                    }
                }
            });
            expect(graphqlProfile.functions.isError(request)).toBe(true);
        });

        it('should return false for successful response', () => {
            const request = createMockRequest({
                response: {
                    status: 200,
                    content: {
                        mimeType: 'application/json',
                        text: '{"data":{"user":{"id":"123"}}}'
                    }
                }
            });
            expect(graphqlProfile.functions.isError(request)).toBe(false);
        });
    });

    describe('shouldShow', () => {
        it('should always return true', () => {
            const request = createMockRequest();
            expect(graphqlProfile.functions.shouldShow(request)).toBe(true);
        });
    });

    describe('getResult', () => {
        it('should unwrap data from GraphQL response', () => {
            const request = createMockRequest();
            const result = graphqlProfile.functions.getResult(
                request,
                '{"data":{"user":{"id":"123"}}}'
            );
            expect(result).toEqual({ user: { id: '123' } });
        });

        it('should return full response if errors present', () => {
            const request = createMockRequest();
            const content = '{"data":null,"errors":[{"message":"Error"}]}';
            const result = graphqlProfile.functions.getResult(request, content);
            expect(result).toEqual({ data: null, errors: [{ message: 'Error' }] });
        });

        it('should handle non-GraphQL response', () => {
            const request = createMockRequest();
            const result = graphqlProfile.functions.getResult(request, '{"key":"value"}');
            expect(result).toEqual({ key: 'value' });
        });
    });
});

describe('isGraphql', () => {
    it('should detect GraphQL by query field', () => {
        const params = { query: 'query { user { id } }' };
        expect(isGraphql(params, null)).toBe(true);
    });

    it('should detect GraphQL by query_hash field', () => {
        const params = { query_hash: 'abc123' };
        expect(isGraphql(params, null)).toBe(true);
    });

    it('should detect GraphQL by weak params match', () => {
        const params = { operationName: 'GetUser', variables: {} };
        expect(isGraphql(params, null, '__typename')).toBe(true);
    });

    it('should return false for non-GraphQL params', () => {
        const params = { method: 'someMethod' };
        expect(isGraphql(params, null)).toBe(false);
    });
});
