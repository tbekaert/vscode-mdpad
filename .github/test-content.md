---
title: mdpad Feature Test
tags: test
---

# Welcome to the Feature Test

This note tests every mdpad feature. Work through each section.

## Text Formatting

Here is **bold text**, *italic text*, ~~strikethrough~~, `inline code`, and ==highlighted text==.

Try the shortcuts: select a word and press Ctrl+B, Ctrl+I, Ctrl+Shift+X, Ctrl+Shift+`, Ctrl+Shift+E.

## Lists

### Unordered

- First item
- Second item
  * Nested with different marker
    + Deeply nested

### Ordered

1. Step one
2. Step two
  1. Sub-step A
  2. Sub-step B
    1. Deep sub-step
    2. Another deep one
  3. Sub-step C
3. Step three

### Tasks

- [x] Completed task
- [ ] Uncompleted task
  - [x] Nested completed
  - [ ] Nested uncompleted
    - [ ] Deeply nested task
- [ ] Click the brackets to toggle

Try Tab/Shift+Tab on any list item to indent/outdent.

## Code Blocks

```ts
const greet = (name: string): string => {
  // This should be syntax highlighted
  return `Hello, ${name}!`
}
```

```python
def fibonacci(n: int) -> list[int]:
    """Generate fibonacci sequence."""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result
```

## Links

- [External link](https://github.com) — Cmd/Ctrl+click to open in browser
- [File link](./README.md) — Cmd/Ctrl+click to open in editor
- Select this text and paste a URL to test paste-as-link

## Blockquote

> This is a blockquote.
> It can span multiple lines.

## Table

| Feature      | Status | Priority |
| ------------ | ------ | -------- |
| Bold         | Done   | High     |
| Highlight    | Done   | Medium   |
| Folding      | Done   | Low      |

## Horizontal Rule

---

## Search Test

This section contains the word banana for search testing. Try Cmd/Ctrl+F to find it in this note, or Cmd/Ctrl+Shift+F to search across all pages.

## Heading Cycle Test

Place your cursor on the line below and press Ctrl+Shift+H repeatedly:

This line will cycle through heading levels

## Empty Section Below

### This heading has no content — it should NOT be foldable
