import { IItemWebSocketCfg, NetworkRequest } from 'models/types';
import { PropTreeProps } from 'components/PropTree';

export type ProfileName = string;

export interface IProfile {
    functions: {
        getName: (request: NetworkRequest) => string;
        getTag: (request: NetworkRequest) => string;
        getParams: (request: NetworkRequest) => Record<string, unknown>;
        getResult: (
            request: NetworkRequest,
            content: string | undefined
        ) => Record<string, unknown> | unknown;
        getMeta: (request: NetworkRequest) => PropTreeProps['data'] | null;
        isError: (request: NetworkRequest) => boolean;
        shouldShow: (request: NetworkRequest) => boolean;
    };
}

export interface IProfileWebSocket {
    functions: {
        getName: (payload: string) => string;
        getTag: (request: IItemWebSocketCfg, name?: string) => string;
        getParams: (payload: string) => Record<string, unknown>;
        getResult: (payload: string) => Record<string, unknown> | unknown;
        getMeta: (
            request: IItemWebSocketCfg
        ) => IItemWebSocketCfg['meta'] | null;
        isError: (request: IItemWebSocketCfg) => boolean;
        shouldShow: (request: IItemWebSocketCfg) => boolean;
    };
    isMatch: (request: IItemWebSocketCfg) => boolean;
}

// IProfileSerialized and ISettingsSerialized types have been removed
// They are no longer needed since we don't serialize/deserialize functions

export type Host = string;
export type FilteredMethod = string;

export interface ISettings {
    theme: 'light' | 'dark';
    language: 'en-US' | 'ru-RU' | string;
    newFeatureFlags: {
        language: boolean;
    };
    sendAnalytics: boolean;
    nextjsIntegration: boolean;
    nuxtjsIntegration: boolean;
    methodChecks: {
        [key: Host]: Record<FilteredMethod, boolean | undefined> | undefined;
    };
    debuggerEnabled: boolean;
    jsonRpcIntegration: boolean;
    graphqlIntegration: boolean;
    tagsToolbarVisible: boolean;
    methodsSidebarVisible: boolean;
    hiddenTags: Record<string, string>;
    hiddenMimeTypes: string[];
    jira: {
        baseUrl: string;
        apiToken: string;
        projectKey: string;
        issueType: string;
        apiVersion: string;
        template: string;
        attachScreenshot: boolean;
        openTicketInNewTab: boolean;
    };
    /** Enable intercepting fetch/XHR to show pending requests */
    interceptRequests: boolean;
}
