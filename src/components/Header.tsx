import React, { FC } from 'react';
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
        display: 'flex',
        backgroundColor: theme.panelColor,
        borderBottom: `1px solid ${theme.borderColor}`,
        padding: '2px 4px',
        zIndex: 2,
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
    const { clear, list } = useListStore();
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
    return (
        <header className={cn(styles.root, className)}>
            <IconButton icon={ICONS.clear} onClick={clear} title='Clear' />
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
        </header>
    );
};
