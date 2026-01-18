import type { PendingRequestData, PendingRequestKey } from '../types';

/**
 * Generate a unique request ID for tracking pending requests.
 * Uses random string generation for uniqueness.
 */
export function generateRequestId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Parse URL into components for HAR format.
 * Extracts query string parameters from the URL.
 */
export function parseUrl(url: string): {
    url: string;
    queryString: Array<{ name: string; value: string }>;
} {
    try {
        const urlObj = new URL(url, window.location.origin);
        const queryString: Array<{ name: string; value: string }> = [];

        urlObj.searchParams.forEach((value, name) => {
            queryString.push({ name, value });
        });

        return {
            url: urlObj.href,
            queryString
        };
    } catch {
        // If URL parsing fails, return as-is with empty query string
        return {
            url,
            queryString: []
        };
    }
}

/**
 * Parse headers from Headers object, array, or Record.
 * Normalizes various header formats to HAR-compatible array.
 */
export function parseHeaders(
    headers: Headers | HeadersInit | undefined
): Array<{ name: string; value: string }> {
    const result: Array<{ name: string; value: string }> = [];

    if (!headers) {
        return result;
    }

    try {
        if (headers instanceof Headers) {
            headers.forEach((value, name) => {
                result.push({ name, value });
            });
        } else if (Array.isArray(headers)) {
            // Array of [name, value] tuples
            for (const entry of headers) {
                if (Array.isArray(entry) && entry.length >= 2) {
                    result.push({ name: String(entry[0]), value: String(entry[1]) });
                }
            }
        } else if (typeof headers === 'object') {
            // Record<string, string>
            for (const [name, value] of Object.entries(headers)) {
                result.push({ name, value: String(value) });
            }
        }
    } catch {
        // If parsing fails, return empty array
    }

    return result;
}

/**
 * Extract body text from various body types.
 * Returns undefined if body cannot be converted to string.
 */
function extractBodyText(
    body: BodyInit | Document | XMLHttpRequestBodyInit | null | undefined
): string | undefined {
    if (!body) {
        return undefined;
    }

    try {
        if (typeof body === 'string') {
            return body;
        }
        if (body instanceof URLSearchParams) {
            return body.toString();
        }
        if (body instanceof FormData) {
            // FormData cannot be easily serialized, return placeholder
            return '[FormData]';
        }
        if (body instanceof Blob) {
            return '[Blob]';
        }
        if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
            return '[Binary]';
        }
        if (typeof Document !== 'undefined' && body instanceof Document) {
            return body.documentElement?.outerHTML || '[Document]';
        }
    } catch {
        // If extraction fails, return undefined
    }

    return undefined;
}

/**
 * Detect MIME type from body content or headers.
 */
function detectMimeType(
    body: string | undefined,
    headers: Array<{ name: string; value: string }>
): string {
    // Check Content-Type header first
    const contentTypeHeader = headers.find(
        (h) => h.name.toLowerCase() === 'content-type'
    );
    if (contentTypeHeader) {
        return contentTypeHeader.value.split(';')[0].trim();
    }

    // Try to detect from body content
    if (body) {
        if (body.startsWith('{') || body.startsWith('[')) {
            return 'application/json';
        }
        if (body.startsWith('<?xml') || body.startsWith('<')) {
            return 'application/xml';
        }
        if (body.includes('=') && body.includes('&')) {
            return 'application/x-www-form-urlencoded';
        }
    }

    return 'text/plain';
}

/**
 * Create PendingRequestData from fetch arguments.
 */
export function createPendingRequestFromFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): PendingRequestData {
    let url: string;
    let method = 'GET';
    let headers: Array<{ name: string; value: string }> = [];

    // Extract URL and method from input
    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof URL) {
        url = input.href;
    } else if (input instanceof Request) {
        url = input.url;
        method = input.method;
        headers = parseHeaders(input.headers);
    } else {
        url = String(input);
    }

    // Override with init options if provided
    if (init?.method) {
        method = init.method;
    }
    if (init?.headers) {
        headers = parseHeaders(init.headers);
    }

    const parsedUrl = parseUrl(url);
    const bodyText = extractBodyText(init?.body);

    return {
        id: generateRequestId(),
        timestamp: Date.now(),
        request: {
            method: method.toUpperCase(),
            url: parsedUrl.url,
            httpVersion: 'HTTP/1.1',
            headers,
            queryString: parsedUrl.queryString,
            postData: bodyText
                ? {
                      mimeType: detectMimeType(bodyText, headers),
                      text: bodyText
                  }
                : undefined
        }
    };
}

/**
 * Create PendingRequestData from XHR arguments.
 */
export function createPendingRequestFromXHR(
    method: string,
    url: string,
    headers: Array<{ name: string; value: string }>,
    body?: Document | XMLHttpRequestBodyInit | null
): PendingRequestData {
    const parsedUrl = parseUrl(url);
    const bodyText = extractBodyText(body);

    return {
        id: generateRequestId(),
        timestamp: Date.now(),
        request: {
            method: method.toUpperCase(),
            url: parsedUrl.url,
            httpVersion: 'HTTP/1.1',
            headers,
            queryString: parsedUrl.queryString,
            postData: bodyText
                ? {
                      mimeType: detectMimeType(bodyText, headers),
                      text: bodyText
                  }
                : undefined
        }
    };
}

/**
 * Simple hash function for body content.
 * Used for matching POST requests with same URL but different bodies.
 */
export function hashBody(body: string): string {
    let hash = 0;
    for (let i = 0; i < body.length; i++) {
        const char = body.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

/**
 * Generate matching key for request lookup.
 * Used for O(1) lookup when matching completed requests with pending ones.
 */
export function createRequestKey(
    method: string,
    url: string,
    body?: string
): PendingRequestKey {
    return {
        method: method.toUpperCase(),
        url,
        bodyHash: body ? hashBody(body) : undefined
    };
}

/**
 * Convert PendingRequestKey to string for Map key usage.
 */
export function requestKeyToString(key: PendingRequestKey): string {
    return `${key.method}:${key.url}:${key.bodyHash || ''}`;
}
