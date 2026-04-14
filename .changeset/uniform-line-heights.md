---
"mdpad": patch
---

Fix several editor issues:

- Cursor jumping when scrolling through documents with mixed line heights. Headings now use only `font-weight` (no font-size change), and `mdpad.headingScale` setting is removed.
- Ordered list markers (`1.`) now show muted styling at any nesting depth.
- Pressing Enter on an ordered list item correctly continues numbering at any depth.
- Tables embedded in larger pasted content are now auto-formatted (previously only formatted when cursor was inside the table).
