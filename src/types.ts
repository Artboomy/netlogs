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

type CustomEventName = 'newItem' | 'download' | 'searchOnPage';

type TabEventName = 'chrome.tabs.create';

type AnalyticsEventName =
    | 'analytics.init'
    | 'analytics.mimeFilterChange'
    | 'analytics.propTreeViewed'
    | 'analytics.hotkey'
    | 'analytics.fileOpen'
    | 'analytics.error'
    | 'analytics.searchOnPage';

type DebuggerEventName =
    | 'debugger.attach'
    | 'debugger.detach'
    | 'debugger.status'
    | 'debugger.getStatus';

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
