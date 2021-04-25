import React, { ReactNode } from 'react';
import { PropTree as Component } from './PropTree';
import data from '../demo/example.json';

export default {
    title: 'PropTree',
    component: Component
};

const entry = data.log.entries[0];
const demoData = {
    headers: {
        title: 'Headers',
        items: entry.request.headers
    },
    timings: {
        title: 'Timings',
        items: Object.entries(entry.timings).map(([name, value]) => ({
            name,
            value
        }))
    }
};

export const PropTree = (): ReactNode => <Component data={demoData} />;
