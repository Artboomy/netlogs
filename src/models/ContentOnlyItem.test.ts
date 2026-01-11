import { describe, it, expect } from 'vitest';
import ContentOnlyItem from './ContentOnlyItem';
import { createSearchMarker } from 'utils';
import { createHarEntry } from './testUtils';

describe('ContentOnlyItem', () => {
    it('serializes content and respects search marker', () => {
        const item = new ContentOnlyItem({
            timestamp: 100,
            tag: 'LOG',
            content: { status: 'ok' },
            meta: null
        });
        const marker = createSearchMarker('ok');
        const missingMarker = createSearchMarker('missing');

        expect(item.shouldShow({ searchValue: 'ok', marker })).toBe(true);
        expect(
            item.shouldShow({ searchValue: 'missing', marker: missingMarker })
        ).toBe(false);

        const json = item.toJSON();
        expect(json.request.method).toBe('LOG');
        expect(JSON.parse(json.response.content.text || '')).toEqual({
            status: 'ok'
        });

        const restored = ContentOnlyItem.fromJSON(createHarEntry());
        expect(restored.getContent()).toEqual({ status: 'ok' });
    });

    it('returns defaults without search config', () => {
        const item = new ContentOnlyItem({
            timestamp: 5,
            tag: 'INFO',
            content: 'hello',
            meta: null
        });

        expect(item.shouldShow()).toBe(true);
        expect(item.shouldShow({ searchValue: 'hello' })).toBe(true);
        expect(item.shouldShow({ marker: createSearchMarker('hello') })).toBe(true);
        expect(item.getTag()).toBe('INFO');
        expect(item.getMeta()).toBeNull();
        expect(item.getDuration()).toBe(0);
        expect(item.isError()).toBe(false);

        item.setComputedFields();
    });
});
