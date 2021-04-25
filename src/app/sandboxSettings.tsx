import React from 'react';
import ReactDOM from 'react-dom';
import { ListDemo } from '../components/list/Demo';
import { callParent } from '../utils';
import { SettingsContainer } from '../components/SettingsContainer';

const SandboxListDemo = () => {
    return (
        <SettingsContainer>
            <ListDemo />
        </SettingsContainer>
    );
};

callParent('onIframeReady').then(() => {
    ReactDOM.render(<SandboxListDemo />, document.getElementById('root'));
});
