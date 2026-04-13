import { EditorView, keymap, drawSelection, placeholder, KeyBinding } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdownDecorations, attachClickHandlers } from './decorations';
import { tableAutoFormat } from './tableFormatter';

export const wrapSelection = (view: EditorView, marker: string): boolean => {
  const { from, to } = view.state.selection.main;
  const selected = view.state.doc.sliceString(from, to);

  if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length > marker.length * 2) {
    view.dispatch({
      changes: { from, to, insert: selected.slice(marker.length, -marker.length) },
    });
    return true;
  }

  const before = view.state.doc.sliceString(Math.max(0, from - marker.length), from);
  const after = view.state.doc.sliceString(to, Math.min(view.state.doc.length, to + marker.length));
  if (before === marker && after === marker) {
    view.dispatch({
      changes: [
        { from: from - marker.length, to: from, insert: '' },
        { from: to, to: to + marker.length, insert: '' },
      ],
    });
    return true;
  }

  view.dispatch({
    changes: { from, to, insert: `${marker}${selected}${marker}` },
    selection: { anchor: from + marker.length, head: to + marker.length },
  });
  return true;
};

const mdKeymap: KeyBinding[] = [
  { key: 'Ctrl-b', run: (view) => wrapSelection(view, '**') },
  { key: 'Ctrl-i', run: (view) => wrapSelection(view, '*') },
  { key: 'Ctrl-Shift-x', run: (view) => wrapSelection(view, '~~') },
];

const vsCodeTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--mdpad-bg)',
    color: 'var(--mdpad-fg)',
  },
  '.cm-content': {
    caretColor: 'var(--mdpad-fg)',
    fontFamily: 'var(--vscode-font-family, sans-serif)',
    fontSize: 'var(--vscode-font-size, 13px)',
    lineHeight: '1.6',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--mdpad-fg)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--mdpad-selection) !important',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

export interface EditorHandle {
  view: EditorView;
  setContent: (content: string) => void;
}

export const createEditor = (
  parent: HTMLElement,
  initialContent: string,
  onContentChange: (content: string) => void,
  onOpenLink: (url: string) => void,
): EditorHandle => {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onContentChange(update.state.doc.toString());
    }
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: initialContent,
      extensions: [
        vsCodeTheme,
        markdown({ extensions: GFM }),
        history(),
        drawSelection(),
        placeholder('Start typing your notes...'),
        keymap.of([...mdKeymap, ...defaultKeymap, ...historyKeymap]),
        updateListener,
        markdownDecorations,
        tableAutoFormat,
      ],
    }),
    parent,
  });

  attachClickHandlers(view, onOpenLink);

  const setContent = (content: string): void => {
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  };

  return { view, setContent };
};
