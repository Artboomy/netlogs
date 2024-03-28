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
import { ItemType } from '../../models/types';
import TransactionItem from '../../models/TransactionItem';
import { toast } from 'react-toastify';
import { callParentVoid } from '../../utils';
import WebSocketItem from '../../models/WebSocketItem';
import { i18n } from '../../translations/i18n';

const useStyles = createUseStyles({
    dropZone: {
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'auto',
        border: '4px solid transparent'
    },
    dropZoneActive: {
        border: '4px dashed #ccc'
    }
});

export const DropContainer: FC = ({ children }) => {
    const styles = useStyles();
    const { setList } = useListStore.getState();
    const [{ canDrop, isOver }, dropRef] = useDrop(
        () => ({
            accept: [NativeTypes.FILE],
            async drop(item: { files: File[] }) {
                const file = item.files[0];
                if (!isFileSupported(file.name)) {
                    toast.error(i18n.t('onlyJSONSupported'));
                }
                let log: Har | null = null;
                const toastId = toast(i18n.t('loadingFile'));
                try {
                    log = await parseFile<Har>(file);
                    toast.dismiss(toastId);
                } catch (e) {
                    toast.dismiss(toastId);
                    toast.error(i18n.t('errorParsingFile'));
                }
                if (!log) {
                    return;
                }
                if (!log?.log?.entries) {
                    toast.error(i18n.t('invalidHAR'));
                    return;
                }
                try {
                    setList(
                        [
                            new ContentOnlyItem({
                                timestamp: new Date().getTime(),
                                tag: 'NET LOGS',
                                content: i18n.t('fileOpened', {
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
                    callParentVoid(
                        'analytics.fileOpen',
                        String(log.log.entries.length)
                    );
                } catch (e) {
                    console.log('Error occurred:', e);
                    toast.error(i18n.t('invalidHAR'));
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
