import React, { FC, useEffect, useState } from 'react';
import { IconButton, ICONS } from './IconButton';
import { callParentVoid, subscribeParent } from '../utils';

export const DebuggerButton: FC = () => {
    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        callParentVoid(isActive ? 'debugger.detach' : 'debugger.attach');
        setIsActive(!isActive);
    };
    const icon = isActive ? ICONS.debugOn : ICONS.debugOff;
    const title = isActive
        ? 'WebSockets are listened'
        : 'Click to listen WebSockets';

    useEffect(() => {
        callParentVoid('debugger.getStatus');
        subscribeParent('debugger.status', (status) => {
            setIsActive(status === 'true');
        });
    }, []);
    return <IconButton icon={icon} onClick={handleClick} title={title} />;
};
