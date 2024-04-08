import React from 'react';
import { IconButton as Component, IconButtonProps, ICONS } from '../IconButton';

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

Button.args = {
    icon: ICONS.clear
};
