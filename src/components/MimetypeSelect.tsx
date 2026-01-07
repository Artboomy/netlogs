import React, { FC, memo, useMemo } from 'react';
import { useListStore } from 'controllers/network';
import isEqual from 'lodash.isequal';
import { callParentVoid } from 'utils';
import { useSettings } from 'hooks/useSettings';
import { i18n } from 'translations/i18n';
import { useShallow } from 'zustand/react/shallow';
import { MultiSelectStyled } from 'components/MultiSelectStyled';

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

    const valueRenderer = (selected: typeof options) => {
        if (!selected.length) {
            return 'MIME';
        }
        return `${selected.length} MIME`;
    };

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
            valueRenderer={valueRenderer}
            value={selectedTypes}
            labelledBy='MIME'
            onChange={handleOnChange}
            overrideStrings={overrideStrings}
        />
    );
});

MimetypeSelect.displayName = 'MimetypeSelect';
