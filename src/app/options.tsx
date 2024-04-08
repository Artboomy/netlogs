import React from 'react';
import { Options } from 'components/Options';
import { SettingsContainer } from 'components/SettingsContainer';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <SettingsContainer>
            <Options />
        </SettingsContainer>
    );
}
