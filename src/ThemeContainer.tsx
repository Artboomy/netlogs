import React, { FC, useMemo } from 'react';
import { ThemeProvider } from 'react-jss';
import { useSettings } from './hooks/useSettings';
import { theme as themeLight } from './theme/light';
import { theme as themeDark } from './theme/dark';

const themeMap = {
    light: themeLight,
    dark: themeDark
};
export const ThemeContainer: FC = ({ children }) => {
    const [{ theme: themeKey }] = useSettings();
    const theme = useMemo(() => themeMap[themeKey], [themeKey]);
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
