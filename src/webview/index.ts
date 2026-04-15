import './styles.css'
import {
  createEditor,
  type EditorHandle,
  toggleHeading,
  wrapSelection,
} from './editor'
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

  // Expose editor view for e2e tests
  ;(window as unknown as { __mdpadView?: unknown }).__mdpadView = editor.view

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
            case 'toggleCode':
              wrapSelection(editor.view, '`')
              break
            case 'toggleHighlight':
              wrapSelection(editor.view, '==')
              break
            case 'toggleHeading':
              toggleHeading(editor.view)
              break
          }
          break
        }
        case 'settings': {
          editor?.applySettings(message)
          break
        }
        case 'setCursor': {
          if (!editor) break
          const pos = Math.min(message.pos, editor.view.state.doc.length)
          editor.view.dispatch({
            selection: { anchor: pos },
            scrollIntoView: true,
          })
          editor.view.focus()
          break
        }
      }
    },
  )

  window.addEventListener('focus', () => {
    editor?.view.focus()
    vscode.postMessage({ type: 'focusChange', focused: true })
  })

  window.addEventListener('blur', () => {
    vscode.postMessage({ type: 'focusChange', focused: false })
  })

  vscode.postMessage({ type: 'ready' })
}

init()
