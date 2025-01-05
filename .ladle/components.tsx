import type { GlobalProvider } from '@ladle/react';
import { ThemeProvider } from '@emotion/react';
import { theme } from '../src/theme/light';
import React from 'react';
import { ModalContainer } from '../src/components/modal/Container';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { i18n } from '../src/translations/i18n';

i18n.locale = 'en-US';
export const Provider: GlobalProvider = ({
    children
    // globalState,
    // storyMeta
}) => (
    <>
        <ErrorBoundary>
            <ThemeProvider theme={theme}>
                <div id='modal'></div>
                <ModalContainer>{children}</ModalContainer>
            </ThemeProvider>
        </ErrorBoundary>
    </>
);
