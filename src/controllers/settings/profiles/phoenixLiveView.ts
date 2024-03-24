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
} as const;
export const phoenixLiveViewProfile: IProfileWebSocket = {
    functions: {
        getName(payload): string {
            if (!payload) {
                return 'Event';
            }
            const parsed: PhoenixLiveViewParams = JSON.parse(payload);
            return `${parsed[INDEX.caller]}.${parsed[INDEX.event]}`;
        },
        getTag(_request, name?: string): string {
            if (name === 'phoenix.heartbeat') {
                return 'LV♥';
            }
            return 'LV';
        },
        getParams(payload: string): Record<string, unknown> {
            if (!payload) {
                return {};
            }
            return JSON.parse(payload)[INDEX.payload];
        },
        getMeta(i) {
            return i.meta || null;
        },
        isError(request): boolean {
            if (!request.result) return false;
            return (
                request.isError ||
                JSON.parse(request.result)[INDEX.payload].status === 'error'
            );
        },
        shouldShow(): boolean {
            return true;
        },
        getResult(payload: string): Record<string, unknown> | unknown {
            if (!payload) return {};
            const parsed: PhoenixLiveViewResult = JSON.parse(payload);
            return parsed[INDEX.payload].response;
        }
    },
    isMatch(request) {
        const payloadStr = request.params || request.result;
        if (!payloadStr || !isSerializedObject(payloadStr)) {
            return false;
        }
        try {
            const payload = JSON.parse(payloadStr);
            const isLengthMatch = payload.length === 5;
            const isArgTypeMatch =
                payload[INDEX.caller].includes('phoenix') ||
                /^lv:phx-/.test(payload[INDEX.caller]);
            return isLengthMatch && isArgTypeMatch;
        } catch (e) {
            return false;
        }
    }
};
