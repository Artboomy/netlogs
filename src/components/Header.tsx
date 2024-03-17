import React, { FC, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cn from 'classnames';
import { useListStore } from '../controllers/network';
import runtime from '../api/runtime';
import { theme } from '../theme/light';
import { Har } from 'har-format';
import { callParent, isExtension } from '../utils';
import { IconButton, ICONS } from './IconButton';
import { useHotkey } from '../hooks/useHotkey';
import { MimetypeSelect } from './MimetypeSelect';
import { toast } from 'react-toastify';
import { DebuggerButton } from './DebuggerButton';

const useStyles = createUseStyles({
    root: {
        borderBottom: `1px solid ${theme.borderColor}`,
        zIndex: 2
    },
    row: {
        display: 'flex',
        backgroundColor: theme.panelColor,
        padding: '2px 4px',
        alignItems: 'center',
        gap: '8px'
    },
    optionsButton: {
        // marginLeft: 'auto'
    },
    hideUnrelated: {
        display: 'flex'
    }
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
            pending: 'Exporting...',
            success: 'Exported',
            error: 'Error exporting'
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
    const styles = useStyles();
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
    const handleToggleUnpack = () => {
        useListStore.setState((prev) => ({
            isUnpack: !prev.isUnpack
        }));
    };
    return (
        <header className={cn(styles.root, className)}>
            <div className={styles.row}>
                <IconButton
                    icon={ICONS.clear}
                    onClick={clear}
                    title='Clear [Ctrl+L]'
                />
                <DebuggerButton />
                <IconButton
                    icon={ICONS.panelDown}
                    onClick={() => setSecondRowVisible(!secondRowVisible)}
                    title='Filter options'
                    active={secondRowVisible}
                />
                <IconButton
                    title='Case sensitive'
                    onClick={() => onCaseSensitiveChange(!caseSensitive)}
                    active={caseSensitive}>
                    Aa
                </IconButton>
                <IconButton
                    active={isUnpack}
                    icon={ICONS.brackets}
                    onClick={handleToggleUnpack}
                    title='Unpack JSON from strings'
                />
                <input
                    ref={ref}
                    type='search'
                    placeholder='Search in params/result'
                    value={searchValue}
                    title='Search [Ctrl+F]'
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchValue && (
                    <label className={styles.hideUnrelated}>
                        <input
                            type='checkbox'
                            checked={hideUnrelated}
                            onChange={(e) =>
                                onHideUnrelatedChange(e.target.checked)
                            }
                            title='Toggle unrelated[Ctrl+U]'
                        />
                        Hide unrelated
                    </label>
                )}
                <MimetypeSelect />
                {isExtension() && (
                    <IconButton
                        className={styles.optionsButton}
                        icon={ICONS.settings}
                        onClick={() => runtime.openOptionsPage()}
                        title='Options'
                    />
                )}
                <IconButton
                    className={cn({ [styles.optionsButton]: !isExtension() })}
                    icon={ICONS.export}
                    onClick={doExport}
                    title='Export'
                />
            </div>
            {secondRowVisible && (
                <div className={styles.row}>
                    <label>
                        <input
                            type='checkbox'
                            onChange={handlePreserveChange}
                            checked={isPreserve}
                        />
                        Preserve log
                    </label>
                </div>
            )}
        </header>
    );
};
