import { insertSorted, subscribeParent } from '../utils';
import { useListStore } from './network';
import ContentOnlyItem from '../models/ContentOnlyItem';
import TransactionItem from '../models/TransactionItem';
import WebSocketItem from '../models/WebSocketItem';

function isWebsocketItem(cfg: unknown) {
    return (
        cfg &&
        typeof cfg === 'object' &&
        '__type' in cfg &&
        cfg.__type === 'websocket'
    );
}

function isContentOnlyItem(cfg: unknown) {
    return cfg && typeof cfg === 'object' && 'content' in cfg;
}

class EventsController {
    subscribe() {
        subscribeParent('newItem', (data) => {
            const { list, isDynamic } = useListStore.getState();
            try {
                const cfg = JSON.parse(data);
                let Constructor:
                    | typeof TransactionItem
                    | typeof ContentOnlyItem
                    | typeof WebSocketItem = TransactionItem;
                if (isWebsocketItem(cfg)) {
                    Constructor = WebSocketItem;
                } else if (isContentOnlyItem(cfg)) {
                    Constructor = ContentOnlyItem;
                }
                const item = new Constructor(cfg);
                if (isDynamic) {
                    useListStore.setState({
                        list: insertSorted(item, list)
                    });
                }
            } catch (e) {
                console.warn('Bad data: "', data, '"', e);
            }
        });
    }
}

const instance = new EventsController();

export default instance;
