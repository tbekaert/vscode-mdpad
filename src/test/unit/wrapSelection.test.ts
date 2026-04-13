import assert from 'node:assert'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { JSDOM } from 'jsdom'
import { describe, it } from 'mocha'
import { wrapSelection } from '../../webview/editor'

// CM6 needs a minimal DOM. It resolves `this.win` via `dom.ownerDocument.defaultView`
// (i.e. jsdom's window), so we must patch the jsdom window directly — not just globalThis.
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
const jsDomWin = dom.window as unknown as Record<string, unknown>
const g = globalThis as Record<string, unknown>

// Use synchronous RAF so measure callbacks never fire asynchronously between tests.
let _rafId = 0
const _rafSyncStub = (cb: FrameRequestCallback): number => {
  cb(Date.now())
  return ++_rafId
}
const _cafStub = (_id: number) => {}

// Patch the jsdom window (where CM6 looks for win.requestAnimationFrame)
jsDomWin.requestAnimationFrame = _rafSyncStub
jsDomWin.cancelAnimationFrame = _cafStub

// Patch ResizeObserver on the jsdom window (CM6 uses win.ResizeObserver)
if (!jsDomWin.ResizeObserver) {
  jsDomWin.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mirror globals so imports that check `global.X` also work
g.document = dom.window.document
g.window = dom.window
g.Window = jsDomWin.Window ?? dom.window.constructor
g.Node = dom.window.Node
g.Element = dom.window.Element
g.HTMLElement = dom.window.HTMLElement
g.MutationObserver = dom.window.MutationObserver
g.ResizeObserver = jsDomWin.ResizeObserver
g.requestAnimationFrame = _rafSyncStub
g.cancelAnimationFrame = _cafStub

const createView = (doc: string, anchor: number, head?: number): EditorView => {
  return new EditorView({
    state: EditorState.create({
      doc,
      selection: { anchor, head: head ?? anchor },
    }),
  })
}

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
})
