import React from 'react';
import { Header as Component } from '../Header';
import { action } from '@storybook/addon-actions';

export default {
    title: 'Header',
    component: Component
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
