import { describe, it, expect } from 'vitest';
import TransactionItem from './TransactionItem';
import ContentOnlyItem from './ContentOnlyItem';
import { isTransactionItem } from './utils';

describe('model utils', () => {
    it('identifies transaction items', () => {
        const transaction = new TransactionItem({
            timestamp: 0,
            name: 't',
            tag: 'POST',
            duration: 0,
            meta: null,
            params: {},
            result: {}
        });
        const contentOnly = new ContentOnlyItem({
            timestamp: 0,
            content: 'test',
            meta: null
        });

        expect(isTransactionItem(transaction)).toBe(true);
        expect(isTransactionItem(contentOnly)).toBe(false);
    });
});
