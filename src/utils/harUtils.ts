import { Har } from 'har-format';
import runtime from '../api/runtime';
import { useListStore } from 'controllers/network';
import { useSettings } from 'hooks/useSettings';

export function getFileName(): string {
    const now = new Date();
    return now.toISOString().replace(/:/g, '-') + '.netlogs.zip';
}

export const getHarData = (): Har => {
    const { version, name } = runtime.getManifest();
    const { list } = useListStore.getState();
    const { hiddenMimeTypes } = useSettings.getState().settings;

    const entries = list
        .filter((i) => {
            if (!i.shouldShow()) {
                return false;
            }

            const mimeType = i.toJSON().response?.content.mimeType;

            // Always include application/json regardless of filter
            if (mimeType === 'application/json') {
                return true;
            }

            // Filter out hidden mimetypes
            return !hiddenMimeTypes.includes(mimeType);
        })
        .map((item) => item.toJSON());

    return {
        log: {
            version: '1.2',
            creator: {
                name,
                version
            },
            entries,
            comment: 'Format: http://www.softwareishard.com/blog/har-12-spec/'
        }
    };
};
