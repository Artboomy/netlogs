import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    cacheDir: '.cache',
    test: {
        globals: true,
        environment: 'happy-dom',
        exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
        pool: 'threads',
        isolate: false,
        deps: {
            inline: [
                /^(?!.*vitest).*$/
            ]
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
                lines: 95,
                functions: 95,
                branches: 88,
                statements: 95
            }
        }
    }
});
