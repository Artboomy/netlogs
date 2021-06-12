import { insertSorted, subscribeParent } from '../utils';
import { useListStore } from './network';
import ContentOnlyItem from '../models/ContentOnlyItem';
import TransactionItem from '../models/TransactionItem';

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
                    useListStore.setState({
                        list: insertSorted(item, list)
                    });
                }
            } catch (e) {
                console.warn('Bad data: "', data, '"');
            }
        });
    }
}

const instance = new EventsController();

export default instance;
