# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`mdpad` is a VS Code extension for writing and managing markdown notes directly inside the editor. It is a fork of the abandoned `sidebar-markdown-notes` extension, rebuilt with upgrades. Notes persist across sessions via webview state. Supports GFM, checkbox toggling, edit/preview toggle, page navigation, and export.

## Commands

```bash
# Development
pnpm webpack          # Build (development mode)
pnpm webpack-dev      # Build + watch mode
pnpm compile          # TypeScript-only compile (output: out/)

# Production
pnpm vscode:prepublish  # Production webpack build (output: dist/)

# Quality
pnpm lint             # ESLint on src/**/*.ts
pnpm test             # Runs compile + lint + Mocha tests

# Publish
pnpm deploy           # vsce publish
```

## Architecture

The extension has two runtime contexts:

**Node.js context** (bundled by webpack into `dist/extension.js`):
- `src/extension.ts` — Entry point. Registers 5 commands (`togglePreview`, `previousPage`, `nextPage`, `resetData`, `exportPage`), creates a status bar item, and instantiates the webview provider.
- `src/webviewProvider.ts` — Implements `WebviewViewProvider`. Generates the sidebar HTML (with nonce-based CSP), handles bidirectional messaging with the webview, processes export and status bar messages, and listens to config changes.
- `src/config.ts` — Wraps VS Code workspace config. Exposes `leftMargin` boolean setting.

**Browser/webview context** (loaded as-is, not bundled):
- `media/main.js` — All client-side logic: state management (pages, current page, edit/render mode), markdown rendering via `marked`, HTML sanitization via `dompurify`, custom renderers for checkboxes/todos, debounced state persistence, and page navigation.
- `media/main.css`, `media/markdown.css`, `media/reset.css`, `media/vscode.css` — Styling.
- `media/lib/` — Vendored libraries: `marked.min.js`, `purify.min.js`, `lodash.min.js`.

## Build

- Webpack bundles only the Node.js extension code (`src/` → `dist/extension.js`).
- The `media/` folder (webview assets) is loaded at runtime, not bundled.
- `vscode` module is externalized in webpack config.
- TypeScript strict mode is enabled.

## Naming

- Extension ID / command prefix: `mdpad`
- View ID: `mdpad.webview`
- Config namespace: `mdpad.*`
- Provider class: `MdpadProvider`

## Conventions

- ESLint with Airbnb base + Prettier (120 char lines, 2-space indent).
- License: GPL-3.0-or-later.
- CI publishes to both VS Marketplace and Open VSX via GitHub Actions on push to main.
