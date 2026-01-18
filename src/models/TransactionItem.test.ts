import { describe, it, expect } from 'vitest';
import TransactionItem from './TransactionItem';
import { createSearchMarker } from 'utils';
import { createHarEntry } from './testUtils';

describe('TransactionItem', () => {
    it('serializes and deserializes HAR entries', () => {
        const cfg = {
            timestamp: 1234,
            name: 'https://example.com/tx',
            tag: 'POST',
            duration: 50,
            meta: null,
            params: { action: 'ping' },
            result: { status: 'ok' }
        };
        const item = new TransactionItem(cfg);

        const json = item.toJSON();

        expect(json.request.method).toBe('POST');
        expect(json.request.url).toBe('https://example.com/tx');
        expect(JSON.parse(json.request.postData?.text || '')).toEqual(cfg.params);
        expect(JSON.parse(json.response.content.text || '')).toEqual(cfg.result);
        expect(item.getDuration()).toBe(50);

        const restored = TransactionItem.fromJSON(createHarEntry());

        expect(restored.getName()).toBe('https://example.com/api/test');
        expect(restored.getParams()).toEqual({ action: 'ping' });
        expect(restored.getContent()).toEqual({ status: 'ok' });
    });

    it('filters by name and search marker', () => {
        const item = new TransactionItem({
            timestamp: 10,
            name: 'search-target',
            tag: 'POST',
            duration: 0,
            meta: null,
            params: { needle: 'value' },
            result: { status: 'ok' }
        });
        const marker = createSearchMarker('needle');

        expect(
            item.shouldShow({
                searchValue: 'needle',
                marker,
                filterValue: 'search'
            })
        ).toBe(true);
        expect(
            item.shouldShow({
                searchValue: 'needle',
                marker,
                filterValue: 'missing'
            })
        ).toBe(false);
    });

    it('handles default properties and filter-only search', () => {
        const item = new TransactionItem({
            timestamp: 55,
            name: 'sample',
            tag: 'PUT',
            duration: undefined,
            meta: null,
            params: {},
            result: {}
        });

        expect(item.shouldShow({ filterValue: 'sam' })).toBe(true);
        expect(item.shouldShow({ filterValue: 'nomatch' })).toBe(false);
        expect(item.getTag()).toBe('');
        expect(item.isError()).toBe(false);
        expect(item.getDuration()).toBe(0);
    });

    it('deserializes empty params and results', () => {
        const baseEntry = createHarEntry();
        const entry = createHarEntry({
            request: {
                ...baseEntry.request,
                postData: undefined
            },
            response: {
                ...baseEntry.response,
                content: {
                    ...baseEntry.response.content,
                    text: undefined
                }
            }
        });

        const restored = TransactionItem.fromJSON(entry);

        expect(restored.getParams()).toEqual({});
        expect(restored.getContent()).toEqual({});
    });

    it('returns meta and default name', () => {
        const meta = { request: { title: 'Meta', items: [] } };
        const item = new TransactionItem({
            timestamp: 0,
            name: '',
            tag: '',
            duration: 5,
            meta,
            params: {},
            result: {}
        });

        expect(item.getName()).toBe('No name');
        expect(item.getMeta()).toBe(meta);

        item.setComputedFields();
    });

    it('handles mime wrapped content in search', () => {
        const item = new TransactionItem({
            timestamp: 0,
            name: 'mime',
            tag: 'POST',
            duration: 0,
            meta: null,
            params: {},
            result: {
                __mimeType: 'application/json',
                __getRaw: () => ({ needle: 'value' })
            }
        });
        const marker = createSearchMarker('needle');

        expect(item.shouldShow({ searchValue: 'needle', marker })).toBe(true);
    });
});
