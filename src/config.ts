import * as vscode from 'vscode';

class Config {
  private readonly config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('mdpad');
  }

  get leftMargin() {
    return !!this.config.get('leftMargin', false);
  }
}

export function getConfig() {
  return new Config();
}
