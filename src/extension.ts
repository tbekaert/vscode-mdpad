// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import MdpadProvider from './webviewProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
  context.subscriptions.push(statusBar);

  const provider = new MdpadProvider(context.extensionUri, statusBar);

  // register some listener that make sure the status bar
  // item always up-to-date
  // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(provider.updateStatusBar));
  // context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(provider.updateStatusBar));

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(MdpadProvider.viewId, provider));

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.togglePreview', () => {
      // The code you place here will be executed every time your command is executed
      provider.togglePreview();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.previousPage', () => {
      provider.previousPage();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.nextPage', () => {
      provider.nextPage();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.resetData', () => {
      provider.resetData();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.exportPage', () => {
      provider.exportPage();
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
