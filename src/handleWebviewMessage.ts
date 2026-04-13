import * as vscode from 'vscode'
import type { NotesStorage } from './NotesStorage'
import type { WebviewMessage } from './webview/types'

export const handleWebviewMessage = (
  message: WebviewMessage,
  storage: NotesStorage,
  sendInit: () => void,
): void => {
  switch (message.type) {
    case 'ready':
      sendInit()
      break
    case 'updateContent': {
      const { activeId } = storage.getState()
      storage.updateContent(activeId, message.content)
      break
    }
    case 'openLink': {
      const uri = vscode.Uri.parse(message.url)
      if (['http', 'https', 'file'].includes(uri.scheme)) {
        vscode.env.openExternal(uri)
      }
      break
    }
  }
}
