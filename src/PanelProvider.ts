import * as vscode from 'vscode';
import { getWebviewHtml } from './getWebviewHtml';
import { NotesStorage } from './NotesStorage';
import { handleWebviewMessage } from './handleWebviewMessage';
import type { WebviewMessage, MdpadCommand } from './webview/types';

export class PanelProvider {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly storage: NotesStorage,
    private readonly onDidDispose: () => void,
  ) {}

  open(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
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
    );

    this.panel.webview.html = getWebviewHtml(this.panel.webview, this.extensionUri);

    const messageDisposable = this.panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      handleWebviewMessage(message, this.storage, () => this.sendInit());
    });

    const viewStateDisposable = this.panel.onDidChangeViewState((e) => {
      vscode.commands.executeCommand('setContext', 'mdpad.focused', e.webviewPanel.active);
    });

    this.panel.onDidDispose(() => {
      messageDisposable.dispose();
      viewStateDisposable.dispose();
      this.panel = undefined;
      vscode.commands.executeCommand('setContext', 'mdpad.focused', false);
      this.onDidDispose();
    });

    vscode.commands.executeCommand('setContext', 'mdpad.focused', true);
  }

  sendInit(): void {
    if (this.panel) {
      const state = this.storage.getState();
      this.panel.webview.postMessage({ type: 'init', pages: state.pages, activeId: state.activeId });
    }
  }

  postCommand(command: MdpadCommand): void {
    if (this.panel) {
      this.panel.webview.postMessage({ type: 'command', command });
    }
  }

  get isActive(): boolean {
    return this.panel !== undefined;
  }
}
