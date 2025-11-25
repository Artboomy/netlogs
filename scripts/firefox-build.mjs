import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const firefoxDir = path.resolve('dist-firefox');

async function prepareOutputDir() {
    try {
        await rm(firefoxDir, { recursive: true, force: true });
    } catch (_error) {
        // ignore
    }
    await mkdir(firefoxDir, { recursive: true });
}

async function copyDist() {
    await stat(distDir);
    await cp(distDir, firefoxDir, { recursive: true });
}

async function patchManifest() {
    const manifestPath = path.join(firefoxDir, 'manifest.json');
    const manifestRaw = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestRaw);

    delete manifest.minimum_chrome_version;
    if (manifest.background && manifest.background.type) {
        delete manifest.background.type;
    }

    manifest.browser_specific_settings = {
        gecko: {
            id: 'netlogs@artboomy',
            strict_min_version: '109.0'
        }
    };

    await writeFile(
        manifestPath,
        `${JSON.stringify(manifest, null, 4)}\n`,
        'utf8'
    );
}

async function main() {
    await prepareOutputDir();
    await copyDist();
    await patchManifest();
}

main().catch((error) => {
    console.error('Firefox build failed:', error);
    process.exit(1);
});
