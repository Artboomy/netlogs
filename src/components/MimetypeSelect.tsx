import React, { FC, memo, useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useListStore } from '../controllers/network';
import { MultiSelect } from 'react-multi-select-component';
import isEqual from 'lodash.isequal';
import settings from '../controllers/settings';
import { callParentVoid } from '../utils';

const useStyles = createUseStyles({
    root: {
        marginLeft: 'auto',
        '--rmsc-h': '24px!important',
        fontSize: '10px',
        '--rmsc-p': '4px',
        width: '160px',
        '& .item-renderer': {
            alignItems: 'center!important',
            lineHeight: '10px'
        }
    }
});

const useHiddenMimeTypes = () => {
    const [hidden, setHidden] = useState(
        () => new Set(settings.get().hiddenMimeTypes)
    );

    const setHiddenToStore = useCallback(async (newArray) => {
        settings.set({ ...settings.get(), hiddenMimeTypes: newArray });
        setHidden(new Set(newArray));
    }, []);
    return [hidden, setHiddenToStore] as const;
};

export const MimetypeSelect: FC = memo(() => {
    const styles = useStyles();
    const mimeTypes = useListStore((state) => state.mimeTypes, isEqual);
    const sortedMimeTypes = Array.from(mimeTypes).sort();
    const [hiddenMimeTypes, setHiddenMimeTypes] = useHiddenMimeTypes();
    const selectedTypes = sortedMimeTypes
        .filter((type) => !hiddenMimeTypes.has(type))
        .map((i) => ({ label: i, value: i }));
    const options = sortedMimeTypes.map((i) => ({ label: i, value: i }));

    const handleOnChange = (
        selectedOptions: { label: string; value: string }[]
    ) => {
        const selectedMimeTypes = new Set(
            selectedOptions.map((option) => option.value)
        );
        const newHiddenMimeTypes = sortedMimeTypes.filter(
            (mimeType) => !selectedMimeTypes.has(mimeType)
        );
        setHiddenMimeTypes(newHiddenMimeTypes);
        callParentVoid('analytics.mimeFilterChange');
    };
    return (
        <MultiSelect
            className={styles.root}
            options={options}
            value={selectedTypes}
            labelledBy='Mimetype'
            onChange={handleOnChange}
        />
    );
});

MimetypeSelect.displayName = 'MimetypeSelect';
