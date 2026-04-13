import assert from 'node:assert'
import { describe, it } from 'mocha'
import { toggleHeading } from '../../webview/editor'
import { createView } from './cmTestHelper'

describe('toggleHeading', () => {
  it('adds # to a plain line', () => {
    const view = createView('hello', 0)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '# hello')
  })

  it('cycles # to ##', () => {
    const view = createView('# hello', 0)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '## hello')
  })

  it('cycles ## to ###', () => {
    const view = createView('## hello', 0)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '### hello')
  })

  it('removes ### back to plain text', () => {
    const view = createView('### hello', 0)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), 'hello')
  })

  it('works with cursor in the middle of the line', () => {
    const view = createView('hello world', 5)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '# hello world')
  })

  it('only affects the line the cursor is on', () => {
    const doc = 'first\nsecond\nthird'
    const view = createView(doc, 7)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), 'first\n# second\nthird')
  })

  it('full cycle: plain → # → ## → ### → plain', () => {
    const view = createView('text', 0)
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '# text')
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '## text')
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), '### text')
    toggleHeading(view)
    assert.strictEqual(view.state.doc.toString(), 'text')
  })
})
