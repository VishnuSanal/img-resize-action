# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A GitHub Action that rewrites Markdown images (`![alt](url)`) in issue/comment bodies into `<img>` tags with fixed `width`/`height`, so images render at a desired size. It triggers on comment/issue events and edits the comment in place via the GitHub API.

## Architecture

- `index.js` — the source of truth. Reads inputs (`github-token`, `width`, `height`), validates the event is `issue_comment`/`issues`, regex-replaces Markdown image syntax in the body, and updates it via the GitHub API. Branches on event type: `issue_comment` reads `payload.comment` and updates via `issues.updateComment` (by `comment_id`); `issues` reads `payload.issue` and updates via `issues.update` (by `issue_number`). Skips the API call when no replacement occurred (idempotent on already-converted bodies).
- `dist/index.js` — the **bundled** artifact that actually runs. `action.yml` points its `main` at `dist/index.js`, not `index.js`. This is built from `index.js` + `node_modules` using `@vercel/ncc`. **Editing `index.js` alone has no effect until you rebuild `dist/`** — see Build below.
- `action.yml` — Action metadata: input declarations and the Node 20 entrypoint (`dist/index.js`).
- `.github/workflows/main.yml` — Example/self-test workflow that consumes this action, pinned to a commit SHA.

## Build

There is no build script in `package.json`. To regenerate the bundle after changing `index.js`, run ncc directly:

```
npx ncc build index.js -o dist
```

Commit the updated `dist/` — it is checked in and is what GitHub executes (`node_modules/` is gitignored, so the bundle must be self-contained).

## Tests

No test suite exists; `npm test` is a placeholder that exits 1.

## Gotchas

- **Input defaults are declared in two places.** `action.yml` defaults `width`/`height` to `600`/`800`, and `index.js` falls back to the same `600`/`800` if the input is empty. Keep them in sync if you change one. The `action.yml` defaults win in practice since they're always passed.
