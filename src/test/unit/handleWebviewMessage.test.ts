import assert from 'node:assert'
import { beforeEach, describe, it } from 'mocha'
import { handleWebviewMessage } from '../../handleWebviewMessage'
import type { NotesStorage } from '../../NotesStorage'
import type { WebviewMessage } from '../../webview/types'
import {
  calls,
  resetCalls,
  setOpenTextDocumentFailure,
  setWorkspaceFolders,
  Uri,
} from './vscodeStub'

const makeStorage = (): {
  storage: NotesStorage
  updates: { id: string; content: string }[]
  activeId: string
} => {
  const updates: { id: string; content: string }[] = []
  const activeId = 'page-1'
  const storage = {
    getState: () => ({ activeId, pages: [{ id: activeId, content: '' }] }),
    updateContent: (id: string, content: string) => {
      updates.push({ id, content })
    },
  } as unknown as NotesStorage
  return { storage, updates, activeId }
}

describe('handleWebviewMessage', () => {
  beforeEach(() => {
    resetCalls()
    setOpenTextDocumentFailure(null)
    setWorkspaceFolders([{ uri: Uri.parse('file:///workspace') }])
  })

  describe('ready', () => {
    it('invokes sendInit callback', () => {
      const { storage } = makeStorage()
      let called = 0
      handleWebviewMessage({ type: 'ready' } as WebviewMessage, storage, () => {
        called++
      })
      assert.strictEqual(called, 1)
    })
  })

  describe('updateContent', () => {
    it('forwards content to storage under the active id', () => {
      const { storage, updates, activeId } = makeStorage()
      handleWebviewMessage(
        { type: 'updateContent', content: 'hello' } as WebviewMessage,
        storage,
        () => {},
      )
      assert.deepStrictEqual(updates, [{ id: activeId, content: 'hello' }])
    })
  })

  describe('openLink', () => {
    it('opens http(s) URLs via env.openExternal', () => {
      const { storage } = makeStorage()
      handleWebviewMessage(
        { type: 'openLink', url: 'https://example.com/a' } as WebviewMessage,
        storage,
        () => {},
      )
      const external = calls.filter(c => c.method === 'env.openExternal')
      assert.strictEqual(external.length, 1)
      assert.strictEqual(
        calls.some(c => c.method === 'workspace.openTextDocument'),
        false,
      )
    })

    it('opens local file paths relative to the first workspace folder', async () => {
      const { storage } = makeStorage()
      handleWebviewMessage(
        { type: 'openLink', url: 'notes/foo.md' } as WebviewMessage,
        storage,
        () => {},
      )
      // openTextDocument is called synchronously; resolution is async
      await new Promise(r => setTimeout(r, 0))
      const openCall = calls.find(
        c => c.method === 'workspace.openTextDocument',
      )
      assert.ok(openCall, 'expected openTextDocument to be called')
      const uri = openCall.args[0] as { path: string }
      assert.match(uri.path, /\/workspace\/notes\/foo\.md$/)
    })

    it('does nothing for relative path when no workspace folder is open', () => {
      setWorkspaceFolders(undefined)
      const { storage } = makeStorage()
      handleWebviewMessage(
        { type: 'openLink', url: 'notes/foo.md' } as WebviewMessage,
        storage,
        () => {},
      )
      assert.strictEqual(
        calls.some(c => c.method === 'workspace.openTextDocument'),
        false,
      )
      assert.strictEqual(
        calls.some(c => c.method === 'env.openExternal'),
        false,
      )
    })

    it('surfaces an error message when opening a local file fails', async () => {
      setOpenTextDocumentFailure(new Error('file not found'))
      const { storage } = makeStorage()
      handleWebviewMessage(
        { type: 'openLink', url: 'missing.md' } as WebviewMessage,
        storage,
        () => {},
      )
      // Let the rejection propagate through the microtask queue
      await new Promise(r => setTimeout(r, 0))
      const err = calls.find(c => c.method === 'window.showErrorMessage')
      assert.ok(err, 'expected showErrorMessage to be called')
      assert.match(String(err.args[0]), /could not open missing\.md/)
      assert.match(String(err.args[0]), /file not found/)
    })

    it('does not call openExternal for local (non-http) links', () => {
      const { storage } = makeStorage()
      handleWebviewMessage(
        { type: 'openLink', url: 'foo.md' } as WebviewMessage,
        storage,
        () => {},
      )
      assert.strictEqual(
        calls.some(c => c.method === 'env.openExternal'),
        false,
      )
    })
  })
})
