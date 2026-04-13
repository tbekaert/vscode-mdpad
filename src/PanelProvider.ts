import * as vscode from 'vscode'
import { getWebviewHtml } from './getWebviewHtml'
import { handleWebviewMessage } from './handleWebviewMessage'
import type { NotesStorage } from './NotesStorage'
import type { MdpadCommand, WebviewMessage } from './webview/types'

export class PanelProvider {
  private panel?: vscode.WebviewPanel

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly getStorage: () => NotesStorage,
    private readonly onDidDispose: () => void,
  ) {}

  open(): void {
    if (this.panel) {
      this.panel.reveal()
      return
    }

    this.panel = vscode.window.createWebviewPanel(
      'mdpad.panel',
      'mdpad',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this.extensionUri],
        retainContextWhenHidden: true,
      },
    )

    this.panel.webview.html = getWebviewHtml(
      this.panel.webview,
      this.extensionUri,
    )

    const messageDisposable = this.panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        handleWebviewMessage(message, this.getStorage(), () => this.sendInit())
      },
    )

    const viewStateDisposable = this.panel.onDidChangeViewState(e => {
      vscode.commands.executeCommand(
        'setContext',
        'mdpad.focused',
        e.webviewPanel.active,
      )
    })

    this.panel.onDidDispose(() => {
      messageDisposable.dispose()
      viewStateDisposable.dispose()
      this.panel = undefined
      vscode.commands.executeCommand('setContext', 'mdpad.focused', false)
      this.onDidDispose()
    })

    vscode.commands.executeCommand('setContext', 'mdpad.focused', true)
  }

  sendInit(): void {
    if (this.panel) {
      const state = this.getStorage().getState()
      const page = state.pages.find(p => p.id === state.activeId)
      this.panel.webview.postMessage({
        type: 'init',
        content: page?.content ?? '',
      })
    }
  }

  setTitle(title: string): void {
    if (this.panel) {
      this.panel.title = title
    }
  }

  postCommand(command: MdpadCommand): void {
    if (this.panel) {
      this.panel.webview.postMessage({ type: 'command', command })
    }
  }

  get isActive(): boolean {
    return this.panel !== undefined
  }
}
