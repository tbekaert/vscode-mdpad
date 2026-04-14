---
"mdpad": patch
---

Fix a memory leak in the inline fold widgets plugin (the `click` listener on `view.dom` is now removed when folding is reconfigured or the editor is destroyed). Surface a VS Code error notification when opening a local link fails or when exporting a page fails, instead of silently swallowing the error. Extract a shared frontmatter-boundary helper used by both the decoration pass and the fold service, and hoist repeated regex patterns to module-level constants.
