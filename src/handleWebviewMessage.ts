import * as vscode from 'vscode';
import { NotesStorage } from './NotesStorage';
import type { WebviewMessage } from './webview/types';

export const handleWebviewMessage = (
  message: WebviewMessage,
  storage: NotesStorage,
  sendInit: () => void,
): void => {
  switch (message.type) {
    case 'ready':
      sendInit();
      break;
    case 'updateContent':
      storage.updateContent(message.id, message.content);
      break;
    case 'newPage':
      storage.newPage();
      sendInit();
      break;
    case 'deletePage':
      storage.deletePage(message.id);
      sendInit();
      break;
    case 'switchPage':
      storage.switchPage(message.id);
      sendInit();
      break;
    case 'openLink': {
      const uri = vscode.Uri.parse(message.url);
      if (['http', 'https', 'file'].includes(uri.scheme)) {
        vscode.env.openExternal(uri);
      }
      break;
    }
  }
};
