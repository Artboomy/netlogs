import React from 'react';
import { Header as Component } from '../Header';

export default {
    title: 'Header',
    component: Component
};

export const Header: React.FC = () => (
    <Component searchValue='' onSearchChange={() => null} />
);
