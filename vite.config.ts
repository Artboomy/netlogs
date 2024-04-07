import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import visualizer, { PluginVisualizerOptions } from 'rollup-plugin-visualizer';
import circleDependency from 'vite-plugin-circular-dependency';

const plugins = [circleDependency(), tsconfigPaths(), react()];
if (process.env.ANALYZE) {
    plugins.push(
        visualizer({
            template: process.env
                .ANALYZE as PluginVisualizerOptions['template'],
            filename: `stats-${process.env.ANALYZE}.html`
        })
    );
}

export default defineConfig({
    plugins,
    resolve: {
        alias: {
            // Define your path aliases if you have any
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
                    if (
                        id.includes('react') ||
                        id.includes('react-dom') ||
                        id.includes('react-jss') ||
                        id.includes('react-dnd') ||
                        id.includes('react-dnd-html5-backend') ||
                        id.includes('classnames') ||
                        id.includes('base16')
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
