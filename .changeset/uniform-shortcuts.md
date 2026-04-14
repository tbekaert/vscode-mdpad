---
"mdpad": minor
---

Unify formatting shortcuts to `Cmd/Ctrl+letter`. Strikethrough is now `Cmd/Ctrl+D`, inline code `Cmd/Ctrl+K`, highlight `Cmd/Ctrl+E`, cycle heading `Cmd/Ctrl+H`. Shortcuts are routed through the VS Code extension host (with `when: mdpad.focused`), so they work uniformly on macOS and Windows/Linux and are exposed as palette commands.
