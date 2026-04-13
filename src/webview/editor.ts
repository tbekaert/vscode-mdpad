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

import {
  LIST_INDENT,
  LIST_INDENT_SIZE,
  listPattern,
  olPattern,
  ulMarkers,
} from './listPatterns'

const renumberOlSiblings = (
  doc: import('@codemirror/state').Text,
  startLineNum: number,
  targetIndent: string,
  startNum: number,
): { from: number; to: number; insert: string }[] => {
  const changes: { from: number; to: number; insert: string }[] = []
  let num = startNum
  for (let i = startLineNum; i <= doc.lines; i++) {
    const l = doc.line(i)
    const m = l.text.match(olPattern)
    if (!m) break
    const [, indent] = m
    if (indent.length < targetIndent.length) break
    if (indent.length > targetIndent.length) continue
    const numStart = l.from + indent.length
    const numEnd = numStart + m[2].length
    changes.push({ from: numStart, to: numEnd, insert: String(num) })
    num++
  }
  return changes
}

const findNextOlNumber = (
  doc: import('@codemirror/state').Text,
  beforeLineNum: number,
  targetIndent: string,
): number => {
  for (let i = beforeLineNum - 1; i >= 1; i--) {
    const l = doc.line(i)
    const m = l.text.match(olPattern)
    if (!m) break
    const [, indent] = m
    if (indent.length < targetIndent.length) break
    if (indent.length === targetIndent.length) {
      return Number.parseInt(m[2], 10) + 1
    }
  }
  return 1
}

const shiftListItem = (view: EditorView, direction: 'in' | 'out'): boolean => {
  const line = view.state.doc.lineAt(view.state.selection.main.head)
  const match = line.text.match(listPattern)
  if (!match) return false

  const [, indent, marker] = match

  if (direction === 'out' && indent.length === 0) return true

  const newIndent =
    direction === 'in'
      ? `${indent}${LIST_INDENT}`
      : indent.slice(Math.min(LIST_INDENT_SIZE, indent.length))
  const depth = newIndent.length / LIST_INDENT_SIZE
  const isOl = !ulMarkers.includes(marker)

  let newMarker = marker
  let newNum = 1
  if (!isOl) {
    newMarker = ulMarkers[depth % ulMarkers.length]
  } else {
    const suffix = marker.slice(-1)
    newNum = findNextOlNumber(view.state.doc, line.number, newIndent)
    newMarker = `${newNum}${suffix}`
  }

  const markerStart = line.from + indent.length
  const markerEnd = markerStart + marker.length

  const changes: { from: number; to: number; insert: string }[] = [
    { from: line.from, to: markerStart, insert: newIndent },
    { from: markerStart, to: markerEnd, insert: newMarker },
  ]

  if (isOl && line.number + 1 <= view.state.doc.lines) {
    const originalStartNum =
      direction === 'in'
        ? Number.parseInt(marker.match(/\d+/)?.[0] ?? '1', 10)
        : 1
    changes.push(
      ...renumberOlSiblings(
        view.state.doc,
        line.number + 1,
        indent,
        originalStartNum,
      ),
    )
    changes.push(
      ...renumberOlSiblings(
        view.state.doc,
        line.number + 1,
        newIndent,
        newNum + 1,
      ),
    )
  }

  view.dispatch({ changes })
  return true
}

export const indentList = (view: EditorView): boolean =>
  shiftListItem(view, 'in')
export const outdentList = (view: EditorView): boolean =>
  shiftListItem(view, 'out')

const mdKeymap: KeyBinding[] = [
  { key: 'Ctrl-b', run: view => wrapSelection(view, '**') },
  { key: 'Ctrl-i', run: view => wrapSelection(view, '*') },
  { key: 'Ctrl-Shift-x', run: view => wrapSelection(view, '~~') },
  { key: 'Tab', run: indentList },
  { key: 'Shift-Tab', run: outdentList },
]

export const isLinkable = (text: string): boolean =>
  /^https?:\/\//.test(text) || /\.\w{1,10}$/.test(text.trim())

const pasteAsLink = EditorView.domEventHandlers({
  paste(event, view) {
    const { from, to } = view.state.selection.main
    if (from === to) return false
    const pasted = event.clipboardData?.getData('text/plain')
    if (!pasted || !isLinkable(pasted)) return false
    const selected = view.state.doc.sliceString(from, to)
    const link = `[${selected}](${pasted.trim()})`
    view.dispatch({
      changes: { from, to, insert: link },
      selection: { anchor: from + link.length },
    })
    event.preventDefault()
    return true
  },
})

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
        EditorView.lineWrapping,
        markdown({ extensions: GFM }),
        history(),
        drawSelection(),
        placeholder('Start typing your notes...'),
        keymap.of([...mdKeymap, ...defaultKeymap, ...historyKeymap]),
        updateListener,
        markdownDecorations,
        tableAutoFormat,
        pasteAsLink,
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
