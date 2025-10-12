import React, { FC, memo, useMemo } from 'react';
import { useListStore } from 'controllers/network';
import { MultiSelect } from 'react-multi-select-component';
import isEqual from 'lodash.isequal';
import { callParentVoid } from 'utils';
import { useSettings } from 'hooks/useSettings';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';
import { useShallow } from 'zustand/react/shallow';

const MultiSelectStyled = styled(MultiSelect)(({ theme }) => ({
    marginLeft: 'auto',
    '--rmsc-h': '24px!important',
    fontSize: '10px',
    '--rmsc-p': '4px',
    width: '160px',
    '& .item-renderer': {
        alignItems: 'center!important',
        lineHeight: '10px'
    },
    '--rmsc-bg': theme.mainBg,
    '--rmsc-main': theme.mainFont,
    '--rmsc-border': theme.borderColor,
    '--rmsc-selected': theme.oddRowBg,
    '--rmsc-hover': theme.icon.hover
}));

export const MimetypeSelect: FC = memo(() => {
    const language = useSettings((state) => state.settings.language);
    const mimeTypes = useListStore((state) => state.mimeTypes, isEqual);
    const sortedMimeTypes = Array.from(mimeTypes).sort();
    const hiddenMimeTypesArray = useSettings(
        useShallow((state) => state.settings.hiddenMimeTypes)
    );
    const hiddenMimeTypes = new Set(hiddenMimeTypesArray);
    const selectedTypes = sortedMimeTypes
        .filter((type) => !hiddenMimeTypes.has(type))
        .map((i) => ({ label: i, value: i }));
    const options = sortedMimeTypes.map((i) => ({ label: i, value: i }));

    const overrideStrings = useMemo(
        () => ({
            allItemsAreSelected: i18n.t('allSelected'),
            clearSearch: i18n.t('clearSearch'),
            clearSelected: i18n.t('clearSelected'),
            noOptions: i18n.t('noOptions'),
            search: i18n.t('search'),
            selectAll: i18n.t('selectAll'),
            selectAllFiltered: i18n.t('selectAllFiltered'),
            selectSomeItems: i18n.t('selectSomeItems')
        }),
        [language]
    );

    const handleOnChange = (
        selectedOptions: { label: string; value: string }[]
    ) => {
        const selectedMimeTypes = new Set(
            selectedOptions.map((option) => option.value)
        );
        const newHiddenMimeTypes = sortedMimeTypes.filter(
            (mimeType) => !selectedMimeTypes.has(mimeType)
        );
        useSettings
            .getState()
            .patchSettings({ hiddenMimeTypes: newHiddenMimeTypes });
        callParentVoid('analytics.mimeFilterChange');
    };
    return (
        <MultiSelectStyled
            options={options}
            value={selectedTypes}
            labelledBy='Mimetype'
            onChange={handleOnChange}
            overrideStrings={overrideStrings}
        />
    );
});

MimetypeSelect.displayName = 'MimetypeSelect';
