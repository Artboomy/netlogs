import JSZip from 'jszip';
import { i18n } from 'translations/i18n';

export function isFileSupported(fileName: string): boolean {
    return Boolean(fileName.match(/\.json|\.har|\.zip/));
}

export async function parseFile<T>(file: File): Promise<T> {
    if (file.name.endsWith('zip')) {
        return readAsZip<T>(file);
    } else {
        return readAsText<T>(file);
    }
}

function readAsText<T>(file: File): Promise<T> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target?.result;
            if (contents && typeof contents === 'string') {
                try {
                    resolve(JSON.parse(contents));
                } catch (e) {
                    reject(e);
                }
            }
        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsText(file);
    });
}

function readAsZip<T>(file: File): Promise<T> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target?.result;
            if (contents) {
                JSZip.loadAsync(contents).then((zip) => {
                    const name = Object.keys(zip.files).find((name) =>
                        name.endsWith('har')
                    );
                    if (name) {
                        zip.files[name]
                            .async('text')
                            .then((text) => resolve(JSON.parse(text)), reject);
                    } else {
                        reject(i18n.t('archiveNoHar'));
                    }
                }, reject);
            }
        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsArrayBuffer(file);
    });
}
