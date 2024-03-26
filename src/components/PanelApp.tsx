import React, { FC } from 'react';
import { SettingsContainer } from './SettingsContainer';
import { PanelMain } from './PanelMain';
import { ThemeContainer } from '../ThemeContainer';

export const PanelApp: FC = () => {
    return (
        <SettingsContainer>
            <ThemeContainer>
                <PanelMain />
            </ThemeContainer>
        </SettingsContainer>
    );
};
