import type { Entry } from 'har-format';

export const createHarEntry = (overrides: Partial<Entry> = {}): Entry => {
    const entry: Entry = {
        startedDateTime: new Date(0).toISOString(),
        time: 0,
        comment: '',
        request: {
            method: 'POST',
            url: 'https://example.com/api/test',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: [],
            queryString: [],
            headersSize: -1,
            bodySize: -1,
            postData: {
                mimeType: 'application/json',
                text: '{"action":"ping"}'
            }
        },
        response: {
            status: 200,
            statusText: 'ok',
            httpVersion: '',
            cookies: [],
            headers: [],
            content: {
                size: -1,
                mimeType: 'application/json',
                text: '{"status":"ok"}'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1
        },
        cache: {},
        timings: {
            send: 5,
            wait: 15,
            receive: 10
        }
    };

    return {
        ...entry,
        ...overrides,
        request: {
            ...entry.request,
            ...(overrides.request || {})
        },
        response: overrides.response
            ? {
                  ...entry.response,
                  ...overrides.response,
                  content: {
                      ...entry.response.content,
                      ...(overrides.response.content || {})
                  }
              }
            : entry.response,
        timings: overrides.timings
            ? { ...entry.timings, ...overrides.timings }
            : entry.timings
    } as Entry;
};
