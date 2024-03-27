import React, { FC, useEffect, useState } from 'react';
import { IconButton, ICONS } from './IconButton';
import { callParentVoid, subscribeParent } from 'utils';
import { i18n } from 'translations/i18n';

export const DebuggerButton: FC = () => {
    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        callParentVoid(isActive ? 'debugger.detach' : 'debugger.attach');
        setIsActive(!isActive);
    };
    const icon = isActive ? ICONS.debugOn : ICONS.debugOff;
    const title = isActive
        ? i18n.t('websocketsActive')
        : i18n.t('clickToListen');

    useEffect(() => {
        callParentVoid('debugger.getStatus');
        subscribeParent('debugger.status', (status) => {
            setIsActive(status === 'true');
        });
    }, []);
    return <IconButton icon={icon} onClick={handleClick} title={title} />;
};
