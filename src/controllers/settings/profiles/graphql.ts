import { NetworkRequest } from '../../../models/types';
import { defaultProfile } from './default';
import { IProfile } from '../types';

const queryRegex = new RegExp(
    '(?<type>query|mutation)\\s?(?:\\s(?<name>[aA-zZ0-9]+?))?[({]'
);

export const graphqlProfile: IProfile = {
    functions: {
        getName(request: NetworkRequest): string {
            const params = defaultProfile.functions.getParams(request);
            let name = '';
            if (isGraphqlParams(params)) {
                name = params.operationName || '';
                if (!name) {
                    const match = params.query.match(queryRegex);
                    if (match) {
                        name = `${match.groups?.type || 'query'}::${
                            match.groups?.name || 'Unnamed'
                        }`;
                    }
                }
            }
            return name;
        },
        getTag(): string {
            return 'GQL';
        },
        getParams: defaultProfile.functions.getParams,
        getMeta: defaultProfile.functions.getMeta,
        isError(request: NetworkRequest): boolean {
            const errorByCode = defaultProfile.functions.isError(request);
            const result = defaultProfile.functions.getResult(
                request,
                request.response.content.text
            );
            const errorByResult =
                result &&
                typeof result === 'object' &&
                result.hasOwnProperty('errors');
            return Boolean(errorByResult || errorByCode);
        },
        shouldShow(_request: NetworkRequest): boolean {
            return true;
        },
        getResult: function (
            request: NetworkRequest,
            content: string | undefined
        ): Record<string, unknown> | unknown {
            const wrapper = defaultProfile.functions.getResult(
                request,
                content
            );
            let returnValue = wrapper;
            if (isGraphqlResult(wrapper)) {
                if (!wrapper.errors) {
                    if ('data' in wrapper) {
                        returnValue = wrapper.data;
                    }
                }
            }
            return returnValue;
        }
    }
};

// https://graphql.org/learn/serving-over-http/#post-request
type graphqlParams = {
    query: string;
    operationName?: string;
    variables?: Record<string, unknown>;
};

type graphqlResult = {
    data: unknown;
    errors?: unknown;
};

function isGraphqlParams(
    params: Record<string, unknown>
): params is graphqlParams {
    return Boolean(
        params &&
            params.query &&
            typeof params.query === 'string' &&
            params.query.match('query|mutation')
    );
}

function isGraphqlResult(
    result: Record<string, unknown> | unknown
): result is graphqlResult {
    return Boolean(
        result &&
            typeof result === 'object' &&
            ('data' in result || 'errors' in result)
    );
}

export function isGraphql(
    params: Record<string, unknown>,
    _result: unknown
): boolean {
    return isGraphqlParams(params);
}
