import React, { FC, useEffect, useState } from 'react';
import settings from '../controllers/settings';
import ErrorBoundary from './ErrorBoundary';
import { useSettings } from 'hooks/useSettings';

export const SettingsContainer: FC<{ children?: React.ReactNode }> = ({
    children
}) => {
    const [ready, setIsReady] = useState(false);
    useEffect(function settingsInitEffect() {
        const { init, deinit } = useSettings.getState();
        init();
        settings.refresh().then(function setIsReadyTrue() {
            setIsReady(true);
        });
        return deinit;
    }, []);
    return <>{ready ? <ErrorBoundary>{children}</ErrorBoundary> : null}</>;
};
