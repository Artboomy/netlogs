export type Logs = {
    time: string;
    level: 'log' | 'info' | 'warn' | 'error';
    value: string;
}[];

type StorageEventName =
    | 'chrome.storage.local.get'
    | 'chrome.storage.local.set'
    | 'chrome.storage.local.clear'
    | 'chrome.storage.onChanged'
    | 'chrome.storage.onChanged.addListener';

type RuntimeEventName =
    | 'chrome.runtime.getManifest'
    | 'chrome.runtime.openOptionsPage';

type NetworkEventName =
    | 'chrome.devtools.network.onRequestFinished'
    | 'chrome.devtools.network.onRequestFinished.addListener'
    | 'chrome.devtools.network.onNavigated'
    | 'chrome.devtools.network.onNavigated.addListener';

type DevtoolsEventName = 'devtools.inspectedWindow.reload';

type CustomEventName =
    | 'newItem'
    | 'download'
    | 'searchOnPage'
    | 'setHost'
    | 'cachedNetworkRequest'
    | 'pendingRequest'
    | 'pendingRequestComplete'
    | 'jira.createIssue'
    | 'jira.getMetadata'
    | 'jira.testSettings'
    | 'chrome.permissions.request';

type TabEventName = 'chrome.tabs.create';

export type AnalyticsDurationEventName =
    | 'analytics.propTreeViewed'
    | 'analytics.methodsSidebarViewed';
type AnalyticsEventName =
    | 'analytics.init'
    | 'analytics.mimeFilterChange'
    | 'analytics.hotkey'
    | 'analytics.fileOpen'
    | 'analytics.error'
    | 'analytics.searchOnPage'
    | 'analytics.copyObject'
    | 'analytics.jiraTicketCreated'
    | AnalyticsDurationEventName;

type DebuggerEventName =
    | 'debugger.attach'
    | 'debugger.detach'
    | 'debugger.status'
    | 'debugger.getStatus'
    | 'debugger.evaluate';

export type EventName =
    | 'onIframeReady'
    | TabEventName
    | StorageEventName
    | RuntimeEventName
    | NetworkEventName
    | DevtoolsEventName
    | CustomEventName
    | AnalyticsEventName
    | DebuggerEventName;

export type IframeEvent = {
    type: EventName;
    data: string;
    id: string;
};

/**
 * Pending request sent from inject script (subset of HAR Entry).
 * Used to display requests in progress before response is received.
 */
export interface PendingRequestData {
    /** Unique ID for matching (generated in inject) */
    id: string;
    /** Start time in milliseconds */
    timestamp: number;
    /** Request data (subset of HAR Request) */
    request: {
        method: string;
        url: string;
        httpVersion: string;
        headers: Array<{ name: string; value: string }>;
        queryString: Array<{ name: string; value: string }>;
        postData?: {
            mimeType: string;
            text: string;
        };
    };
}

/**
 * Key for pending requests map (for O(1) matching).
 * Used to match completed requests with their pending counterparts.
 */
export interface PendingRequestKey {
    method: string;
    url: string;
    /** Hash of body for POST requests (for accurate matching) */
    bodyHash?: string;
}
