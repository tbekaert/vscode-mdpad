<img src="images/icon.png" alt="mdpad icon" width="128" />

# mdpad

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/tbekaert.mdpad?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=tbekaert.mdpad)
[![Open VSX](https://img.shields.io/open-vsx/v/tbekaert/mdpad?label=Open%20VSX)](https://open-vsx.org/extension/tbekaert/mdpad)

A lightweight markdown notepad inside VS Code. Type markdown and see it styled live — syntax stays visible but dimmed, content is formatted as you write.

<img src="images/demo.gif" alt="mdpad demo" width="363" />

## Quick Start

1. Install mdpad from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=tbekaert.mdpad) or [Open VSX](https://open-vsx.org/extension/tbekaert/mdpad)
2. Open the **Explorer sidebar** — mdpad appears as a panel
3. Start typing markdown

That's it. Your notes persist across restarts, per workspace. Toggle to **Global** scope for notes that follow you across all workspaces.

## Features

### Workspace & Global notes

Notes default to workspace scope — tied to the current project. Click the scope toggle in the title bar to switch to global notes, accessible from any workspace. The page picker lists notes from both scopes. Optionally sync global notes across devices via VS Code Settings Sync (opt-in, disabled by default).

### Muted-syntax editing

Markdown characters (`#`, `**`, `*`, `` ` ``, `~~`, `==`) stay visible but dimmed. Content is styled live — headings are large, bold is bold, code is monospace, highlights are highlighted.

### Frontmatter

Type `---` at the top of a note to create a YAML frontmatter block. Keys are muted, values stay readable. The closing `---` is auto-inserted.

Use `title:` to set a custom page title that overrides the auto-derived one:

```yaml
---
title: My Custom Title
---
```

### Multiple pages

Create, switch, and delete note pages from the toolbar dropdown. Page titles are derived from the frontmatter `title:` field, or the first heading, or the first line of content.

### Lists

- Bullet and numbered list markers are styled with muted syntax
- **Tab / Shift+Tab** to indent and outdent list items
- Unordered lists automatically cycle markers by depth: `-` → `*` → `+`
- Ordered lists renumber automatically when indenting or outdenting

### Code blocks

Fenced code blocks get syntax highlighting for 19 languages including JavaScript, TypeScript, Python, JSON, HTML, CSS, SQL, Rust, Go, Java, C/C++, and more. Typing ` ``` ` auto-inserts the closing fence.

### Section folding

Collapse H2 and H3 sections and frontmatter blocks (enable via `mdpad.folding` setting). Click the chevron at the right end of a foldable line to fold/unfold. Only sections with content can be folded.

### Keyboard shortcuts

| Action        | Mac           | Windows/Linux  |
| ------------- | ------------- | -------------- |
| Bold          | `Cmd+B`       | `Ctrl+B`       |
| Italic        | `Cmd+I`       | `Ctrl+I`       |
| Strikethrough | `Cmd+D`       | `Ctrl+D`       |
| Inline code   | `Cmd+K`       | `Ctrl+K`       |
| Highlight     | `Cmd+E`       | `Ctrl+E`       |
| Heading cycle | `Cmd+H`       | `Ctrl+H`       |
| Find          | `Cmd+F`       | `Ctrl+F`       |
| Search pages  | `Cmd+Shift+F` | `Ctrl+Shift+F` |
| Indent list   | `Tab`         | `Tab`          |
| Outdent list  | `Shift+Tab`   | `Shift+Tab`    |
| Move line up  | `Alt+↑`       | `Alt+↑`        |
| Move line down | `Alt+↓`      | `Alt+↓`        |
| Copy line up  | `Shift+Alt+↑` | `Shift+Alt+↑`  |
| Copy line down | `Shift+Alt+↓` | `Shift+Alt+↓` |

All formatting shortcuts are also available as `mdpad: …` commands in the VS Code command palette and can be rebound from **Keyboard Shortcuts** (they are scoped to `when: mdpad.focused`, so they only fire when the mdpad editor has focus).

### Settings

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `mdpad.fontFamily` | `"inherit"` | Font family. `"inherit"` uses the VS Code theme font. |
| `mdpad.lineHeight` | `1.6` | Line height in the editor. |
| `mdpad.lineWrapping` | `true` | Wrap long lines. |
| `mdpad.folding` | `false` | Enable section folding for H2, H3, and frontmatter. |
| `mdpad.listIndentSize` | `2` | Spaces per list indent level. |
| `mdpad.lineNumbers` | `false` | Show line numbers in the gutter. |
| `mdpad.syncGlobalNotes` | `false` | Sync global notes across devices via Settings Sync. Opt-in — once synced, data cannot be removed from the remote. |

### Export

Run **mdpad: Export Current Page** to save the active note as a `.md` file.

### Interactive elements

- **Checkboxes** — click `[ ]` or `[x]` to toggle task list items
- **Links** — `Cmd+click` (Mac) or `Ctrl+click` (Windows/Linux) to open URLs or file paths in the editor
- **Paste-as-link** — select text and paste a URL or file path to auto-wrap as `[text](url)`
- **Tables** — columns align automatically as you type

### Search

- **Find in note** (`Cmd/Ctrl+F`) — search within the current page
- **Search across pages** (`Cmd/Ctrl+Shift+F`) — search content across all pages in both scopes

### Floating panel

Run the command **mdpad: Open as Panel** to detach mdpad from the sidebar and use it as a standalone editor panel. Dock it anywhere in your VS Code layout.

### GFM support

Headings, bold, italic, strikethrough, links, blockquotes, task lists, fenced code blocks, tables, and horizontal rules.

### Theme-aware

Adapts to any VS Code color theme — dark, light, or high contrast.

## Known Limitations

### Uniform line heights

All lines in the editor share the same height. Headings are distinguished by bold weight, not font size. Inline code and code blocks use a monospace font but at the same size as body text.

This is a deliberate constraint: CodeMirror's vertical cursor navigation (arrow keys) uses pixel-based calculations that break when lines have different heights (from varying font sizes, padding, or margins). The issue becomes noticeable when scrolled — the cursor can jump multiple lines or land in the wrong position.

### Code block fence editing

Clicking on a fenced code block delimiter (` ``` `) may snap the cursor inside the code block rather than onto the fence line itself. This is a CodeMirror behavior related to how nested language parsers handle the boundary between the fence and the code content. You can still edit fences by placing the cursor with arrow keys.

## Contributing

Contributions welcome! Clone the repo and press `F5` to launch the extension in a development host. Use `.github/test-content.md` for manual QA — paste it into mdpad to verify all features. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

```bash
git clone https://github.com/tbekaert/vscode-mdpad.git
cd vscode-mdpad
pnpm install
```

## License

GPL-3.0-or-later
