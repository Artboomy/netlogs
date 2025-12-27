import JSZip from 'jszip';

export async function generateZip(
    fileName: string,
    data: string
): Promise<Blob> {
    const zip = new JSZip();
    zip.file(`${fileName}.har`, data);
    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });
}
