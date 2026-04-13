# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`mdpad` is a VS Code extension for writing markdown notes directly inside the editor. It uses a muted-syntax approach: markdown characters stay visible but dimmed, while content is styled live (headings are large, bold is bold, etc.). No preview pane, no mode switching — just type and see.

Forked from the abandoned `sidebar-markdown-notes` extension, fully rewritten with CodeMirror 6.

## Commands

```bash
# Development
pnpm webpack          # Build both bundles (development mode)
pnpm webpack-dev      # Build + watch mode

# Quality
pnpm lint             # Biome check on src/
pnpm format           # Biome auto-fix on src/

# Test in VS Code
# Press F5 — launches extension host with the "watch" build task

# Publish
pnpm deploy           # vsce publish
```

## Architecture

Two webpack bundles from one config file:

**Extension host** (`dist/extension.js`, target: node):
- `src/extension.ts` — Entry point. Commands: `openPanel`, `newPage`, `deletePage`, `toggleBold/Italic/Strikethrough`.
- `src/SidebarProvider.ts` — `WebviewViewProvider` for the Explorer sidebar.
- `src/PanelProvider.ts` — Singleton `WebviewPanel` for floating editor. Exclusive mode: only sidebar or panel active at a time.
- `src/NotesStorage.ts` — CRUD over `workspaceState`. Cached reads. Stores `{ pages: Page[], activeId }`.
- `src/handleWebviewMessage.ts` — Shared message handler used by both providers.
- `src/getWebviewHtml.ts` — HTML generation with nonce-based CSP.

**Webview** (`dist/webview.js`, target: web):
- `src/webview/index.ts` — Entry point. Mounts editor, wires toolbar, handles postMessage.
- `src/webview/editor.ts` — CodeMirror 6 with GFM, VS Code theme, keyboard shortcuts.
- `src/webview/decorations.ts` — Muted-syntax ViewPlugin. Mark/line decorations only (no widgets, no Decoration.replace). Click handlers for checkboxes and links.
- `src/webview/tableFormatter.ts` — Auto-aligns table columns on 500ms debounce after edits.
- `src/webview/toolbar.ts` — Page dropdown (titles derived from content), new/delete buttons.
- `src/webview/styles.css` — All styles: layout, VS Code CSS variable mapping, decoration classes.
- `src/webview/types.ts` — Shared types: Page, NotesState, message protocol.

## Key Design Decision

**Muted-syntax, not hidden-syntax.** All markdown characters stay visible but dimmed using `--vscode-editorLineNumber-foreground`. No widget replacements, no raw mode toggle. This avoids layout jumps, cursor issues, and CPU spikes from the original Typora-style approach.

## Naming

- Command prefix: `mdpad`
- View ID: `mdpad.notesView`
- Panel ID: `mdpad.panel`
- Storage key: `mdpad.notes`
- Context key: `mdpad.focused`

## Conventions

- Biome for linting and formatting (via `@bekaert-dev/biome-config` shared preset).
- License: GPL-3.0-or-later.
