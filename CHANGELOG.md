# mdpad

## 0.3.0

### Minor Changes

- 2dc84a5: Add keyboard shortcuts for page management (scoped to `when: mdpad.focused`):
  new page (`Cmd/Ctrl+N`), previous page (`Cmd/Ctrl+Shift+[`), next page
  (`Cmd/Ctrl+Shift+]`), and delete page (`Cmd/Ctrl+W`). The delete confirmation
  dialog now names the page being deleted and explains that the action is
  permanent.

## 0.2.0

### Minor Changes

- 78e04ad: Cmd/Ctrl+click on file path links opens the file in VS Code's editor, and pasting a URL or file path onto selected text auto-wraps it as a markdown link
- ae7d370: Add syntax highlighting in fenced code blocks for 19 languages and auto-close opening fences
- 40ebd80: Add export command to save notes as markdown files and Settings Sync support for global notes
- 90484b8: Add find in note (Cmd/Ctrl+F) and search across all pages (Cmd/Ctrl+Shift+F) via QuickPick with cursor navigation
- 9a4c4e0: Add frontmatter support: muted YAML keys with visible values, auto-close on typing --- at top of note, custom page title via title: field
- a4c886c: Add global notes accessible across all workspaces with a scope toggle button in the title bar
- 36e8173: Add heading toggle shortcut (Ctrl+Shift+H) to cycle lines through H1, H2, H3, and plain text
- 5add53a: Add highlight text decoration (==text==) with Ctrl+Shift+E shortcut
- ce2faaf: Add inline code shortcut (Ctrl+Shift+`) to wrap/unwrap selection with backticks
- 4bfdea0: Add list support: muted decorations for bullet and numbered list markers, Tab/Shift-Tab to indent/outdent list items with automatic marker cycling and ordered list renumbering
- 8bf4f1f: Add section folding for H2, H3 headings and frontmatter with gutter icons or inline fold widgets
- 88b3e5e: Add configurable settings: font family, line height, list indent size, line numbers, and line wrapping
- 2802a48: Unify formatting shortcuts to `Cmd/Ctrl+letter`. Strikethrough is now `Cmd/Ctrl+D`, inline code `Cmd/Ctrl+K`, highlight `Cmd/Ctrl+E`, cycle heading `Cmd/Ctrl+H`. Shortcuts are routed through the VS Code extension host (with `when: mdpad.focused`), so they work uniformly on macOS and Windows/Linux and are exposed as palette commands.

### Patch Changes

- 5dac78f: Fix a memory leak in the inline fold widgets plugin (the `click` listener on `view.dom` is now removed when folding is reconfigured or the editor is destroyed). Surface a VS Code error notification when opening a local link fails or when exporting a page fails, instead of silently swallowing the error. Extract a shared frontmatter-boundary helper used by both the decoration pass and the fold service, and hoist repeated regex patterns to module-level constants.
- f3ae4f3: Auto-focus the editor when the webview gains focus and after note operations (new, delete, switch)
- f540fe4: Refactor search commands to share line-searching and cursor-navigation logic
- 068d50f: Enable line wrapping to prevent horizontal scrolling in sidebar and panel
- 256e374: Swap add and delete button positions in the toolbar and add a confirmation dialog before deleting a page
- 6d9acee: Fix several editor issues:

  - Cursor jumping when scrolling through documents with mixed line heights. Headings now use only `font-weight` (no font-size change), and `mdpad.headingScale` setting is removed.
  - Ordered list markers (`1.`) now show muted styling at any nesting depth.
  - Pressing Enter on an ordered list item correctly continues numbering at any depth.
  - Tables embedded in larger pasted content are now auto-formatted (previously only formatted when cursor was inside the table).

- 4af9a63: Update README with lists, code blocks, paste-as-link, and file link features
- c71e206: Update extension icon and readme with new branding, demo gif, and marketplace links
- 2248fa6: Refresh the default welcome note with up-to-date features and a tips table covering all keyboard shortcuts

## 0.1.3

### Patch Changes

- 7295d8b: Run Open VSX and VS Code Marketplace publish jobs in parallel so one failure doesn't block the other

## 0.1.2

### Patch Changes

- 0bddd90: Fix release workflow: resolve .vsix filename instead of passing a literal glob to the publish action

## 0.1.1

### Patch Changes

- 4490a95: Fix release workflow: detect version bump instead of relying on changesets action output to trigger publishing

## 0.1.0

### Minor Changes

- 5120f76: Initial release — muted-syntax markdown editor with CodeMirror 6, multi-page notes, sidebar and floating panel views, table auto-alignment, and native VS Code title bar navigation.
