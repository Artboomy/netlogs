# AGENTS

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

## Packaging
- Create zip: `yarn package`

## Translation
- Use `scripts/translate-and-merge-key.cjs` to add translations.
- Be sure to translate with context: Chrome web extension for Frontend Software Developers.

## Contributing
- Ask clarification questions
- Implement asked feature
- Run `yarn lint`
- Run `yarn build`
- Cleanup temp files

## Definition of done (end-of-task verification)
Before you report the task as complete (final message / PR-ready state), run:
- `yarn run lint`
- `yarn run build`

If you cannot run commands in this environment, say so explicitly and provide the exact commands for me to run.
If the build fails, fix it and re-run before marking the task done.
