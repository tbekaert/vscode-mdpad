---
'mdpad': patch
---

Fix `mdpad.focused` context key staying active when the sidebar was visible but not focused. Shortcuts like `Cmd+F` now correctly trigger VS Code's find in the text editor instead of mdpad's, without needing to close the sidebar first.
