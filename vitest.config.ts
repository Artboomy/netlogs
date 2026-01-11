import { defineConfig } from 'vitest/config';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    cacheDir: '.cache',
    resolve: {
        alias: {
            'react-inspector': path.resolve(
                __dirname,
                'node_modules/react-inspector/dist/es/react-inspector.js'
            )
        }
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
        pool: 'threads',
        isolate: true,
        deps: {
            inline: [/^(?!.*vitest).*$/]
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'test_build/**',
                'stats/**',
                'img/**',
                '**/*.json',
                '**/*.config.{js,ts}',
                '**/*.d.ts',
                '**/types/**',
                'scripts/**',
                '.ladle/**',
                '**/controllers/settings/base.ts',
                'e2e/**',
                'src/utils.ts'
            ],
            thresholds: {
                lines: 50,
                functions: 35,
                branches: 50,
                statements: 50
            }
        }
    }
});
