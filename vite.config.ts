import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { PluginVisualizerOptions, visualizer } from 'rollup-plugin-visualizer';
import circleDependency from 'vite-plugin-circular-dependency';
import { fileURLToPath, resolve } from 'node:url';
import { existsSync, rmSync } from 'node:fs';

const plugins = [
    // for some reason cleanOutDir does not work properly
    // @see https://github.com/vitejs/vite/issues/10696
    {
        name: 'clean-dist-js',
        enforce: 'pre',
        buildStart() {
            // Get the correct directory path
            const currentDir = fileURLToPath(new URL('.', import.meta.url));
            const distJsPath = resolve(currentDir, 'dist/js');
            console.log('distJsPath', currentDir, distJsPath);
            if (existsSync(distJsPath)) {
                rmSync(distJsPath, { recursive: true, force: true });
                console.log('✨ Cleaned dist/js directory');
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
    plugins,
    resolve: {
        alias: {
            tslib: 'tslib/tslib.es6.js',
            'react/jsx-dev-runtime.js': resolve(
                __dirname,
                'node_modules/react/jsx-dev-runtime.js'
            ),
            'react/jsx-runtime.js': resolve(
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
                    // NOTE: pack all libs into one chunk so css packs into react-verndors.css
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
        assetsInlineLimit: 10 // Inline assets smaller than 4KB
    },
    css: {
        // Configuration for CSS
    },
    esbuild: {
        // If you were using esbuild-loader for specific loader options, you can specify esbuild options here.
    },
    define: {
        'process.env': process.env
    }
});

// NOTE: reference https://github.com/rollup/rollup/issues/2756
