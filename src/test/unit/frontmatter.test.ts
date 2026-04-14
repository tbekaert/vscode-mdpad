import assert from 'node:assert'
import { Text } from '@codemirror/state'
import { describe, it } from 'mocha'
import { findFrontmatterEndLine } from '../../webview/frontmatter'

const doc = (content: string): Text => Text.of(content.split('\n'))

describe('findFrontmatterEndLine', () => {
  it('returns 0 when the document has no frontmatter', () => {
    assert.strictEqual(findFrontmatterEndLine(doc('# heading\ncontent')), 0)
  })

  it('returns 0 when the document is too short (< 3 lines)', () => {
    assert.strictEqual(findFrontmatterEndLine(doc('---\n---')), 0)
  })

  it('returns 0 when the first line is not exactly "---"', () => {
    assert.strictEqual(findFrontmatterEndLine(doc('--\nkey: v\n---\n')), 0)
    assert.strictEqual(findFrontmatterEndLine(doc('#---\nkey: v\n---\n')), 0)
  })

  it('returns 0 for an unterminated frontmatter', () => {
    assert.strictEqual(
      findFrontmatterEndLine(doc('---\ntitle: x\nbody without closer')),
      0,
    )
  })

  it('returns the closing-fence line number for a valid frontmatter', () => {
    assert.strictEqual(
      findFrontmatterEndLine(doc('---\ntitle: x\n---\nbody')),
      3,
    )
  })

  it('finds the first closing fence, not a later one', () => {
    assert.strictEqual(
      findFrontmatterEndLine(doc('---\nkey: v\n---\nbody\n---\nmore')),
      3,
    )
  })

  it('tolerates trailing whitespace on fence lines', () => {
    assert.strictEqual(
      findFrontmatterEndLine(doc('---  \ntitle: x\n---  \nbody')),
      3,
    )
  })
})
