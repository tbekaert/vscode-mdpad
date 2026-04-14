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
      const url = message.url
      if (/^https?:\/\//.test(url)) {
        vscode.env.openExternal(vscode.Uri.parse(url))
      } else {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
        if (!workspaceFolder) break
        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, url)
        vscode.workspace.openTextDocument(fileUri).then(
          doc => vscode.window.showTextDocument(doc),
          err => {
            vscode.window.showErrorMessage(
              `mdpad: could not open ${url} — ${err instanceof Error ? err.message : String(err)}`,
            )
          },
        )
      }
      break
    }
  }
}
