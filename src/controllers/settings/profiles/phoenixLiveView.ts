import { IProfileWebSocket } from '../types';
import { isSerializedObject } from '../../../utils';

type PhCallerName = 'phoenix' | string;
type PhEventName = 'event' | string;
type PhReplyName = 'phx_reply' | string;
type PhPayload =
    | Record<string, never>
    | {
          type: string;
          event: string;
          value: Record<string, unknown>;
      };
type PhResultPayload =
    | Record<string, never>
    | {
          status: 'ok' | 'error' | string;
          response: { diff: Record<string, unknown> } | Record<string, unknown>;
      };
type PhoenixLiveViewParams = [
    // unknown field, either null or str(int)
    string | null,
    // unknown field, str(int)
    string,
    // phoenix or `lv:phx-.*`
    PhCallerName,
    // event name
    PhEventName,
    // payload
    PhPayload
];

type PhoenixLiveViewResult = [
    // unknown field, either null or str(int)
    string | null,
    // unknown field, str(int)
    string,
    // phoenix or `lv:phx-.*`
    PhCallerName,
    // event name
    PhReplyName,
    PhResultPayload
];
const INDEX = {
    caller: 2,
    event: 3,
    payload: 4
};
export const phoenixLiveViewProfile: IProfileWebSocket = {
    functions: {
        getName(payload): string {
            if (!payload) {
                return 'Event';
            }
            const parsed = JSON.parse(payload);
            return `${parsed[INDEX.caller]}.${parsed[INDEX.event]}`;
        },
        getTag(): string {
            return 'LV';
        },
        getParams(payload: string): Record<string, unknown> {
            if (!payload) {
                return {};
            }
            return JSON.parse(payload)[INDEX.payload];
        },
        getMeta(i) {
            return i.meta;
        },
        isError(request): boolean {
            return (
                request.isError ||
                JSON.parse(request.result)[INDEX.payload].status === 'error'
            );
        },
        shouldShow(): boolean {
            return true;
        },
        getResult(payload: string): Record<string, unknown> | unknown {
            return JSON.parse(payload)[INDEX.payload].response;
        }
    },
    isMatch(request) {
        if (!isSerializedObject(request.result)) {
            return false;
        }
        try {
            const result = JSON.parse(request.result);
            const isLengthMatch = result.length === 5;
            const isArgTypeMatch =
                result[INDEX.caller] === 'phoenix' ||
                /^lv:phx-/.test(result[INDEX.caller]);
            return isLengthMatch && isArgTypeMatch;
        } catch (e) {
            return false;
        }
    }
};
