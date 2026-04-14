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

# Release
pnpm changeset         # Create a changeset for your changes
pnpm changeset status  # Show pending changesets
```

## Architecture

Two webpack bundles from one config file:

**Extension host** (`dist/extension.js`, target: node):
- `src/extension.ts` — Entry point. Dual storage (workspace + global), scope routing, Settings Sync for global notes, commands: `openPanel`, `newPage`, `deletePage`, `exportPage`, `switchToGlobal/Workspace`, `toggleBold/Italic/Strikethrough`.
- `src/SidebarProvider.ts` — `WebviewViewProvider` for the Explorer sidebar. Accepts storage getter for scope switching.
- `src/PanelProvider.ts` — Singleton `WebviewPanel` for floating editor. Exclusive mode: only sidebar or panel active at a time. Accepts storage getter for scope switching.
- `src/NotesStorage.ts` — CRUD over any `vscode.Memento` (workspaceState or globalState). Cached reads. Stores `{ pages: Page[], activeId }`.
- `src/deriveTitle.ts` — Page title derivation: frontmatter `title:` field > first heading > first non-empty line. Skips frontmatter block.
- `src/searchLines.ts` — Shared search helper for find-in-note and search-across-pages.
- `src/handleWebviewMessage.ts` — Shared message handler used by both providers.
- `src/getWebviewHtml.ts` — HTML generation with nonce-based CSP.

**Webview** (`dist/webview.js`, target: web):
- `src/webview/index.ts` — Entry point. Mounts editor, wires toolbar, handles postMessage.
- `src/webview/editor.ts` — CodeMirror 6 with GFM, VS Code theme, keyboard shortcuts, list indent/outdent, paste-as-link, auto-close fences. Uses a `codeMirrorSettings` Compartment for live setting reconfiguration (font, line height, heading scale, line numbers, line wrapping, folding).
- `src/webview/decorations.ts` — Muted-syntax ViewPlugin. Mark/line decorations only (no Decoration.replace). Click handlers for checkboxes and links. Regex-based passes for `==highlight==` and frontmatter.
- `src/webview/editor.ts` contains section folding: `foldService` for H2/H3/frontmatter fold ranges, `foldGutter` (with line numbers), inline `FoldWidget` (without line numbers).
- `src/webview/codeLanguages.ts` — Eagerly loaded language grammars for syntax highlighting in fenced code blocks.
- `src/webview/listPatterns.ts` — Shared regex patterns and constants for list handling.
- `src/webview/tableFormatter.ts` — Auto-aligns table columns on 500ms debounce after edits.
- `src/webview/toolbar.ts` — Page dropdown (titles derived from content), new/delete buttons.
- `src/webview/styles.css` — All styles: layout, VS Code CSS variable mapping, decoration classes.
- `src/webview/types.ts` — Shared types: Page, NotesState, MdpadSettings, message protocol.

## Key Design Decision

**Muted-syntax, not hidden-syntax.** All markdown characters stay visible but dimmed using `--vscode-editorLineNumber-foreground`. No widget replacements, no raw mode toggle. This avoids layout jumps, cursor issues, and CPU spikes from the original Typora-style approach.

## Settings Sync

Global notes can optionally be synced across devices via VS Code's Settings Sync (`context.globalState.setKeysForSync`). This is **opt-in** (disabled by default via `mdpad.syncGlobalNotes`) because there is no VS Code API to remove data from the sync remote once it's been synced. Disabling the setting stops future syncing but does not delete already-synced data.

## Naming

- Product name: always lowercase `mdpad` in user-facing text (UI, docs, commit messages). PascalCase `Mdpad` is only acceptable in TypeScript type names (e.g. `MdpadSettings`).
- Command prefix: `mdpad` (use `category: "mdpad"` in package.json, not a title prefix)
- View ID: `mdpad.notesView`
- Panel ID: `mdpad.panel`
- Storage key: `mdpad.notes`
- Context key: `mdpad.focused`

## Manual QA

`.github/test-content.md` contains a markdown document that exercises every mdpad feature. Copy-paste it into mdpad to manually verify formatting, shortcuts, lists, code blocks, links, search, folding, and frontmatter. **Keep this file updated** when adding new user-facing features.

## Conventions

- Biome for linting and formatting (via `@bekaert-dev/biome-config` shared preset).
- Changesets for versioning: **every commit that changes user-facing behavior or fixes a bug MUST include a changeset file.** Run `pnpm changeset` to create one before committing. The release workflow creates a version PR on push to main, and publishes to both marketplaces on merge.
- License: GPL-3.0-or-later.
