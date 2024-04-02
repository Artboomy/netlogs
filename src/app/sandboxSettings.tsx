import React from 'react';
import ReactDOM from 'react-dom';
import { ListDemo } from 'components/list/Demo';
import { callParent } from 'utils';
import { SettingsContainer } from 'components/SettingsContainer';
import { ThemeProvider } from 'react-jss';
import { theme } from 'theme/light';

const SandboxListDemo = () => {
    return (
        <SettingsContainer>
            <ThemeProvider theme={theme}>
                <ListDemo />
            </ThemeProvider>
        </SettingsContainer>
    );
};

callParent('onIframeReady').then(() => {
    ReactDOM.render(<SandboxListDemo />, document.getElementById('root'));
});
