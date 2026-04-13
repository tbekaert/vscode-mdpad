import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  type KeyBinding,
  keymap,
  placeholder,
} from '@codemirror/view'
import { GFM } from '@lezer/markdown'
import { attachClickHandlers, markdownDecorations } from './decorations'
import { tableAutoFormat } from './tableFormatter'

export const wrapSelection = (view: EditorView, marker: string): boolean => {
  const { from, to } = view.state.selection.main
  const selected = view.state.doc.sliceString(from, to)
  const docText = view.state.doc.toString()
  const ml = marker.length

  // Case 1: selection already includes the markers — unwrap
  if (
    selected.startsWith(marker) &&
    selected.endsWith(marker) &&
    selected.length > ml * 2
  ) {
    view.dispatch({
      changes: { from, to, insert: selected.slice(ml, -ml) },
    })
    return true
  }

  // Case 2: markers are immediately surrounding the selection/cursor — unwrap
  const before = view.state.doc.sliceString(Math.max(0, from - ml), from)
  const after = view.state.doc.sliceString(
    to,
    Math.min(view.state.doc.length, to + ml),
  )
  if (before === marker && after === marker) {
    view.dispatch({
      changes: [
        { from: from - ml, to: from, insert: '' },
        { from: to, to: to + ml, insert: '' },
      ],
    })
    return true
  }

  // Case 3: cursor (collapsed) is inside a wrapped region — find enclosing markers and unwrap
  if (from === to) {
    const openIdx = docText.lastIndexOf(marker, from - 1)
    if (openIdx !== -1) {
      const closeIdx = docText.indexOf(marker, openIdx + ml)
      if (closeIdx !== -1 && closeIdx !== openIdx && from <= closeIdx + ml) {
        // cursor is inside [openIdx .. closeIdx + ml]; remove closing marker first (higher index)
        view.dispatch({
          changes: [
            { from: closeIdx, to: closeIdx + ml, insert: '' },
            { from: openIdx, to: openIdx + ml, insert: '' },
          ],
        })
        return true
      }
    }
  }

  // Case 4: wrap the selection
  view.dispatch({
    changes: { from, to, insert: `${marker}${selected}${marker}` },
    selection: { anchor: from + ml, head: to + ml },
  })
  return true
}

const mdKeymap: KeyBinding[] = [
  { key: 'Ctrl-b', run: view => wrapSelection(view, '**') },
  { key: 'Ctrl-i', run: view => wrapSelection(view, '*') },
  { key: 'Ctrl-Shift-x', run: view => wrapSelection(view, '~~') },
]

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
})

export interface EditorHandle {
  view: EditorView
  setContent: (content: string) => void
}

export const createEditor = (
  parent: HTMLElement,
  initialContent: string,
  onContentChange: (content: string) => void,
  onOpenLink: (url: string) => void,
): EditorHandle => {
  const updateListener = EditorView.updateListener.of(update => {
    if (update.docChanged) {
      onContentChange(update.state.doc.toString())
    }
  })

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
  })

  attachClickHandlers(view, onOpenLink)

  const setContent = (content: string): void => {
    const current = view.state.doc.toString()
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      })
    }
  }

  return { view, setContent }
}
