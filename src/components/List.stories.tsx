import { List as Component } from './List';
import React, { ReactNode } from 'react';
import { ListDemo } from './list/Demo';

export default {
    title: 'List',
    component: Component
};
export const List = (): ReactNode => <ListDemo />;
