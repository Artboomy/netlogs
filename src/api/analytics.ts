import secrets from '../secrets.json';
import { isExtension } from 'utils';

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';
// File taken from https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/tutorial.google-analytics/scripts/google-analytics.js
// Get via https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
const MEASUREMENT_ID = secrets.measurement_id;
const API_SECRET = secrets.api_secret;
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;

// Duration of inactivity after which a new session is created
const SESSION_EXPIRATION_IN_MIN = 30;

type Params = {
    session_id?: string;
    engagement_time_msec?: number;
    [key: string]: unknown;
};
class Analytics {
    debug = false;
    noSend = false;

    constructor(debug = false, noSend = false) {
        this.debug = debug;
        this.noSend = noSend;
        this.checkNewUser();
    }

    async checkNewUser() {
        try {
            const { firstTimeShown } =
                await chrome.storage.local.get('firstTimeShown');
            if (!firstTimeShown) {
                await chrome.storage.local.set({ firstTimeShown: true });
                this.fireEvent('customFirstInstall');
            }
        } catch (_e) {
            // pass
        }
    }

    // Returns the client id, or creates a new one if one doesn't exist.
    // Stores client id in local storage to keep the same client id as long as
    // the extension is installed.
    async getOrCreateClientId() {
        let { clientId } = await chrome.storage.local.get('clientId');

        // Validate format: must be <number>.<number>
        const isValidFormat = clientId && /^\d+\.\d+$/.test(clientId);

        if (!clientId || !isValidFormat) {
            // Generate a unique client ID in GA4 format: <number>.<number>
            // First part: random number (10 digits)
            // Second part: timestamp in seconds
            const randomNum =
                Math.floor(Math.random() * 9000000000) + 1000000000;
            const timestamp = Math.floor(Date.now() / 1000);
            clientId = `${randomNum}.${timestamp}`;
            await chrome.storage.local.set({ clientId });
        }
        return clientId;
    }

    // Returns the current session id, or creates a new one if one doesn't exist or
    // the previous one has expired.
    async getOrCreateSessionId() {
        // Use storage.session because it is only in memory
        let { sessionData } = await chrome.storage.session.get('sessionData');
        const currentTimeInMs = Date.now();
        // Check if session exists and is still valid
        if (sessionData && sessionData.timestamp) {
            // Calculate how long ago the session was last updated
            const durationInMin =
                (currentTimeInMs - sessionData.timestamp) / 60000;
            // Check if last update lays past the session expiration threshold
            if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
                // Clear old session id to start a new session
                sessionData = null;
            } else {
                // Update timestamp to keep session alive
                sessionData.timestamp = currentTimeInMs;
                await chrome.storage.session.set({ sessionData });
            }
        }
        if (!sessionData) {
            // Create and store a new session
            sessionData = {
                session_id: currentTimeInMs.toString(),
                timestamp: currentTimeInMs.toString()
            };
            await chrome.storage.session.set({ sessionData });
        }
        return sessionData.session_id;
    }

    // Fires an event with optional params. Event names must only include letters and underscores.
    async fireEvent(name: string, params: Params = {}) {
        if (this.noSend) {
            return;
        }
        // Configure session id and engagement time if not present, for more details see:
        // https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
        if (!params.session_id) {
            params.session_id = await this.getOrCreateSessionId();
        }
        if (!params.engagement_time_msec) {
            params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
        }

        // In debug mode, add debug_mode flag for DebugView
        if (this.debug) {
            params.debug_mode = true;
        }

        const payload = {
            client_id: await this.getOrCreateClientId(),
            events: [
                {
                    name,
                    params
                }
            ]
        };

        try {
            // In debug mode: first validate, then send to real endpoint
            if (this.debug) {
                // 1. Validate with debug endpoint
                const debugPayload = {
                    ...payload,
                    validation_behavior: 'ENFORCE_RECOMMENDATIONS'
                };
                const debugResponse = await fetch(
                    `${GA_DEBUG_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
                    {
                        method: 'POST',
                        body: JSON.stringify(debugPayload)
                    }
                );
                const validationResult = await debugResponse.text();
                console.log('[GA4 Debug] Validation result:', validationResult);

                // 2. Send to real endpoint (so it shows in DebugView with debug_mode flag)
                await fetch(
                    `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
                    {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    }
                );
                console.log(
                    '[GA4 Debug] Event sent to production endpoint',
                    payload
                );
            } else {
                // Production mode: just send to real endpoint
                await fetch(
                    `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
                    {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    }
                );
            }
        } catch (e) {
            console.error(
                'Google Analytics request failed with an exception',
                e
            );
        }
    }

    // Fire a page view event.
    async firePageViewEvent(
        pageTitle: string,
        pageLocation: string,
        additionalParams: Params = {}
    ) {
        return this.fireEvent('page_view', {
            page_title: pageTitle,
            page_location: pageLocation,
            ...additionalParams
        });
    }

    // Fire an error event.
    async fireErrorEvent(
        error: { message: string; stack: unknown },
        additionalParams: Params = {}
    ) {
        if (this.noSend) {
            return;
        }
        // Note: 'error' is a reserved event name and cannot be used
        // see https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#reserved_names
        return this.fireEvent('extension_error', {
            error: JSON.stringify(error),
            ...additionalParams
        });
    }
}

export default new Analytics(
    false,
    import.meta.env.MODE === 'development' || !isExtension()
); //process.env.NODE_ENV === 'development');
