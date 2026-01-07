import { Har } from 'har-format';
import runtime from '../api/runtime';
import { useListStore } from 'controllers/network';

export function getFileName(): string {
    const now = new Date();
    return now.toISOString().replace(/:/g, '-');
}

export const getHarData = (): Har => {
    const { version, name } = runtime.getManifest();
    const { list } = useListStore.getState();
    const entries = list
        .filter((i) => i.shouldShow())
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
