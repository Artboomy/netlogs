import React from 'react';
import { IconButton as Component, IconButtonProps, ICONS } from '../IconButton';

export default {
    title: 'Button',
    component: Component,
    args: {
        icon: ICONS.clear
    }
};
const action = (i: string) => {
    return () => console.log('i', i);
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
