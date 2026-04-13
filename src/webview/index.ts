import './styles.css'
import { createEditor, type EditorHandle, wrapSelection } from './editor'
import type { ExtensionMessage } from './types'

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

const vscode = acquireVsCodeApi()

let editor: EditorHandle | undefined
let debounceTimer: ReturnType<typeof setTimeout> | undefined

const debounce = (fn: () => void, ms: number): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(fn, ms)
}

const handleContentChange = (content: string): void => {
  debounce(() => {
    vscode.postMessage({ type: 'updateContent', content })
  }, 500)
}

const handleOpenLink = (url: string): void => {
  vscode.postMessage({ type: 'openLink', url })
}

const init = (): void => {
  const editorContainer = document.getElementById('editor')
  if (!editorContainer) return

  editor = createEditor(
    editorContainer,
    '',
    handleContentChange,
    handleOpenLink,
  )

  window.addEventListener(
    'message',
    (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data
      switch (message.type) {
        case 'init': {
          editor?.setContent(message.content)
          editor?.view.focus()
          break
        }
        case 'command': {
          if (!editor) break
          switch (message.command) {
            case 'toggleBold':
              wrapSelection(editor.view, '**')
              break
            case 'toggleItalic':
              wrapSelection(editor.view, '*')
              break
            case 'toggleStrikethrough':
              wrapSelection(editor.view, '~~')
              break
          }
          break
        }
        case 'settings': {
          editor?.applySettings(message)
          break
        }
      }
    },
  )

  window.addEventListener('focus', () => {
    editor?.view.focus()
  })

  vscode.postMessage({ type: 'ready' })
}

init()
