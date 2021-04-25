import React, { FC, useEffect, useState } from 'react';
import { useListStore } from '../../controllers/network';
import { useSettings } from '../../controllers/settings';
import { Row } from '../Row';
import { List } from '../List';
import { nanoid } from 'nanoid';

export const ListContainer: FC = () => {
    const { list } = useListStore();
    const [key, setKey] = useState(nanoid());
    const [settings] = useSettings();
    useEffect(() => {
        setKey(nanoid());
    }, [settings]);
    const content = list
        .filter((networkItem) => networkItem.shouldShow())
        .map((networkItem) => {
            return <Row key={networkItem.id} item={networkItem} />;
        });
    return <List key={key} content={content} />;
};
