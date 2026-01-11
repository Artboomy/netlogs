import { subscribeParent } from 'utils';
import { Host } from 'controllers/settings/types';

class HostController {
    host: Host = '' as Host;
    subscribe() {
        subscribeParent('setHost', (host) => {
            this.host = host as Host;
        });
    }
}

const instance = new HostController();

export default instance;
