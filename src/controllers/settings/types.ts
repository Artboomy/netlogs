import { IItemWebSocketCfg, NetworkRequest } from '../../models/types';
import { PropTreeProps } from '../../components/PropTree';

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
        isError: (requst: NetworkRequest) => boolean;
        shouldShow: (request: NetworkRequest) => boolean;
    };
}

export interface IProfileWebSocket {
    functions: {
        getName: (payload: string) => string;
        getTag: (request: IItemWebSocketCfg, name?: string) => string;
        getParams: (payload: string) => Record<string, unknown>;
        getResult: (payload: string) => Record<string, unknown> | unknown;
        getMeta: (request: IItemWebSocketCfg) => PropTreeProps['data'] | null;
        isError: (requst: IItemWebSocketCfg) => boolean;
        shouldShow: (request: IItemWebSocketCfg) => boolean;
    };
    isMatch: (request: IItemWebSocketCfg) => boolean;
}

export type IProfileSerialized = Omit<IProfile, 'functions'> & {
    functions: Record<keyof IProfile['functions'], string>;
};

export interface ISettings {
    theme: 'light' | 'dark';
    matcher: (request: NetworkRequest) => ProfileName;
    sendAnalytics: boolean;
    profiles: Record<ProfileName, IProfile>;
    nextjsIntegration: boolean;
    nuxtjsIntegraction: boolean;
    debuggerEnabled: boolean;
    jsonRpcIntegration: boolean;
    graphqlIntegration: boolean;
    tagsToolbarVisible: boolean;
    hiddenTags: Record<string, string>;
    hiddenMimeTypes: string[];
}

export type ISettingsSerialized = Omit<ISettings, 'matcher' | 'profiles'> & {
    matcher: string;
    profiles: Record<keyof ISettings['profiles'], IProfileSerialized>;
};
