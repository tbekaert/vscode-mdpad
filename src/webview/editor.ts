import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  type KeyBinding,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { GFM } from '@lezer/markdown'
import { codeLanguages } from './codeLanguages'
import { attachClickHandlers, markdownDecorations } from './decorations'
import { setListIndent } from './listPatterns'
import { tableAutoFormat } from './tableFormatter'
import type { MdpadSettings } from './types'

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

export const toggleHeading = (view: EditorView): boolean => {
  const line = view.state.doc.lineAt(view.state.selection.main.head)
  const match = line.text.match(/^(#{1,3})\s/)
  let insert: string
  if (!match) {
    insert = `# ${line.text}`
  } else if (match[1].length < 3) {
    insert = `#${line.text}`
  } else {
    insert = line.text.replace(/^#{1,3}\s/, '')
  }
  view.dispatch({ changes: { from: line.from, to: line.to, insert } })
  return true
}

const mdKeymap: KeyBinding[] = [
  { key: 'Ctrl-b', run: view => wrapSelection(view, '**') },
  { key: 'Ctrl-i', run: view => wrapSelection(view, '*') },
  { key: 'Ctrl-Shift-x', run: view => wrapSelection(view, '~~') },
  { key: 'Ctrl-Shift-`', run: view => wrapSelection(view, '`') },
  { key: 'Ctrl-Shift-e', run: view => wrapSelection(view, '==') },
  { key: 'Ctrl-Shift-h', run: toggleHeading },
  { key: 'Tab', run: indentList },
  { key: 'Shift-Tab', run: outdentList },
]

export const isLinkable = (text: string): boolean =>
  /^https?:\/\//.test(text) || /\.\w{1,10}$/.test(text.trim())

const autoCloseFrontmatter = EditorView.inputHandler.of(
  (view, from, to, text) => {
    if (text !== '-') return false
    const line = view.state.doc.lineAt(from)
    if (line.number !== 1) return false
    const before = line.text.slice(0, from - line.from)
    if (before !== '--') return false
    view.dispatch({
      changes: { from, to, insert: '-\n\n---' },
      selection: { anchor: from + 2 },
    })
    return true
  },
)

const autoCloseFence = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== '`') return false
  const line = view.state.doc.lineAt(from)
  const before = line.text.slice(0, from - line.from)
  if (before !== '``') return false
  view.dispatch({
    changes: { from, to, insert: '`\n\n```' },
    selection: { anchor: from + 1 },
  })
  return true
})

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

const codeHighlight = HighlightStyle.define([
  {
    tag: tags.keyword,
    color: 'var(--vscode-debugTokenExpression-name, #c586c0)',
  },
  {
    tag: tags.controlKeyword,
    color: 'var(--vscode-debugTokenExpression-name, #c586c0)',
  },
  {
    tag: tags.operatorKeyword,
    color: 'var(--vscode-debugTokenExpression-name, #c586c0)',
  },
  {
    tag: tags.definitionKeyword,
    color: 'var(--vscode-debugTokenExpression-name, #c586c0)',
  },
  {
    tag: tags.string,
    color: 'var(--vscode-debugTokenExpression-string, #ce9178)',
  },
  {
    tag: tags.number,
    color: 'var(--vscode-debugTokenExpression-number, #b5cea8)',
  },
  {
    tag: tags.bool,
    color: 'var(--vscode-debugTokenExpression-boolean, #4e94ce)',
  },
  {
    tag: tags.comment,
    color: 'var(--vscode-editorLineNumber-foreground, #6a9955)',
    fontStyle: 'italic',
  },
  {
    tag: tags.lineComment,
    color: 'var(--vscode-editorLineNumber-foreground, #6a9955)',
    fontStyle: 'italic',
  },
  {
    tag: tags.blockComment,
    color: 'var(--vscode-editorLineNumber-foreground, #6a9955)',
    fontStyle: 'italic',
  },
  {
    tag: tags.typeName,
    color: 'var(--vscode-symbolIcon-classForeground, #4ec9b0)',
  },
  {
    tag: tags.className,
    color: 'var(--vscode-symbolIcon-classForeground, #4ec9b0)',
  },
  {
    tag: tags.function(tags.variableName),
    color: 'var(--vscode-symbolIcon-functionForeground, #dcdcaa)',
  },
  {
    tag: tags.definition(tags.variableName),
    color: 'var(--vscode-symbolIcon-variableForeground, #9cdcfe)',
  },
  {
    tag: tags.propertyName,
    color: 'var(--vscode-symbolIcon-propertyForeground, #9cdcfe)',
  },
  {
    tag: tags.attributeName,
    color: 'var(--vscode-symbolIcon-propertyForeground, #9cdcfe)',
  },
  {
    tag: tags.tagName,
    color: 'var(--vscode-debugTokenExpression-name, #569cd6)',
  },
  {
    tag: tags.attributeValue,
    color: 'var(--vscode-debugTokenExpression-string, #ce9178)',
  },
  {
    tag: tags.regexp,
    color: 'var(--vscode-debugTokenExpression-string, #d16969)',
  },
  { tag: tags.operator, color: 'var(--vscode-editor-foreground, #d4d4d4)' },
  { tag: tags.punctuation, color: 'var(--vscode-editor-foreground, #d4d4d4)' },
])

const vsCodeTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--mdpad-bg)',
    color: 'var(--mdpad-fg)',
  },
  '.cm-content': {
    caretColor: 'var(--mdpad-fg)',
    fontSize: 'var(--vscode-font-size, 13px)',
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

const codeMirrorSettings = new Compartment()

const buildSettingsExtensions = (settings: MdpadSettings) => {
  const fontFamily =
    settings.fontFamily === 'inherit'
      ? 'var(--vscode-font-family, sans-serif)'
      : settings.fontFamily

  const extensions = [
    EditorView.theme({
      '.cm-content': {
        fontFamily,
        lineHeight: String(settings.lineHeight),
      },
    }),
  ]

  if (settings.lineWrapping) {
    extensions.push(EditorView.lineWrapping)
  }

  if (settings.lineNumbers) {
    extensions.push(lineNumbers())
  }

  return extensions
}

export interface EditorHandle {
  view: EditorView
  setContent: (content: string) => void
  applySettings: (settings: MdpadSettings) => void
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
        codeMirrorSettings.of([EditorView.lineWrapping]),
        markdown({ extensions: GFM, codeLanguages }),
        syntaxHighlighting(codeHighlight),
        history(),
        drawSelection(),
        placeholder('Start typing your notes...'),
        keymap.of([...mdKeymap, ...defaultKeymap, ...historyKeymap]),
        updateListener,
        markdownDecorations,
        tableAutoFormat,
        pasteAsLink,
        autoCloseFence,
        autoCloseFrontmatter,
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

  const applySettings = (settings: MdpadSettings): void => {
    setListIndent(settings.listIndentSize)
    view.dispatch({
      effects: codeMirrorSettings.reconfigure(
        buildSettingsExtensions(settings),
      ),
    })
  }

  return { view, setContent, applySettings }
}
