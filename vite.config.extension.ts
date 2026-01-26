import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { PluginVisualizerOptions, visualizer } from 'rollup-plugin-visualizer';
import circleDependency from 'vite-plugin-circular-dependency';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';
import { existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const plugins: Plugin[] = [
    // for some reason cleanOutDir does not work properly
    // @see https://github.com/vitejs/vite/issues/10696
    {
        name: 'clean-dist-js',
        enforce: 'pre',
        buildStart() {
            const currentDir = fileURLToPath(new URL('.', import.meta.url));
            const distJsPath = pathResolve(currentDir, 'dist/js');
            console.log('distJsPath', currentDir, distJsPath);
            if (existsSync(distJsPath)) {
                rmSync(distJsPath, { recursive: true, force: true });
                console.log('✨ Cleaned dist/js directory');
            }
        }
    } as Plugin,

    {
        name: 'update-manifest-version',
        closeBundle() {
            // Only run in development mode
            if (process.env.NODE_ENV !== 'development') {
                return;
            }

            const currentDir = fileURLToPath(new URL('.', import.meta.url));
            const manifestPath = pathResolve(currentDir, 'dist/manifest.json');
            const runtimePath = pathResolve(currentDir, 'src/api/runtime.ts');
            const counterPath = pathResolve(currentDir, '.dev-build-counter');

            if (!existsSync(manifestPath)) {
                console.warn(
                    '⚠️  dist/manifest.json not found, skipping version update'
                );
                return;
            }

            try {
                const manifest = JSON.parse(
                    readFileSync(manifestPath, 'utf-8')
                );

                // Read and increment counter
                let counter = 1;
                if (existsSync(counterPath)) {
                    try {
                        counter =
                            parseInt(
                                readFileSync(counterPath, 'utf-8').trim(),
                                10
                            ) || 1;
                        counter++;
                    } catch {
                        counter = 1;
                    }
                }

                // Save incremented counter
                writeFileSync(counterPath, String(counter));

                // Strip existing fourth number if present (e.g., "2.10.0.123" -> "2.10.0")
                const parts = manifest.version.split('.');
                const baseVersion =
                    parts.length === 4
                        ? parts.slice(0, 3).join('.')
                        : manifest.version;
                const newVersion = `${baseVersion}.${counter}`;

                // Update manifest.json
                manifest.version = newVersion;
                writeFileSync(
                    manifestPath,
                    JSON.stringify(manifest, null, 4) + '\n'
                );

                // Update runtime.ts
                if (existsSync(runtimePath)) {
                    let runtimeContent = readFileSync(runtimePath, 'utf-8');
                    // Replace both version strings in runtime.ts
                    runtimeContent = runtimeContent.replace(
                        /version: '[^']+'/g,
                        `version: '${newVersion}'`
                    );
                    writeFileSync(runtimePath, runtimeContent);
                    console.log(
                        `🔢 Updated manifest and runtime versions to ${newVersion}`
                    );
                } else {
                    console.log(`🔢 Updated manifest version to ${newVersion}`);
                    console.warn('⚠️  src/api/runtime.ts not found');
                }
            } catch (error) {
                console.error('❌ Failed to update versions:', error);
            }
        }
    } as Plugin,

    circleDependency(),
    tsconfigPaths(),
    react()
];

if (process.env.ANALYZE) {
    plugins.push(
        visualizer({
            template: process.env
                .ANALYZE as PluginVisualizerOptions['template'],
            filename: `stats/${process.env.ANALYZE}.html`
        })
    );
}

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
export default defineConfig({
    legacy: {
        inconsistentCjsInterop: true // Fix for react-use default imports in Vite 8
    },
    plugins,
    resolve: {
        alias: {
            'react-inspector': pathResolve(
                __dirname,
                'node_modules/react-inspector/dist/es/react-inspector.js'
            ),
            tslib: 'tslib/tslib.es6.js',
            'react/jsx-dev-runtime.js': pathResolve(
                __dirname,
                'node_modules/react/jsx-dev-runtime.js'
            ),
            'react/jsx-runtime.js': pathResolve(
                __dirname,
                'node_modules/react/jsx-runtime.js'
            )
        }
    },
    root: 'src',
    build: {
        modulePreload: false,
        target: 'es2020',
        outDir: '../dist/js',
        emptyOutDir: true,
        minify: process.env.NODE_ENV === 'production',
        cssMinify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        rollupOptions: {
            input: {
                devtools: './src/app/devtools.ts',
                panel: './src/app/panel.ts',
                sandbox: './src/app/sandbox.tsx',
                options: './src/app/options.tsx',
                settings: './src/controllers/settings.ts',
                content: './src/content/content.ts',
                inject: './src/content/inject.ts',
                background: './src/content/background.ts'
            },
            output: {
                inlineDynamicImports: false,
                format: 'es',
                dir: './dist/js',
                entryFileNames: '[name].mjs',
                chunkFileNames: '[name].mjs',
                assetFileNames: (info) => {
                    if (info.name !== 'react-vendors.css') {
                        return 'assets/[name]-[hash].[ext]';
                    }
                    return '[name].[ext]';
                },
                manualChunks(id) {
                    // NOTE: pack all libs into one chunk so css packs into react-vendors.css
                    // only it is imported in the html
                    if (
                        id.includes('react') ||
                        id.includes('react-dom') ||
                        id.includes('react-jss') ||
                        id.includes('react-dnd') ||
                        id.includes('react-dnd-html5-backend') ||
                        id.includes('classnames') ||
                        id.includes('base16') ||
                        id.includes('rc-tooltip')
                    ) {
                        return 'react-vendors';
                    }
                    if (id.includes('jszip')) {
                        return 'jszip';
                    }
                    if (id.includes('lodash')) {
                        return 'lodash';
                    }
                    return null;
                }
            }
        },
        assetsInlineLimit: 8192 // Inline assets smaller than 8KB
    },
    define: {
        'process.env': process.env
    }
});
