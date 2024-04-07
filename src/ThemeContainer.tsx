import React, { FC, useMemo } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { useSettings } from 'hooks/useSettings';
import { theme as themeLight } from './theme/light';
import { theme as themeDark } from './theme/dark';

const themeMap = {
    light: themeLight,
    dark: themeDark
};
export const ThemeContainer: FC = ({ children }) => {
    const [{ theme: themeKey }] = useSettings();
    const theme = useMemo(() => themeMap[themeKey], [themeKey]);
    return (
        <EmotionThemeProvider theme={theme}>{children}</EmotionThemeProvider>
    );
};
