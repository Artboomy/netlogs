import React, { FC } from 'react';
import { PanelApp as Component } from '../PanelApp';
import data from '../../demo/example.json';
import { NetworkRequest } from '../../models/types';
import NetworkItem from '../../models/NetworkItem';
import { useListStore } from '../../controllers/network';

export default {
    title: 'PanelApp',
    component: Component
};

// Initialize store data before component mounts
const demoList = data.log.entries as unknown as NetworkRequest[];
useListStore
    .getState()
    .setList(
        demoList.map((request) => new NetworkItem({ request })),
        false
    );

export const PanelApp: FC = () => <Component />;
