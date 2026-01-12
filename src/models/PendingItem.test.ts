import { describe, it, expect, vi, afterEach } from 'vitest';
import PendingItem from './PendingItem';
import { ItemType } from './enums';
import type { PendingRequestData } from '../types';

type PendingOverrides = Partial<Omit<PendingRequestData, 'request'>> & {
    request?: Partial<PendingRequestData['request']>;
};

const createPendingData = (overrides: PendingOverrides = {}) => {
    const data: PendingRequestData = {
        id: 'pending-id',
        timestamp: 1000,
        request: {
            method: 'POST',
            url: 'https://example.com/pending',
            httpVersion: 'HTTP/1.1',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            queryString: [],
            postData: {
                mimeType: 'application/json',
                text: '{"hello":"world"}'
            }
        }
    };

    return {
        ...data,
        ...overrides,
        request: {
            ...data.request,
            ...(overrides.request || {})
        }
    };
};

describe('PendingItem', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('serializes pending request data and parses params', () => {
        const data = createPendingData();
        const item = new PendingItem(data);

        const json = item.toJSON();

        expect(json.comment).toBe(ItemType.Pending);
        expect(json.request.method).toBe('POST');
        expect(json.request.url).toBe('https://example.com/pending');
        expect(json.request.headers).toEqual(data.request.headers);
        expect(json.request.bodySize).toBe(data.request.postData?.text.length);
        expect(json.response.statusText).toBe('Pending...');
        expect(item.getParams()).toEqual({ hello: 'world' });
        expect(item.getContent()).toEqual({ hello: 'world' });
    });

    it('falls back to raw body for invalid JSON', () => {
        const item = new PendingItem(
            createPendingData({
                request: {
                    postData: {
                        mimeType: 'text/plain',
                        text: 'not-json'
                    }
                }
            })
        );

        expect(item.getParams()).toEqual({ body: 'not-json' });
        expect(item.getContent()).toEqual({ body: 'not-json' });
    });

    it('respects filter value and calculates duration', () => {
        const item = new PendingItem(createPendingData());
        const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1800);

        expect(item.shouldShow({ filterValue: 'pending' })).toBe(true);
        expect(item.shouldShow({ filterValue: 'missing' })).toBe(false);
        expect(item.getDuration()).toBe(800);

        nowSpy.mockRestore();
    });

    it('returns fallback content without postData', () => {
        const item = new PendingItem(
            createPendingData({
                request: {
                    postData: undefined
                }
            })
        );

        expect(item.getParams()).toEqual({});
        expect(item.getContent()).toEqual({ status: 'Pending...' });
    });

    it('handles invalid URLs and empty headers', () => {
        const item = new PendingItem(
            createPendingData({
                request: {
                    url: 'not a url',
                    headers: []
                }
            })
        );

        expect(item.getName()).toBe('not a url');
        expect(item.getMeta()).toBeNull();
        expect(item.getUrl()).toBe('not a url');
        expect(item.getMethod()).toBe('POST');
    });

    it('exposes tags, meta, and default visibility', () => {
        const data = createPendingData();
        const item = new PendingItem(data);

        expect(item.shouldShow()).toBe(true);
        expect(item.getTag()).toBe('POST');
        expect(item.isError()).toBe(false);
        expect(item.getMeta()).toEqual({
            request: {
                title: 'Request',
                items: data.request.headers
            }
        });

        item.setComputedFields();
    });

    it('serializes when postData is missing', () => {
        const item = new PendingItem(
            createPendingData({
                request: {
                    postData: undefined
                }
            })
        );

        const json = item.toJSON();

        expect(json.request.bodySize).toBe(-1);
        expect(json.request.postData).toBeUndefined();
    });
});
