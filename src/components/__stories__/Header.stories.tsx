import React from 'react';
import { Header as Component } from '../Header';

export default {
    title: 'Header',
    component: Component
};
const action = (i: string) => {
    return () => console.log('i', i);
};
export const Header: React.FC = () => (
    <Component
        searchValue=''
        caseSensitive={false}
        onSearchChange={action('onSearchChange')}
        onHideUnrelatedChange={action('onHideUnrelatedChange')}
        onCaseSensitiveChange={action('onCaseSensitiveChange')}
    />
);
