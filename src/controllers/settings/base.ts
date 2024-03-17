import { ISettings } from './types';
import { NetworkRequest } from '../../models/types';

export const defaultSettings: ISettings = {
    matcher: (_request: NetworkRequest) => {
        return 'default';
    },
    profiles: {
        /*default: defaultProfile,
        jsonRpc: jsonRpcProfile*/
    },
    nextjsIntegration: true,
    nuxtjsIntegraction: true,
    debuggerEnabled: false,
    sendAnalytics: true,
    jsonRpcIntegration: true,
    graphqlIntegration: true,
    hiddenTags: {
        OPTIONS: 'OPTIONS'
    },
    hiddenMimeTypes: [],
    tagsToolbarVisible: true
};
