import React, { FC, useMemo } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { useSettings } from 'hooks/useSettings';
import { theme as themeLight } from './theme/light';
import { theme as themeDark } from './theme/dark';
import { useTempSettings } from 'hooks/useTempSettings';

const themeMap = {
    light: themeLight,
    dark: themeDark
};
export const ThemeContainer: FC<{ children?: React.ReactNode }> = ({
    children
}) => {
    const themeKey = useSettings((state) => state.settings.theme);
    const isVerticalView = useTempSettings((state) => state.isVerticalView);
    const theme = useMemo(
        () => ({ ...themeMap[themeKey], isVerticalView }),
        [themeKey, isVerticalView]
    );
    return (
        <EmotionThemeProvider theme={theme}>{children}</EmotionThemeProvider>
    );
};
