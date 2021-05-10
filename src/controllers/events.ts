import { subscribeParent } from '../utils';
import { useListStore } from './network';
import ContentOnlyItem from '../models/ContentOnlyItem';
import TransactionItem from '../models/TransactionItem';
import { ItemType } from '../models/types';

class EventsController {
    subscribe() {
        subscribeParent('newItem', (data) => {
            const { list, isDynamic } = useListStore.getState();
            try {
                const cfg = JSON.parse(data);
                const item =
                    'content' in cfg
                        ? new ContentOnlyItem(cfg)
                        : new TransactionItem(cfg);
                if (isDynamic) {
                    const idx = list.findIndex(
                        (i) => i.type === ItemType.ContentOnly
                    );
                    // TODO: this is done so next/nuxt data will go after navigation event, which is content-only
                    //  should be refactored on preserve log implementation
                    if (idx > -1) {
                        useListStore.setState({
                            list: [
                                ...list.slice(0, idx + 1),
                                item,
                                ...list.slice(idx + 1)
                            ]
                        });
                    } else {
                        useListStore.setState({
                            list: [item, ...list]
                        });
                    }
                }
            } catch (e) {
                console.warn('Bad data: "', data, '"');
            }
        });
    }
}

const instance = new EventsController();

export default instance;
