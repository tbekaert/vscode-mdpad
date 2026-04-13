import * as vscode from 'vscode';
import { NotesStorage } from './NotesStorage';
import { SidebarProvider } from './SidebarProvider';
import { PanelProvider } from './PanelProvider';
import type { MdpadCommand } from './webview/types';

export const activate = (context: vscode.ExtensionContext): void => {
  const storage = new NotesStorage(context.workspaceState);
  const sidebarProvider = new SidebarProvider(context.extensionUri, storage);

  const panelProvider = new PanelProvider(
    context.extensionUri,
    storage,
    () => {},
  );

  const sendInitToActive = () => {
    if (panelProvider.isActive) {
      panelProvider.sendInit();
    } else {
      sidebarProvider.sendInit();
    }
  };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.openPanel', () => {
      sidebarProvider.detach();
      panelProvider.open();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.newPage', () => {
      storage.newPage();
      sendInitToActive();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.deletePage', () => {
      const { activeId } = storage.getState();
      storage.deletePage(activeId);
      sendInitToActive();
    }),
  );

  const postCommandToActive = (command: MdpadCommand) => {
    if (panelProvider.isActive) {
      panelProvider.postCommand(command);
    } else {
      sidebarProvider.postCommand(command);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.toggleBold', () => postCommandToActive('toggleBold')),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.toggleItalic', () => postCommandToActive('toggleItalic')),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.toggleStrikethrough', () => postCommandToActive('toggleStrikethrough')),
  );
};

export const deactivate = (): void => {};
