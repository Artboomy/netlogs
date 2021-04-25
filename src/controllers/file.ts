export function isFileSupported(fileName: string): boolean {
    return Boolean(fileName.match(/\.json|\.har/));
}

export function parseFile<T>(file: File): Promise<T> {
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
