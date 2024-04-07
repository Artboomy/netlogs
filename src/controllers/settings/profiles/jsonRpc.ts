import { IProfile } from '../types';
import { defaultProfile } from './default';
import { NetworkRequest } from 'models/types';

type RpcResult = {
    jsonrpc: string;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
        [key: string]: unknown;
    };
    id: unknown;
};

function isRpcResult(obj: unknown): obj is RpcResult {
    return Boolean(obj && typeof obj === 'object' && 'jsonrpc' in obj);
}

export const jsonRpcProfile: IProfile = {
    functions: {
        getName(request: NetworkRequest): string {
            const params = defaultProfile.functions.getParams(request);
            return params.method ? String(params.method) : 'Unknown method';
        },
        getTag(): string {
            return 'RPC';
        },
        getParams(request: NetworkRequest): Record<string, unknown> {
            const obj = defaultProfile.functions.getParams(request);
            return obj.params && typeof obj.params === 'object'
                ? (obj.params as Record<string, unknown>)
                : obj;
        },
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
                Object.prototype.hasOwnProperty.call(result, 'error');
            return Boolean(errorByResult || errorByCode);
        },
        shouldShow(_request: NetworkRequest): boolean {
            return true;
        },
        getResult(
            request: NetworkRequest,
            content: string | undefined
        ): Record<string, unknown> | unknown {
            const wrapper = defaultProfile.functions.getResult(
                request,
                content
            );
            let returnValue = wrapper;
            if (isRpcResult(wrapper)) {
                const result = wrapper.result;
                const error = wrapper.error;
                returnValue = result || error;
            }
            return returnValue;
        }
    }
};

const standardMatch = (obj: Record<string, unknown> | unknown): boolean => {
    return Boolean(obj && typeof obj === 'object' && 'jsonrpc' in obj);
};

const weakMatch = (obj: Record<string, unknown> | unknown): boolean => {
    return Boolean(
        obj &&
            typeof obj === 'object' &&
            'id' in obj &&
            'method' in obj &&
            'params' in obj
    );
};

export function isJsonRpc(
    params: Record<string, unknown>,
    result: unknown
): boolean {
    const byParams = standardMatch(params) || weakMatch(params);
    const byResult = standardMatch(result);
    return Boolean(byParams || byResult);
}
