import { IProfileWebSocket } from '../types';
import { isSerializedObject } from 'utils';
// @link https://github.com/phoenixframework/phoenix/blob/main/lib/phoenix/socket/message.ex

type PhJoinRef = string | null;
type PhRef = string;
// The string topic or topic:subtopic pair namespace, for example "messages", "messages:123"
type PhTopic = 'phoenix' | string;
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
    // The unique string ref when joining
    PhJoinRef,
    //  The unique string ref
    PhRef,
    // phoenix or `lv:phx-.*`
    PhTopic,
    // event name
    PhEventName,
    // payload
    PhPayload
];

type PhoenixLiveViewResult = [
    // The unique string ref when joining
    PhJoinRef,
    // The unique string ref
    PhRef,
    // phoenix or `lv:phx-.*`
    PhTopic,
    // event name
    PhReplyName,
    PhResultPayload
];
const INDEX = {
    joinRef: 0,
    ref: 1,
    topic: 2,
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
            return `${parsed[INDEX.topic]}.${parsed[INDEX.event]}`;
        },
        getTag(_request, name?: string): string {
            if (name === 'phoenix.heartbeat') {
                return 'LV ♥';
            }
            return 'LV';
        },
        getParams(payload: string): Record<string, unknown> {
            if (!payload) {
                return {};
            }
            return JSON.parse(payload)[INDEX.payload];
        },
        getMeta(request) {
            const parsedParams = request.params
                ? JSON.parse(request.params)
                : '';
            const parsedResponse = request.result
                ? JSON.parse(request.result)
                : '';
            const paramsItems = parsedParams
                ? Object.entries(INDEX).map(([key, value]) => ({
                      name: key,
                      value:
                          typeof parsedParams[value] === 'object'
                              ? JSON.stringify(parsedParams[value])
                              : parsedParams[value]
                  }))
                : [];
            const responseItems = parsedResponse
                ? Object.entries(INDEX).map(([key, value]) => ({
                      name: key,
                      value:
                          typeof parsedResponse[value] === 'object'
                              ? JSON.stringify(parsedResponse[value])
                              : parsedResponse[value]
                  }))
                : [];
            return {
                request: {
                    title: 'Request',
                    items: [
                        { name: 'RAW', value: request.params },
                        ...paramsItems
                    ]
                },
                response: {
                    title: 'Response',
                    items: [
                        { name: 'RAW', value: request.result },
                        ...responseItems
                    ]
                }
            };
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
            const data = parsed[INDEX.payload];
            if ('response' in data) {
                return data.response;
            }
            return data;
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
                payload[INDEX.topic].includes('phoenix') ||
                /^lv:phx-/.test(payload[INDEX.topic]);
            return isLengthMatch && isArgTypeMatch;
        } catch (_e) {
            return false;
        }
    }
};
