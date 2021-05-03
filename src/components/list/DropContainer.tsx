import React, { FC } from 'react';
import { useListStore } from '../../controllers/network';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { isFileSupported, parseFile } from '../../controllers/file';
import { Har } from 'har-format';
import NetworkItem from '../../models/NetworkItem';
import cn from 'classnames';
import { createUseStyles } from 'react-jss';
import ContentOnlyItem from '../../models/ContentOnlyItem';

const useStyles = createUseStyles({
    dropZone: {
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'auto'
    },
    dropZoneActive: {
        borderColor: '4px dashed #ccc'
    }
});

export const DropContainer: FC = ({ children }) => {
    const styles = useStyles();
    const { setList } = useListStore.getState();
    const [{ canDrop, isOver }, dropRef] = useDrop(
        () => ({
            accept: [NativeTypes.FILE],
            drop(item: { files: File[] }) {
                const file = item.files[0];
                if (isFileSupported(file.name)) {
                    parseFile<Har>(file).then(
                        (log) => {
                            if (log?.log?.entries) {
                                setList(
                                    [
                                        new ContentOnlyItem({
                                            timestamp: new Date().getTime(),
                                            tag: 'NET LOGS',
                                            content: `Opened file "${file.name}"`
                                        }),
                                        ...log.log.entries.map(
                                            (request) =>
                                                new NetworkItem({ request })
                                        )
                                    ],
                                    false
                                );
                            } else {
                                window.alert('Not valid har file');
                            }
                        },
                        (e) => window.alert(`Error parsing file ${e.message}`)
                    );
                } else {
                    window.alert('Only json files are supported');
                }
            },
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop()
            })
        }),
        []
    );
    return (
        <div
            ref={dropRef}
            className={cn({
                [styles.dropZone]: true,
                [styles.dropZoneActive]: canDrop && isOver
            })}>
            {children}
        </div>
    );
};
