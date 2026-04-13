import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
const jsDomWin = dom.window as unknown as Record<string, unknown>
const g = globalThis as Record<string, unknown>

let _rafId = 0
const _rafSyncStub = (cb: FrameRequestCallback): number => {
  cb(Date.now())
  return ++_rafId
}
const _cafStub = (_id: number) => {}

jsDomWin.requestAnimationFrame = _rafSyncStub
jsDomWin.cancelAnimationFrame = _cafStub

if (!jsDomWin.ResizeObserver) {
  jsDomWin.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

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

export const createView = (
  doc: string,
  anchor: number,
  head?: number,
): EditorView => {
  return new EditorView({
    state: EditorState.create({
      doc,
      selection: { anchor, head: head ?? anchor },
    }),
  })
}
