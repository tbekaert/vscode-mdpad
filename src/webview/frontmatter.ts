import type { Text } from '@codemirror/state'

/**
 * Returns the line number of the closing `---` of a YAML frontmatter block,
 * or 0 when the document has no frontmatter.
 */
export const findFrontmatterEndLine = (doc: Text): number => {
  if (doc.lines < 3 || doc.line(1).text.trim() !== '---') return 0
  for (let i = 2; i <= doc.lines; i++) {
    if (doc.line(i).text.trim() === '---') return i
  }
  return 0
}
