import './styles.css';
import { createEditor, EditorHandle, wrapSelection } from './editor';
import { createToolbar, ToolbarHandle } from './toolbar';
import type { ExtensionMessage, Page } from './types';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

let editor: EditorHandle | undefined;
let toolbar: ToolbarHandle | undefined;
let currentActiveId = '';
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const debounce = (fn: () => void, ms: number): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(fn, ms);
};

const handleContentChange = (content: string): void => {
  debounce(() => {
    toolbar?.updateActiveTitle(content);
    vscode.postMessage({ type: 'updateContent', id: currentActiveId, content });
  }, 500);
};

const handleOpenLink = (url: string): void => {
  vscode.postMessage({ type: 'openLink', url });
};

const init = (): void => {
  const toolbarContainer = document.getElementById('toolbar')!;
  const editorContainer = document.getElementById('editor')!;

  editor = createEditor(editorContainer, '', handleContentChange, handleOpenLink);

  toolbar = createToolbar(toolbarContainer, {
    onNewPage: () => vscode.postMessage({ type: 'newPage' }),
    onDeletePage: (id) => vscode.postMessage({ type: 'deletePage', id }),
    onSwitchPage: (id) => vscode.postMessage({ type: 'switchPage', id }),
  });

  window.addEventListener('message', (event: MessageEvent<ExtensionMessage>) => {
    const message = event.data;
    switch (message.type) {
      case 'init': {
        currentActiveId = message.activeId;
        const activePage = message.pages.find((p) => p.id === currentActiveId);
        if (activePage && editor) {
          editor.setContent(activePage.content);
        }
        toolbar?.updatePages(message.pages, currentActiveId);
        break;
      }
      case 'command': {
        if (!editor) break;
        switch (message.command) {
          case 'toggleBold':
            wrapSelection(editor.view, '**');
            break;
          case 'toggleItalic':
            wrapSelection(editor.view, '*');
            break;
          case 'toggleStrikethrough':
            wrapSelection(editor.view, '~~');
            break;
        }
        break;
      }
    }
  });

  vscode.postMessage({ type: 'ready' });
};

init();
