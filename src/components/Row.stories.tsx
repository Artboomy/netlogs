import React, { ReactNode } from 'react';
import { Row as Component } from './Row';
import har from '../demo/example.json';
import NetworkItem from '../models/NetworkItem';
import { Entry } from 'har-format';
import ContentOnlyItem from '../models/ContentOnlyItem';

export default {
    title: 'Row',
    component: Component
};

const networkItem = new NetworkItem({
    request: (har.log.entries[0] as unknown) as Entry
});

export const Transaction = (): ReactNode => <Component item={networkItem} />;

const contentItem = new ContentOnlyItem({
    timestamp: new Date().getTime(),
    tag: 'Tag',
    content: {
        someData: 1,
        objData: {
            breed: 'dog'
        },
        otherData: []
    }
});
export const ContentOnly = (): ReactNode => <Component item={contentItem} />;
