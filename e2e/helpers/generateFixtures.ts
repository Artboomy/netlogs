import { Har } from 'har-format';
import fs from 'fs';
import path from 'path';

/**
 * Generates a large HAR file with specified number of entries
 * Used for performance testing without committing large files to git
 */
export function generateLargeHar(entryCount: number = 1000): Har {
    const entries = [];
    const baseTimestamp = new Date('2021-03-18T07:26:00.000Z').getTime();

    for (let i = 0; i < entryCount; i++) {
        const timestamp = new Date(baseTimestamp + i * 100);
        const method = ['GET', 'POST', 'PUT', 'DELETE'][i % 4];
        const status = [200, 201, 204, 400, 404, 500][i % 6];
        const domain = ['api.example.com', 'cdn.example.com', 'static.example.com'][i % 3];

        entries.push({
            _initiator: { type: 'other' },
            _priority: 'High',
            _resourceType: i % 10 === 0 ? 'xhr' : 'other',
            cache: {},
            connection: String(16839 + (i % 100)),
            pageref: 'page_1',
            request: {
                method,
                url: `https://${domain}/api/resource/${i}?param=${i}`,
                httpVersion: 'HTTP/2.0',
                headers: [
                    { name: 'Host', value: domain },
                    { name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    { name: 'Accept', value: 'application/json' },
                    { name: 'Accept-Encoding', value: 'gzip, deflate, br' }
                ],
                queryString: [{ name: 'param', value: String(i) }],
                cookies: [],
                headersSize: 400,
                bodySize: method === 'GET' ? 0 : 150
            },
            response: {
                status,
                statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
                httpVersion: 'HTTP/2.0',
                headers: [
                    { name: 'Content-Type', value: 'application/json; charset=utf-8' },
                    { name: 'Content-Length', value: String(200 + i % 1000) },
                    { name: 'Cache-Control', value: 'no-cache' },
                    { name: 'Date', value: timestamp.toUTCString() }
                ],
                cookies: [],
                content: {
                    size: 200 + i % 1000,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        id: i,
                        data: `Response data for request ${i}`,
                        timestamp: timestamp.toISOString()
                    })
                },
                redirectURL: '',
                headersSize: 300,
                bodySize: 200 + i % 1000,
                _transferSize: 500 + i % 1000,
                _error: null
            },
            serverIPAddress: '192.168.1.' + (i % 255),
            startedDateTime: timestamp.toISOString(),
            time: 50 + (i % 500),
            timings: {
                blocked: 1 + (i % 10),
                dns: i % 5 === 0 ? 20 : -1,
                ssl: i % 3 === 0 ? 30 : -1,
                connect: i % 5 === 0 ? 40 : -1,
                send: 0.5,
                wait: 30 + (i % 200),
                receive: 10 + (i % 50),
                _blocked_queueing: 0.5
            }
        });
    }

    return {
        log: {
            version: '1.2',
            creator: {
                name: 'HAR Generator',
                version: '1.0'
            },
            pages: [
                {
                    startedDateTime: new Date(baseTimestamp).toISOString(),
                    id: 'page_1',
                    title: 'Performance Test Page',
                    pageTimings: {
                        onContentLoad: 1500,
                        onLoad: 2000
                    }
                }
            ],
            entries: entries as any[]
        }
    };
}

/**
 * Ensures a large HAR fixture file exists, generating it if necessary
 * @param filePath Path to the fixture file
 * @param entryCount Number of entries to generate
 * @returns Path to the fixture file
 */
export function ensureLargeHarFixture(filePath: string, entryCount: number = 1000): string {
    if (!fs.existsSync(filePath)) {
        console.log(`Generating large HAR fixture with ${entryCount} entries...`);
        const har = generateLargeHar(entryCount);
        fs.writeFileSync(filePath, JSON.stringify(har, null, 2));
        console.log(`Generated: ${filePath}`);
    }
    return filePath;
}

/**
 * Generates a HAR file with specific characteristics for testing
 */
export function generateCustomHar(options: {
    entryCount: number;
    methods?: string[];
    mimeTypes?: string[];
    includeWebSocket?: boolean;
}): Har {
    const { entryCount, methods = ['GET'], mimeTypes = ['application/json'], includeWebSocket = false } = options;
    const entries = [];
    const baseTimestamp = new Date('2021-03-18T07:26:00.000Z').getTime();

    for (let i = 0; i < entryCount; i++) {
        const timestamp = new Date(baseTimestamp + i * 100);
        const method = methods[i % methods.length];
        const mimeType = mimeTypes[i % mimeTypes.length];

        entries.push({
            _initiator: { type: 'other' },
            _priority: 'High',
            _resourceType: 'xhr',
            cache: {},
            connection: String(16839 + i),
            pageref: 'page_1',
            request: {
                method,
                url: `https://api.example.com/resource/${i}`,
                httpVersion: 'HTTP/2.0',
                headers: [
                    { name: 'Host', value: 'api.example.com' },
                    { name: 'Accept', value: mimeType }
                ],
                queryString: [],
                cookies: [],
                headersSize: 300,
                bodySize: 0
            },
            response: {
                status: 200,
                statusText: 'OK',
                httpVersion: 'HTTP/2.0',
                headers: [
                    { name: 'Content-Type', value: mimeType }
                ],
                cookies: [],
                content: {
                    size: 100,
                    mimeType,
                    text: `{"id": ${i}}`
                },
                redirectURL: '',
                headersSize: 200,
                bodySize: 100,
                _transferSize: 300,
                _error: null
            },
            serverIPAddress: '192.168.1.1',
            startedDateTime: timestamp.toISOString(),
            time: 50,
            timings: {
                blocked: 1,
                dns: -1,
                ssl: -1,
                connect: -1,
                send: 0.5,
                wait: 40,
                receive: 8.5,
                _blocked_queueing: 0.5
            }
        });
    }

    return {
        log: {
            version: '1.2',
            creator: {
                name: 'Custom HAR Generator',
                version: '1.0'
            },
            pages: [
                {
                    startedDateTime: new Date(baseTimestamp).toISOString(),
                    id: 'page_1',
                    title: 'Custom Test Page',
                    pageTimings: {
                        onContentLoad: 1000,
                        onLoad: 1500
                    }
                }
            ],
            entries: entries as any[]
        }
    };
}
