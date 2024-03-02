import { NetworkRequest } from '../../models/types';
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

export type IProfileSerialized = Omit<IProfile, 'functions'> & {
    functions: Record<keyof IProfile['functions'], string>;
};

export interface ISettings {
    matcher: (request: NetworkRequest) => ProfileName;
    profiles: Record<ProfileName, IProfile>;
    nextjsIntegration: boolean;
    nuxtjsIntegraction: boolean;
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
