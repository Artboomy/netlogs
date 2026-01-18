import { download } from '../utils';
import { IframeEvent } from '../types';

/**
 * Shim layer for standalone mode to handle messages normally handled by parent frame
 * This intercepts postMessage calls and handles them locally
 */
class StandaloneShim {
    private handlers: Map<string, (data: string) => Promise<string> | string> = new Map();

    constructor() {
        this.registerHandler('download', this.handleDownload.bind(this));
        this.setupMessageInterceptor();
    }

    private registerHandler(
        type: string,
        handler: (data: string) => Promise<string> | string
    ) {
        this.handlers.set(type, handler);
    }

    private async handleDownload(data: string): Promise<string> {
        try {
            const { fileName, data: fileData } = JSON.parse(data);
            const blob = new Blob([fileData], { type: 'application/json' });
            download(fileName, blob);
            return 'success';
        } catch (e) {
            console.error('Download failed:', e);
            throw e;
        }
    }

    private setupMessageInterceptor() {
        window.addEventListener('message', async (event: MessageEvent) => {
            // Only handle messages from same window (standalone mode)
            if (event.source !== window) {
                return;
            }

            const data = event.data as IframeEvent;
            if (!data || !data.type || !data.id) {
                return;
            }

            const handler = this.handlers.get(data.type);
            if (handler) {
                try {
                    const result = await handler(data.data || '');
                    // Send response back to resolve the promise
                    window.postMessage(
                        {
                            id: data.id,
                            type: data.type,
                            data: result
                        } as IframeEvent,
                        '*'
                    );
                } catch (error) {
                    console.error(`Handler for ${data.type} failed:`, error);
                    // Send error response
                    window.postMessage(
                        {
                            id: data.id,
                            type: data.type,
                            data: 'error'
                        } as IframeEvent,
                        '*'
                    );
                }
            }
        });
    }
}

export default StandaloneShim;
