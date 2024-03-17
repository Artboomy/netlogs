// @link https://chromedevtools.github.io/devtools-protocol/1-3/Network/#event-webSocketFrameSent
export type TWebSocketFrameSent = {
    requestId: string;
    timestamp: number;
    // https://chromedevtools.github.io/devtools-protocol/1-3/Network/#type-WebSocketFrame
    response: {
        mask: boolean;
        // 1 for text, 0 for base64 encoded binary data
        opcode: 0 | 1;
        payloadData: string;
    };
};

// @link https://chromedevtools.github.io/devtools-protocol/1-3/Network/#event-webSocketFrameReceived
export type TWebSocketFrameReceived = {
    requestId: string;
    timestamp: number;
    // https://chromedevtools.github.io/devtools-protocol/1-3/Network/#type-WebSocketFrame
    response: {
        mask: boolean;
        // 1 for text, 0 for base64 encoded binary data
        opcode: 0 | 1;
        payloadData: string;
    };
};

// @link https://chromedevtools.github.io/devtools-protocol/1-3/Network/#event-webSocketFrameError
export type TWebSocketFrameError = {
    requestId: string;
    timestamp: number;
    errorMessage: string;
};

export function isWebSocketFrameSent(
    method: string,
    _data: unknown
): _data is TWebSocketFrameSent {
    return method === 'Network.webSocketFrameSent';
}

export function isWebSocketFrameReceived(
    method: string,
    _data: unknown
): _data is TWebSocketFrameReceived {
    return method === 'Network.webSocketFrameReceived';
}

export function isWebSocketFrameError(
    method: string,
    _data: unknown
): _data is TWebSocketFrameError {
    return method === 'Network.webSocketFrameError';
}
