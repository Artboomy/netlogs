import React, { FC, useCallback, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import ContentOnlyItem from 'models/ContentOnlyItem';
import NetworkItem from 'models/NetworkItem';
import { Block } from './Block';
import { Entry, Har } from 'har-format';
import { generateZip } from 'utils/generateZip';
import { download } from 'utils';
import runtime from 'api/runtime';

type JiraDebugEntry = {
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: Record<string, unknown>;
};

const TitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    h2 {
        margin: 0;
    }
`;

const Hint = styled.div`
    font-size: 12px;
    opacity: 0.75;
    margin-bottom: 12px;
`;

type DebugRequestDetails = {
    url?: unknown;
    method?: unknown;
    request?: {
        headers?: unknown;
        body?: unknown;
    };
    status?: unknown;
    statusText?: unknown;
    headers?: unknown;
    body?: unknown;
    durationMs?: unknown;
    error?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function toHeaders(value: unknown): Array<{ name: string; value: string }> {
    if (!isObject(value)) {
        return [];
    }
    return Object.entries(value).map(([name, headerValue]) => ({
        name,
        value: String(headerValue)
    }));
}

function toText(value: unknown): string {
    if (value === undefined) {
        return '';
    }
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function isWebRequestLog(entry: JiraDebugEntry): boolean {
    return (
        entry.message.startsWith('Jira API response:') ||
        entry.message.startsWith('Jira API error:')
    );
}

function toHarEntry(entry: JiraDebugEntry): Entry | null {
    const details = entry.details as DebugRequestDetails | undefined;
    if (!details || typeof details.url !== 'string') {
        return null;
    }

    const method = typeof details.method === 'string' ? details.method : 'GET';
    const durationMs =
        typeof details.durationMs === 'number' ? details.durationMs : 0;
    const status = typeof details.status === 'number' ? details.status : 0;
    const url = details.url;
    const requestBody = details.request?.body;
    const responseBody = details.body ?? details.error;

    const parsedUrl = new URL(url, 'https://jira-debug.invalid');
    return {
        startedDateTime: new Date(entry.timestamp).toISOString(),
        time: durationMs,
        request: {
            method,
            url,
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: toHeaders(details.request?.headers),
            queryString: Array.from(parsedUrl.searchParams.entries()).map(
                ([name, value]) => ({ name, value })
            ),
            postData:
                requestBody === undefined
                    ? undefined
                    : {
                          mimeType: 'application/json',
                          text: toText(requestBody)
                      },
            headersSize: -1,
            bodySize: -1
        },
        response: {
            status,
            statusText:
                typeof details.statusText === 'string'
                    ? details.statusText
                    : details.error
                      ? 'Fetch error'
                      : '',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: toHeaders(details.headers),
            content: {
                size: -1,
                mimeType: 'application/json',
                text: toText(responseBody)
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1
        },
        cache: {},
        timings: {
            send: 0,
            wait: durationMs,
            receive: 0
        },
        comment: entry.message
    };
}

function toNetworkItem(entry: JiraDebugEntry): NetworkItem | null {
    const request = toHarEntry(entry);
    return request ? new NetworkItem({ request }) : null;
}

function toContentOnlyItem(entry: JiraDebugEntry): ContentOnlyItem {
    return new ContentOnlyItem({
        timestamp: entry.timestamp,
        tag: `JIRA ${entry.level.toUpperCase()}`,
        content: {
            message: entry.message,
            ...(entry.details ? { details: entry.details } : {})
        }
    });
}

function toHar(entries: JiraDebugEntry[]): Har {
    const { version, name } = runtime.getManifest();
    return {
        log: {
            version: '1.2',
            creator: {
                name,
                version
            },
            entries: entries.map((entry) => {
                if (isWebRequestLog(entry)) {
                    const networkItem = toNetworkItem(entry);
                    if (networkItem) {
                        return networkItem.toJSON();
                    }
                }
                return toContentOnlyItem(entry).toJSON();
            }),
            comment: 'Format: http://www.softwareishard.com/blog/har-12-spec/'
        }
    };
}

function getFileName(): string {
    return `jira-debug-${new Date().toISOString().replace(/:/g, '-')}`;
}

export const JiraDebugLog: FC = () => {
    const [entries, setEntries] = useState<JiraDebugEntry[]>([]);

    useEffect(() => {
        const handleConnect = (port: chrome.runtime.Port) => {
            if (port.name !== 'jira-debug') {
                return;
            }

            const handleMessage = (message: {
                type?: string;
                sessionId?: string;
                entry?: JiraDebugEntry;
            }) => {
                if (message.type === 'jira.debugPing') {
                    port.postMessage({
                        type: 'jira.debugAck',
                        sessionId: message.sessionId
                    });
                    return;
                }
                if (message.type === 'jira.debugLog' && message.entry) {
                    const entry = message.entry;
                    setEntries((current) => [...current, entry]);
                }
            };

            const handleDisconnect = () => {
                port.onMessage.removeListener(handleMessage);
                port.onDisconnect.removeListener(handleDisconnect);
            };

            port.onMessage.addListener(handleMessage);
            port.onDisconnect.addListener(handleDisconnect);
        };

        chrome.runtime.onConnect.addListener(handleConnect);
        return () => chrome.runtime.onConnect.removeListener(handleConnect);
    }, []);

    const handleSave = useCallback(async () => {
        const fileName = getFileName();
        const blob = await generateZip(
            fileName,
            JSON.stringify(toHar(entries))
        );
        download(`${fileName}.har.zip`, blob);
    }, [entries]);

    return (
        <Block>
            <TitleRow>
                <h2>Jira debug log</h2>
                <button onClick={handleSave} disabled={!entries.length}>
                    Export HAR logs
                </button>
            </TitleRow>
            <Hint>
                Keep this options page open, then reproduce Jira issue creation.
                {entries.length === 0
                    ? ' No Jira debug logs collected yet.'
                    : ` ${entries.length} Jira debug log${entries.length === 1 ? '' : 's'} collected.`}
            </Hint>
        </Block>
    );
};
