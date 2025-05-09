import React, { FC } from 'react';
import { useListStore } from 'controllers/network';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { isFileSupported, parseFile } from 'controllers/file';
import { Har } from 'har-format';
import NetworkItem from '../../models/NetworkItem';
import ContentOnlyItem from '../../models/ContentOnlyItem';
import TransactionItem from '../../models/TransactionItem';
import { toast } from 'react-toastify';
import { callParentVoid } from 'utils';
import WebSocketItem from '../../models/WebSocketItem';
import { i18n } from 'translations/i18n';
import largeIcons from 'icons/largeIcons.svg';
import { ICONS } from 'components/IconButton';
import styled from '@emotion/styled';
import { ItemType } from 'models/enums';

const DropZone = styled.div({
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'auto'
});

const Overlay = styled.div({
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '2em',
    backdropFilter: 'blur(2px)'
});

const Icon = styled.div(({ theme }) => ({
    backgroundColor: theme.icon.normal,
    width: '21px',
    height: '24px',
    scale: 3,
    transform: 'translateY(-4px)',
    WebkitMaskPosition: ICONS.drop as `${number}px ${number}px`,
    WebkitMaskImage: `url(js/${largeIcons})`
}));

export const DropContainer: FC<{ children?: React.ReactNode }> = ({
    children
}) => {
    const { setList } = useListStore.getState();
    const [{ canDrop, isOver }, dropRef] = useDrop(
        () => ({
            accept: [NativeTypes.FILE],
            async drop(item: { files: File[] }) {
                const file = item.files[0];
                if (!isFileSupported(file.name)) {
                    toast.error(i18n.t<string>('onlyJSONSupported'));
                }
                let log: Har | null = null;
                const toastId = toast(i18n.t<string>('loadingFile'));
                try {
                    log = await parseFile<Har>(file);
                    toast.dismiss(toastId);
                } catch (_e) {
                    toast.dismiss(toastId);
                    toast.error(i18n.t<string>('errorParsingFile'));
                }
                if (!log) {
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
                    callParentVoid(
                        'analytics.fileOpen',
                        String(log.log.entries.length)
                    );
                } catch (e) {
                    console.log('Error occurred:', e);
                    toast.error(i18n.t<string>('invalidHAR'));
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
        <DropZone ref={dropRef}>
            {children}
            {canDrop && isOver && (
                <Overlay>
                    <Icon />
                    {i18n.t<string>('drop')}
                </Overlay>
            )}
        </DropZone>
    );
};
