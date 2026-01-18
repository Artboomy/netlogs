import { describe, it, expect } from 'vitest';
import WebSocketItem from './WebSocketItem';
import { createSearchMarker } from 'utils';
import { createHarEntry } from './testUtils';

describe('WebSocketItem', () => {
    it('handles phoenix live view payloads', () => {
        const params = JSON.stringify([
            '1',
            '2',
            'phoenix',
            'event',
            { payload: { message: 'hello' } }
        ]);
        const result = JSON.stringify([
            '1',
            '2',
            'phoenix',
            'phx_reply',
            { status: 'ok', response: { reply: 'pong' } }
        ]);
        const item = new WebSocketItem({
            __type: 'websocket',
            timestamp: 0,
            params,
            result,
            isError: false
        });

        expect(item.getName()).toBe('phoenix.event');
        expect(item.getTag()).toBe('LV');
        expect(item.getParams()).toEqual({ payload: { message: 'hello' } });
        expect(item.getContent()).toEqual({ reply: 'pong' });
        expect(item.getMeta()).not.toBeNull();
    });

    it('handles non-phoenix payloads by subtype', () => {
        const sentItem = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'sent',
            timestamp: 0,
            params: JSON.stringify({ params: { value: 123 } }),
            result: 'raw-result',
            isError: false
        });

        expect(sentItem.getName()).toBe('WebSocket.sent');
        expect(sentItem.getTag()).toBe('WS');
        expect(sentItem.getParams()).toEqual({ value: 123 });
        expect(sentItem.getContent()).toEqual({});

        const receivedItem = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'received',
            timestamp: 0,
            params: '{"ignored":true}',
            result: JSON.stringify({ result: { answer: 42 } }),
            isError: false
        });

        expect(receivedItem.getName()).toBe('WebSocket.received');
        expect(receivedItem.getParams()).toEqual({});
        expect(receivedItem.getContent()).toEqual({ answer: 42 });

        const json = sentItem.toJSON();
        expect(json.request.method).toBe('WS');
        expect(json.response.statusText).toBe('ok');

        const restored = WebSocketItem.fromJSON(createHarEntry());
        expect(restored.getParams()).toEqual({ action: 'ping' });
        expect(restored.getContent()).toEqual({ status: 'ok' });
        expect(restored.isError()).toBe(false);
    });

    it('handles raw payloads and default naming', () => {
        const sentItem = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'sent',
            timestamp: 0,
            params: 'raw-params',
            result: 'raw-result',
            isError: true
        });

        expect(sentItem.getParams()).toEqual({ raw: 'raw-params' });
        expect(sentItem.getContent()).toEqual({});
        expect(sentItem.isError()).toBe(true);
        expect(sentItem.shouldShow({ filterValue: 'WebSocket' })).toBe(true);

        const receivedItem = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'received',
            timestamp: 0,
            params: '',
            result: 'raw-result',
            isError: false
        });

        expect(receivedItem.getContent()).toEqual({ raw: 'raw-result' });

        const defaultItem = new WebSocketItem({
            __type: 'websocket',
            timestamp: 0,
            params: '{}',
            result: '{}',
            isError: false
        });

        expect(defaultItem.getName()).toBe('Websocket');
    });

    it('matches search markers and serializes errors', () => {
        const item = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'sent',
            timestamp: 0,
            params: JSON.stringify({ needle: 'value' }),
            result: 'ignored',
            isError: true
        });
        const marker = createSearchMarker('needle');

        expect(item.shouldShow({ searchValue: 'needle', marker })).toBe(true);

        const json = item.toJSON();
        expect(json.response.statusText).toBe('error');
        expect(item.getDuration()).toBe(0);
    });

    it('keeps parsed payloads without collapsing keys', () => {
        const sentItem = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'sent',
            timestamp: 0,
            params: JSON.stringify({ foo: 'bar' }),
            result: '',
            isError: false
        });

        expect(sentItem.getParams()).toEqual({ foo: 'bar' });

        const receivedItem = new WebSocketItem({
            __type: 'websocket',
            __subtype: 'received',
            timestamp: 0,
            params: '',
            result: JSON.stringify({ foo: 'bar' }),
            isError: false
        });

        expect(receivedItem.getContent()).toEqual({ foo: 'bar' });
    });
});
