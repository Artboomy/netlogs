import { describe, expect, it } from 'vitest';
import { isTagVisible } from './tagFilter';

describe('isTagVisible', () => {
    it('uses persisted hidden tags when no temporary selection is active', () => {
        expect(
            isTagVisible('alpha', {
                hiddenTags: { beta: 'beta' },
                selectedTag: null
            })
        ).toBe(true);
        expect(
            isTagVisible('beta', {
                hiddenTags: { beta: 'beta' },
                selectedTag: null
            })
        ).toBe(false);
    });

    it('shows only the temporarily selected tag', () => {
        expect(
            isTagVisible('alpha', {
                hiddenTags: { alpha: 'alpha', beta: 'beta' },
                selectedTag: 'beta'
            })
        ).toBe(false);
        expect(
            isTagVisible('beta', {
                hiddenTags: { alpha: 'alpha', beta: 'beta' },
                selectedTag: 'beta'
            })
        ).toBe(true);
    });
});
