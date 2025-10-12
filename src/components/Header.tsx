import React, { FC, useRef, useState } from 'react';
import { toggleUnpack, useListStore } from 'controllers/network';
import runtime from '../api/runtime';
import { Har } from 'har-format';
import { callParent, isExtension, isMacOs } from 'utils';
import { IconButton, ICONS } from './IconButton';
import { useHotkey } from 'hooks/useHotkey';
import { MimetypeSelect } from './MimetypeSelect';
import { toast } from 'react-toastify';
import { DebuggerButton } from './DebuggerButton';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';

const Root = styled.header(({ theme }) => ({
    borderBottom: `1px solid ${theme.borderColor}`,
    zIndex: 2
}));

const Row = styled.div(({ theme }) => ({
    display: 'flex',
    backgroundColor: theme.panelColor,
    padding: '2px 4px',
    boxSizing: 'border-box',
    height: '30px',
    alignItems: 'center',
    gap: '8px'
}));

const HideUnrelated = styled.label({
    display: 'flex'
});

interface IProps {
    className?: string;
    searchValue: string;
    hideUnrelated?: boolean;
    onSearchChange: (value: string) => void;
    onHideUnrelatedChange: (value: boolean) => void;
    caseSensitive?: boolean;
    onCaseSensitiveChange: (value: boolean) => void;
}

function getFileName(): string {
    const now = new Date();
    return now.toISOString().replace(/:/g, '-');
}

const doExport = () => {
    const { version, name } = runtime.getManifest();
    const { list } = useListStore.getState();
    const entries = list
        .filter((i) => i.shouldShow())
        .map((item) => item.toJSON());
    const fileData: Har = {
        log: {
            version: '1.2',
            creator: {
                name,
                version
            },
            entries,
            comment: 'Format: http://www.softwareishard.com/blog/har-12-spec/'
        }
    };
    toast.promise(
        callParent(
            'download',
            JSON.stringify({
                fileName: getFileName(),
                data: JSON.stringify(fileData)
            })
        ),
        {
            pending: i18n.t('exporting'),
            success: i18n.t('exported'),
            error: i18n.t('exportError')
        }
    );
};

export const Header: FC<IProps> = ({
    className,
    searchValue,
    hideUnrelated,
    onSearchChange,
    onHideUnrelatedChange,
    caseSensitive,
    onCaseSensitiveChange
}) => {
    const clear = useListStore((state) => state.clear);
    const isPreserve = useListStore((state) => state.isPreserve);
    const isUnpack = useListStore((state) => state.isUnpack);
    const [secondRowVisible, setSecondRowVisible] = useState(false);
    const handlePreserveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        useListStore.setState({ isPreserve: e.target.checked });
    };
    const ref = useRef<HTMLInputElement>(null);
    useHotkey(
        'focusSearch',
        () => {
            ref.current?.focus();
        },
        [ref]
    );
    useHotkey('clearList', clear, []);
    useHotkey(
        'togglePreserveLog',
        () =>
            useListStore.setState((prevState) => ({
                ...prevState,
                isPreserve: !prevState.isPreserve
            })),
        []
    );
    const modifierKey = isMacOs() ? '⌘' : 'Ctrl';
    return (
        <Root className={className}>
            <Row>
                <IconButton
                    icon={ICONS.clear}
                    onClick={clear}
                    title={`${i18n.t('clear')} [${modifierKey}+L]`}
                />
                {isExtension() && <DebuggerButton />}
                <IconButton
                    icon={ICONS.panelDown}
                    onClick={() => setSecondRowVisible(!secondRowVisible)}
                    title={i18n.t('filterOptions')}
                    active={secondRowVisible}
                />
                <IconButton
                    title={i18n.t('caseSensitive')}
                    onClick={() => onCaseSensitiveChange(!caseSensitive)}
                    active={caseSensitive}>
                    Aa
                </IconButton>
                <IconButton
                    active={isUnpack}
                    icon={ICONS.brackets}
                    onClick={toggleUnpack}
                    title={i18n.t('decodeJSON')}
                />
                <input
                    ref={ref}
                    type='search'
                    placeholder={i18n.t('searchHelp')}
                    value={searchValue}
                    title={`${i18n.t('search')} [${modifierKey}+F]`}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchValue && (
                    <HideUnrelated>
                        <input
                            type='checkbox'
                            checked={hideUnrelated}
                            onChange={(e) =>
                                onHideUnrelatedChange(e.target.checked)
                            }
                            title={`${i18n.t('toggleUnrelated')} [${modifierKey}+U]`}
                        />
                        Hide unrelated
                    </HideUnrelated>
                )}
                <MimetypeSelect />
                {isExtension() && (
                    <IconButton
                        icon={ICONS.settings}
                        onClick={() => runtime.openOptionsPage()}
                        title={i18n.t('options')}
                    />
                )}
                <IconButton
                    icon={ICONS.export}
                    onClick={doExport}
                    title={i18n.t('export')}
                />
            </Row>
            {secondRowVisible && (
                <Row>
                    <label style={{ display: 'flex' }}>
                        <input
                            type='checkbox'
                            onChange={handlePreserveChange}
                            checked={isPreserve}
                        />
                        {i18n.t('preserveLog')}
                    </label>
                </Row>
            )}
        </Root>
    );
};
