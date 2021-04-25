import React from 'react';
import ReactDOM from 'react-dom';
import { Options } from '../components/Options';
import { SettingsContainer } from '../components/SettingsContainer';

ReactDOM.render(
    <SettingsContainer>
        <Options />
    </SettingsContainer>,
    document.getElementById('root')
);
