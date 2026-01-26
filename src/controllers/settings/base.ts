import { ISettings } from './types';

export const defaultSettings: ISettings = {
    theme: 'light',
    language: 'en-US',
    newFeatureFlags: {
        language: false
    },
    nextjsIntegration: true,
    nuxtjsIntegration: true,
    methodChecks: {},
    debuggerEnabled: false,
    sendAnalytics: true,
    jsonRpcIntegration: true,
    graphqlIntegration: true,
    hiddenTags: {
        OPTIONS: 'OPTIONS'
    },
    hiddenMimeTypes: [],
    tagsToolbarVisible: true,
    methodsSidebarVisible: false,
    jira: {
        baseUrl: '',
        apiToken: '',
        projectKey: '',
        issueType: 'Task',
        apiVersion: '2',
        attachScreenshot: true,
        openTicketInNewTab: true,
        template: '',
        user: '',
        cachedFields: null
    }
};
