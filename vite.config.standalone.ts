import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';
import { existsSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import istanbul from 'vite-plugin-istanbul';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const plugins: Plugin[] = [
    // for some reason cleanOutDir does not work properly
    // @see https://github.com/vitejs/vite/issues/10696
    {
        name: 'clean-standalone',
        enforce: 'pre',
        buildStart() {
            const currentDir = fileURLToPath(new URL('.', import.meta.url));
            const standalonePath = pathResolve(currentDir, 'standalone');
            console.log('standalonePath', currentDir, standalonePath);
            if (existsSync(standalonePath)) {
                rmSync(standalonePath, { recursive: true, force: true });
                console.log('✨ Cleaned standalone directory');
            }
        }
    } as Plugin,

    {
        name: 'generate-html',
        enforce: 'post',
        closeBundle() {
            const currentDir = fileURLToPath(new URL('.', import.meta.url));
            const templatePath = pathResolve(currentDir, 'templates/standalone.html');
            const htmlPath = pathResolve(currentDir, 'standalone/index.html');
            const htmlContent = readFileSync(templatePath, 'utf-8');
            writeFileSync(htmlPath, htmlContent);
            console.log('✨ Generated index.html for standalone build');
        }
    } as Plugin,

    tsconfigPaths(),
    react()
];

// Add Istanbul coverage instrumentation for E2E tests
if (process.env.NODE_ENV === 'test') {
    plugins.push(
        istanbul({
            include: 'src/*',
            exclude: [
                'node_modules',
                'test/',
                'e2e/',
                'dist/',
                '**/*.test.ts',
                '**/*.spec.ts'
            ],
            extension: ['.ts', '.tsx'],
            requireEnv: false,
            cypress: false,
            forceBuildInstrument: true
        })
    );
    console.log('✨ Istanbul coverage instrumentation enabled for E2E tests');
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
        outDir: '../standalone',
        emptyOutDir: true,
        minify: process.env.NODE_ENV === 'production',
        cssMinify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        rollupOptions: {
            input: {
                standalone: './src/app/standalone.tsx'
            },
            output: {
                inlineDynamicImports: false,
                format: 'es',
                dir: './standalone',
                entryFileNames: '[name].mjs',
                chunkFileNames: '[name]-[hash].mjs',
                assetFileNames: (info) => {
                    // Keep CSS files without hash for simple HTML reference
                    if (info.name?.endsWith('.css')) {
                        return '[name].[ext]';
                    }
                    return 'assets/[name]-[hash].[ext]';
                }
                // No manualChunks - let Vite optimize automatically
            }
        },
        assetsInlineLimit: 8192 // Inline assets smaller than 8KB
    },
    define: {
        'process.env': process.env
    }
});
