import assert from 'node:assert'
import { describe, it } from 'mocha'
import { indentList, outdentList } from '../../webview/editor'
import { createView } from './cmTestHelper'

const cursorOnLine = (doc: string, lineNum: number): number => {
  const lines = doc.split('\n')
  let pos = 0
  for (let i = 0; i < lineNum - 1; i++) {
    pos += lines[i].length + 1
  }
  return pos
}

describe('listIndent', () => {
  describe('unordered lists', () => {
    it('cycles marker - → * on indent', () => {
      const doc = '- item'
      const view = createView(doc, 0)
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '  * item')
    })

    it('cycles marker * → + on indent', () => {
      const doc = '  * item'
      const view = createView(doc, 0)
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '    + item')
    })

    it('wraps marker back to - at depth 3', () => {
      const doc = '    + item'
      const view = createView(doc, 0)
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '      - item')
    })

    it('cycles marker back on outdent', () => {
      const doc = '  * item'
      const view = createView(doc, 0)
      outdentList(view)
      assert.strictEqual(view.state.doc.toString(), '- item')
    })

    it('does nothing on outdent at root level', () => {
      const doc = '- item'
      const view = createView(doc, 0)
      const result = outdentList(view)
      assert.strictEqual(result, true)
      assert.strictEqual(view.state.doc.toString(), '- item')
    })

    it('returns false on non-list line', () => {
      const doc = 'just text'
      const view = createView(doc, 0)
      const result = indentList(view)
      assert.strictEqual(result, false)
    })
  })

  describe('ordered list renumbering', () => {
    it('indent resets to 1. and renumbers siblings', () => {
      const doc = '1. a\n2. b\n3. c'
      const view = createView(doc, cursorOnLine(doc, 2))
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '1. a\n  1. b\n2. c')
    })

    it('outdent gets correct number and renumbers both levels', () => {
      const doc = '1. a\n  1. b\n  2. c'
      const view = createView(doc, cursorOnLine(doc, 2))
      outdentList(view)
      assert.strictEqual(view.state.doc.toString(), '1. a\n2. b\n  1. c')
    })

    it('indent then outdent is a round-trip', () => {
      const doc = '1. a\n2. b\n3. c\n4. d'
      const view = createView(doc, cursorOnLine(doc, 2))
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '1. a\n  1. b\n2. c\n3. d')

      // Put cursor back on line 2 (now indented)
      const view2 = createView(
        view.state.doc.toString(),
        cursorOnLine(view.state.doc.toString(), 2),
      )
      outdentList(view2)
      assert.strictEqual(view2.state.doc.toString(), '1. a\n2. b\n3. c\n4. d')
    })

    it('indent joins existing sublist with correct numbering', () => {
      const doc = '1. a\n2. b\n  1. c'
      const view = createView(doc, cursorOnLine(doc, 2))
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '1. a\n  1. b\n  2. c')
    })

    it('outdent from sublist renumbers remaining sublist items', () => {
      const doc = '1. a\n  1. b\n  2. c'
      const view = createView(doc, cursorOnLine(doc, 2))
      outdentList(view)
      assert.strictEqual(view.state.doc.toString(), '1. a\n2. b\n  1. c')
    })

    it('preserves suffix style (.)', () => {
      const doc = '1. a\n2. b'
      const view = createView(doc, cursorOnLine(doc, 2))
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '1. a\n  1. b')
    })

    it('preserves suffix style ())', () => {
      const doc = '1) a\n2) b'
      const view = createView(doc, cursorOnLine(doc, 2))
      indentList(view)
      assert.strictEqual(view.state.doc.toString(), '1) a\n  1) b')
    })
  })
})
