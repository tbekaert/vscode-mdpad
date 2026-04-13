import assert from 'node:assert'
import { describe, it } from 'mocha'
import { wrapSelection } from '../../webview/editor'
import { createView } from './cmTestHelper'

describe('wrapSelection', () => {
  describe('with ** (bold)', () => {
    it('wraps selected text', () => {
      const view = createView('hello world', 0, 5)
      wrapSelection(view, '**')
      assert.strictEqual(view.state.doc.toString(), '**hello** world')
    })

    it('inserts empty markers at cursor', () => {
      const view = createView('hello', 3)
      wrapSelection(view, '**')
      assert.strictEqual(view.state.doc.toString(), 'hel****lo')
    })

    it('unwraps when selection includes markers', () => {
      const view = createView('**hello**', 0, 9)
      wrapSelection(view, '**')
      assert.strictEqual(view.state.doc.toString(), 'hello')
    })

    it('unwraps when cursor is between markers', () => {
      const view = createView('**hello**', 4)
      wrapSelection(view, '**')
      assert.strictEqual(view.state.doc.toString(), 'hello')
    })
  })

  describe('with * (italic)', () => {
    it('wraps selected text', () => {
      const view = createView('hello world', 6, 11)
      wrapSelection(view, '*')
      assert.strictEqual(view.state.doc.toString(), 'hello *world*')
    })
  })

  describe('with ~~ (strikethrough)', () => {
    it('wraps selected text', () => {
      const view = createView('hello', 0, 5)
      wrapSelection(view, '~~')
      assert.strictEqual(view.state.doc.toString(), '~~hello~~')
    })
  })

  describe('with ` (inline code)', () => {
    it('wraps selected text', () => {
      const view = createView('hello world', 0, 5)
      wrapSelection(view, '`')
      assert.strictEqual(view.state.doc.toString(), '`hello` world')
    })

    it('unwraps when selection includes markers', () => {
      const view = createView('`hello`', 0, 7)
      wrapSelection(view, '`')
      assert.strictEqual(view.state.doc.toString(), 'hello')
    })

    it('unwraps when cursor is between markers', () => {
      const view = createView('`hello`', 3)
      wrapSelection(view, '`')
      assert.strictEqual(view.state.doc.toString(), 'hello')
    })
  })
})
