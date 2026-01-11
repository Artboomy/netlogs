# AGENTS

## MCP Tools - Context7
Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

## Development Environment
- Node.js version manager: **fnm** (Fast Node Manager)
- Before running any commands, ensure the shell is initialized with `fnm env --shell bash` (per https://github.com/Schniz/fnm#shell-setup).
- To run commands call `fnm use 22.15.0 && <your command>`
- **IMPORTANT**: This is a Windows environment. NEVER use `2>nul` or `>nul` in bash commands - it creates a problematic file instead of redirecting to null device. Use `2>/dev/null` or omit error redirection entirely.

## Repo layout (quick map)
- `src/` main extension code (React + TypeScript)
- `src/app/`, `src/components/`, `src/controllers/`, `src/models/` core UI/state/data layers
- `src/content/` content scripts
- `src/theme/` and `src/ThemeContainer.tsx` theming
- `src/translations/` i18n strings
- `dist/manifest.json` is the extension manifest
- `dist/*.html` are the extension html files

## Build & checks
- Install deps: `yarn`
- Lint/typecheck: `yarn lint`
- Dev build: `yarn build`
- Prod build (includes lint): `yarn build:prod`
- Watch build: `yarn build:watch`

## Testing
- Run tests: `yarn test`
- Run tests with coverage: `yarn test:coverage`
- Run tests with UI: `yarn test:ui`
- Coverage thresholds: 95% statements/functions/lines, 88% branches
- **IMPORTANT**: Unit tests must live in `src/<dir>/<FileName>.test.ts` alongside the file under test (no combined omnibus test files).

## Git Hooks (Husky)
- Pre-commit hook automatically runs:
  - ESLint checks (`yarn run lint:ci`)
  - Tests with coverage (`yarn test:coverage --run`)
- Hooks are set up automatically when running `yarn install`
- To bypass hooks (not recommended): `git commit --no-verify`

## Packaging
- Create zip: `yarn package`

## Translation
- Use `scripts/translate-and-merge-key.cjs` to add translations.
- Be sure to translate with context: Chrome web extension for Frontend Software Developers.
- **After adding translations, always rebuild the extension with `yarn build`**

## Contributing
- Ask clarification questions
- **IMPORTANT: Always ask user permission before upgrading or downgrading dependencies** - Get explicit approval first
- Implement asked feature
- Run `yarn lint`
- Run `yarn build`
- Cleanup temp files

## Definition of done (end-of-task verification)
Before you report the task as complete (final message / PR-ready state), run:
- `yarn run lint`
- `yarn run test:coverage`
- `yarn run build`

If you cannot run commands in this environment, say so explicitly and provide the exact commands for me to run.
If the build or tests fail, fix them and re-run before marking the task done.
