import React, { FC, useCallback, useContext, useRef, useState } from 'react';
import { toggleUnpack, useListStore } from 'controllers/network';
import runtime from '../api/runtime';
import { Har } from 'har-format';
import { callParent, callParentVoid, isExtension, isMacOs } from 'utils';
import { IconButton, ICONS } from './IconButton';
import { useHotkey } from 'hooks/useHotkey';
import { MimetypeSelect } from './MimetypeSelect';
import { toast } from 'react-toastify';
import { DebuggerButton } from './DebuggerButton';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';
import { useTempSettings } from 'hooks/useTempSettings';
import { JiraTicketModal } from './JiraTicketModal';
import { ModalContext } from './modal/Context';
import { isFileSupported, parseFile } from 'controllers/file';
import NetworkItem from '../models/NetworkItem';
import ContentOnlyItem from '../models/ContentOnlyItem';
import TransactionItem from '../models/TransactionItem';
import WebSocketItem from '../models/WebSocketItem';
import { ItemType } from 'models/enums';

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
    gap: '6px'
}));

const HideUnrelated = styled.label({
    display: 'flex'
});

const JiraButton = styled.button(({ theme }) => ({
    backgroundColor: theme.name === 'light' ? '#0052CC' : '#172B4D',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '0 12px',
    height: '26px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
        backgroundColor: theme.name === 'light' ? '#0747A6' : '#0747A6'
    }
}));

interface IProps {
    className?: string;
    searchValue: string;
    hideUnrelated?: boolean;
    onSearchChange: (value: string) => void;
    onHideUnrelatedChange: (value: boolean) => void;
    caseSensitive?: boolean;
    onCaseSensitiveChange: (value: boolean) => void;
}

export function getFileName(): string {
    const now = new Date();
    return now.toISOString().replace(/:/g, '-');
}

export const getHarData = (): Har => {
    const { version, name } = runtime.getManifest();
    const { list } = useListStore.getState();
    const entries = list
        .filter((i) => i.shouldShow())
        .map((item) => item.toJSON());
    return {
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
};

const doExport = () => {
    const fileData = getHarData();
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

const handleFileUpload = async (file: File) => {
    const { setList } = useListStore.getState();

    if (!isFileSupported(file.name)) {
        toast.error(i18n.t<string>('onlyJSONSupported'));
        return;
    }

    let log: Har | null = null;
    const toastId = toast(i18n.t<string>('loadingFile'));

    try {
        log = await parseFile<Har>(file);
        toast.dismiss(toastId);
    } catch (_e) {
        toast.dismiss(toastId);
        toast.error(i18n.t<string>('errorParsingFile'));
        return;
    }

    if (!log?.log?.entries) {
        toast.error(i18n.t<string>('invalidHAR'));
        return;
    }

    try {
        setList(
            [
                new ContentOnlyItem({
                    timestamp: new Date().getTime(),
                    tag: 'NET LOGS',
                    content: i18n.t<string>('fileOpened', {
                        name: file.name
                    })
                }),
                ...log.log.entries.map((request) => {
                    let ItemConstructor;
                    switch (request.comment) {
                        case ItemType.ContentOnly:
                            ItemConstructor = ContentOnlyItem;
                            break;
                        case ItemType.Transaction:
                            ItemConstructor = TransactionItem;
                            break;
                        case ItemType.WebSocket:
                            ItemConstructor = WebSocketItem;
                            break;
                        default:
                            ItemConstructor = NetworkItem;
                    }
                    return ItemConstructor.fromJSON(request);
                })
            ],
            false
        );
        callParentVoid('analytics.fileOpen', String(log.log.entries.length));
    } catch (e) {
        console.log('Error occurred:', e);
        toast.error(i18n.t<string>('invalidHAR'));
    }
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
    const { setValue } = useContext(ModalContext);
    const handlePreserveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        useListStore.setState({ isPreserve: e.target.checked });
    };
    const isVerticalView = useTempSettings((state) => state.isVerticalView);

    const handleToggleForceVertical = useCallback(() => {
        useTempSettings.setState(({ isVerticalView }) => ({
            isVerticalView: !isVerticalView
        }));
    }, []);
    const ref = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
            // Reset the input so the same file can be selected again
            e.target.value = '';
        }
    };
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
                <IconButton
                    onClick={handleToggleForceVertical}
                    title={i18n.t('switchToVerticalMode')}
                    active={isVerticalView}
                    icon={ICONS.rotateView}
                />
                {isExtension() && (
                    <JiraButton
                        onClick={() => setValue(<JiraTicketModal />)}
                        title='Create Jira issue'>
                        Jira
                    </JiraButton>
                )}
                <input
                    ref={fileInputRef}
                    type='file'
                    accept='.har,.json,.zip'
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <IconButton
                    icon={ICONS.import}
                    onClick={handleImportClick}
                    title={i18n.t('import')}
                />
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
