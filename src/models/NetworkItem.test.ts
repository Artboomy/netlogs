import { describe, it, expect } from 'vitest';
import NetworkItem from './NetworkItem';
import { createSearchMarker } from 'utils';
import { createHarEntry } from './testUtils';

describe('NetworkItem', () => {
    it('computes fields with default profile', () => {
        const item = new NetworkItem({ request: createHarEntry() });

        expect(item.getName()).toBe('/api/test');
        expect(item.getTag()).toBe('POST');
        expect(item.getParams()).toEqual({ action: 'ping' });

        const meta = item.getMeta();
        expect(meta?.General?.title).toBe('General');

        const content = item.getContent();
        expect('__mimeType' in content).toBe(true);
        expect((content as { __getRaw?: () => unknown }).__getRaw?.()).toEqual({
            status: 'ok'
        });

        item.setComputedFields();
    });

    it('formats tags and errors from response status', () => {
        const baseEntry = createHarEntry();
        const request = createHarEntry({
            response: {
                ...baseEntry.response,
                status: 500,
                statusText: 'error'
            }
        });
        const item = new NetworkItem({ request });

        expect(item.getTag()).toBe('POST/500');
        expect(item.isError()).toBe(true);
    });

    it('filters by profile rules and search markers', () => {
        const baseEntry = createHarEntry();
        const assetItem = new NetworkItem({
            request: createHarEntry({
                request: {
                    ...baseEntry.request,
                    url: 'https://example.com/styles.css'
                }
            })
        });

        expect(assetItem.shouldShow()).toBe(false);

        const item = new NetworkItem({
            request: createHarEntry({
                request: {
                    ...baseEntry.request,
                    postData: {
                        mimeType: 'application/json',
                        text: '{"needle":"value"}'
                    }
                }
            })
        });
        const marker = createSearchMarker('needle');

        expect(
            item.shouldShow({
                searchValue: 'needle',
                marker,
                filterValue: 'api'
            })
        ).toBe(true);
        expect(item.shouldShow({ filterValue: 'missing' })).toBe(false);
    });

    it('reuses cached shouldShow results for same config', () => {
        const item = new NetworkItem({ request: createHarEntry() });
        const cfg = { filterValue: 'api/test' };

        expect(item.shouldShow(cfg)).toBe(true);
        expect(item.shouldShow(cfg)).toBe(true);
    });

    it('serializes requests from HAR data', () => {
        const entry = createHarEntry();
        const item = NetworkItem.fromJSON(entry);

        expect(item.toJSON()).toBe(entry);
        expect(item.getName()).toBe('/api/test');
    });
});
