import * as vscode from 'vscode'
import { getWebviewHtml } from './getWebviewHtml'
import { handleWebviewMessage } from './handleWebviewMessage'
import type { NotesStorage } from './NotesStorage'
import type { MdpadCommand, WebviewMessage } from './webview/types'

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'mdpad.notesView'

  private view?: vscode.WebviewView

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly storage: NotesStorage,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }

    webviewView.webview.html = getWebviewHtml(
      webviewView.webview,
      this.extensionUri,
    )

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      handleWebviewMessage(message, this.storage, () => this.sendInit())
    })

    webviewView.onDidChangeVisibility(() => {
      vscode.commands.executeCommand(
        'setContext',
        'mdpad.focused',
        webviewView.visible,
      )
    })

    vscode.commands.executeCommand('setContext', 'mdpad.focused', true)
  }

  sendInit(): void {
    if (this.view) {
      const state = this.storage.getState()
      const page = state.pages.find(p => p.id === state.activeId)
      this.view.webview.postMessage({
        type: 'init',
        content: page?.content ?? '',
      })
    }
  }

  postCommand(command: MdpadCommand): void {
    if (this.view) {
      this.view.webview.postMessage({ type: 'command', command })
    }
  }

  detach(): void {
    this.view = undefined
  }
}
