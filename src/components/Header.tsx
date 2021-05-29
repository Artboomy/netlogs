import React, { FC, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cn from 'classnames';
import { useListStore } from '../controllers/network';
import runtime from '../api/runtime';
import { theme } from '../theme/light';
import { Har } from 'har-format';
import { callParentVoid } from '../utils';
import { IconButton, ICONS } from './IconButton';

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
    version: {
        fontStyle: 'italic'
    },
    optionsButton: {
        marginLeft: 'auto'
    }
});

interface IProps {
    className?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

function getFileName(): string {
    const now = new Date();
    return now.toISOString().replace(/:/g, '-');
}

export const Header: FC<IProps> = ({
    className,
    searchValue,
    onSearchChange
}) => {
    const styles = useStyles();
    const { version, name } = runtime.getManifest();
    const { clear, list, isPreserve, setPreserve } = useListStore();
    const [secondRowVisible, setSecondRowVisible] = useState(false);
    const handleExport = () => {
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
                comment:
                    'Format: http://www.softwareishard.com/blog/har-12-spec/'
            }
        };
        callParentVoid(
            'download',
            JSON.stringify({
                fileName: getFileName(),
                data: JSON.stringify(fileData)
            })
        );
    };
    const handlePreserveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreserve(e.target.checked);
    };
    return (
        <header className={cn(styles.root, className)}>
            <div className={styles.row}>
                <IconButton icon={ICONS.clear} onClick={clear} title='Clear' />
                <IconButton
                    icon={ICONS.panelDown}
                    onClick={() => setSecondRowVisible(!secondRowVisible)}
                    title='Filter options'
                    active={secondRowVisible}
                />
                <input
                    type='search'
                    placeholder='Search in params/result'
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <IconButton
                    className={styles.optionsButton}
                    icon={ICONS.settings}
                    onClick={() => runtime.openOptionsPage()}
                    title='Options'
                />
                <IconButton
                    icon={ICONS.export}
                    onClick={handleExport}
                    title='Export'
                />
                <div className={styles.version}>v.{version}</div>
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
