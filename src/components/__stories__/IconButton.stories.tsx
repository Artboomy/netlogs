import React from 'react';
import { IconButton as Component, IconButtonProps, ICONS } from '../IconButton';
import { action } from '@storybook/addon-actions';

export default {
    title: 'Button',
    component: Component,
    args: {
        icon: ICONS.clear
    }
};

export const Button = (args: {
    icon: IconButtonProps['icon'];
}): JSX.Element => (
    <Component
        icon={args.icon}
        onClick={action('onClick')}
        title={'IconButton'}
    />
);
