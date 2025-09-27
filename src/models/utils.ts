import { AnyItem } from 'controllers/network';
import TransactionItem from 'models/TransactionItem';
import { ItemType } from 'models/enums';

export const isTransactionItem = (item: AnyItem): item is TransactionItem => {
    return item.type === ItemType.Transaction;
};
