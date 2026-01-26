import React, { FC } from 'react';
import { useSettings } from 'hooks/useSettings';
import { i18n, LANGUAGES } from 'translations/i18n';
import styled from '@emotion/styled';

const StyledSelect = styled.select(({ theme }) => ({
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '6px',
    marginRight: '4px',
    height: '24px',
    cursor: 'pointer',
    backgroundColor: theme.panelColor,
    color: theme.mainFont
}));

const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    useSettings.getState().patchSettings({ language: e.target.value });
    window.location.reload();
};

export const LanguageSelect: FC = () => {
    const language = useSettings((state) => state.settings.language);
    return (
        <StyledSelect
            value={language}
            onChange={handleChange}
            title={i18n.t('language')}>
            {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                    {name}
                </option>
            ))}
        </StyledSelect>
    );
};
