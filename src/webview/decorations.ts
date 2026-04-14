import { syntaxTree } from '@codemirror/language'
import type { Range } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view'
import { olPattern, ulPattern } from './listPatterns'

// ---------------------------------------------------------------------------
// Decoration constants
// ---------------------------------------------------------------------------

const muted = Decoration.mark({ class: 'mdpad-muted' })

const boldMark = Decoration.mark({ class: 'mdpad-bold' })
const italicMark = Decoration.mark({ class: 'mdpad-italic' })
const strikeMark = Decoration.mark({ class: 'mdpad-strike' })
const highlightMark = Decoration.mark({ class: 'mdpad-highlight' })
const inlineCodeMark = Decoration.mark({ class: 'mdpad-inline-code' })
const linkTextMark = Decoration.mark({ class: 'mdpad-link-text' })
const headingMarks: Record<number, Decoration> = {
  1: Decoration.mark({ class: 'mdpad-heading mdpad-heading-1' }),
  2: Decoration.mark({ class: 'mdpad-heading mdpad-heading-2' }),
  3: Decoration.mark({ class: 'mdpad-heading mdpad-heading-3' }),
  4: Decoration.mark({ class: 'mdpad-heading mdpad-heading-4' }),
  5: Decoration.mark({ class: 'mdpad-heading mdpad-heading-5' }),
  6: Decoration.mark({ class: 'mdpad-heading mdpad-heading-6' }),
}
const headingPrefixMark = Decoration.mark({
  class: 'mdpad-muted mdpad-heading',
})

const headingConfig: Record<string, number> = {
  ATXHeading1: 1,
  ATXHeading2: 2,
  ATXHeading3: 3,
  ATXHeading4: 4,
  ATXHeading5: 5,
  ATXHeading6: 6,
}

// ---------------------------------------------------------------------------
// Per-node-type decoration helpers
// ---------------------------------------------------------------------------

import type { Text } from '@codemirror/state'

const decorateHeading = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
  name: string,
): void => {
  const text = doc.sliceString(from, to)
  const hashMatch = text.match(/^(#{1,6})\s/)
  if (hashMatch) {
    const prefixEnd = from + hashMatch[0].length
    const level = headingConfig[name]
    decorations.push(headingPrefixMark.range(from, prefixEnd))
    if (prefixEnd < to) {
      decorations.push(headingMarks[level].range(prefixEnd, to))
    }
  }
}

const decorateStrongEmphasis = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const text = doc.sliceString(from, to)
  const marker = text.startsWith('**') ? '**' : '__'
  const mLen = marker.length
  if (to - from > mLen * 2) {
    decorations.push(muted.range(from, from + mLen))
    decorations.push(boldMark.range(from + mLen, to - mLen))
    decorations.push(muted.range(to - mLen, to))
  }
}

const decorateEmphasis = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const text = doc.sliceString(from, to)
  const marker = text.startsWith('*') ? '*' : '_'
  const mLen = marker.length
  if (to - from > mLen * 2) {
    decorations.push(muted.range(from, from + mLen))
    decorations.push(italicMark.range(from + mLen, to - mLen))
    decorations.push(muted.range(to - mLen, to))
  }
}

const decorateStrikethrough = (
  decorations: Range<Decoration>[],
  from: number,
  to: number,
): void => {
  if (to - from > 4) {
    decorations.push(muted.range(from, from + 2))
    decorations.push(strikeMark.range(from + 2, to - 2))
    decorations.push(muted.range(to - 2, to))
  }
}

const decorateInlineCode = (
  decorations: Range<Decoration>[],
  from: number,
  to: number,
): void => {
  if (to - from > 2) {
    decorations.push(muted.range(from, from + 1))
    decorations.push(inlineCodeMark.range(from + 1, to - 1))
    decorations.push(muted.range(to - 1, to))
  }
}

const decorateLink = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const text = doc.sliceString(from, to)
  const match = text.match(/^\[(.+?)\]\((.+?)\)$/)
  if (match) {
    const textEnd = from + 1 + match[1].length
    decorations.push(muted.range(from, from + 1))
    decorations.push(linkTextMark.range(from + 1, textEnd))
    decorations.push(muted.range(textEnd, textEnd + 2))
    decorations.push(muted.range(textEnd + 2, to - 1))
    decorations.push(muted.range(to - 1, to))
  }
}

const decorateBlockquote = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const startLine = doc.lineAt(from)
  const endLine = doc.lineAt(to)
  for (let i = startLine.number; i <= endLine.number; i++) {
    const line = doc.line(i)
    decorations.push(
      Decoration.line({ class: 'mdpad-blockquote' }).range(line.from),
    )
    const bqMatch = line.text.match(/^>\s?/)
    if (bqMatch) {
      decorations.push(muted.range(line.from, line.from + bqMatch[0].length))
    }
  }
}

const listBulletMark = Decoration.mark({ class: 'mdpad-list-bullet' })

const decorateListItem = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
): void => {
  const line = doc.lineAt(from)
  const taskMatch = line.text.match(/^(\s*[-*+]\s+)\[([ xX])\]\s/)
  if (taskMatch) {
    const dashEnd = line.from + taskMatch[1].length
    const bracketStart = dashEnd
    const bracketEnd = dashEnd + 3
    const contentStart = bracketEnd + 1
    const isChecked = taskMatch[2] !== ' '

    decorations.push(muted.range(line.from, dashEnd))
    decorations.push(
      Decoration.mark({ class: 'mdpad-task-bracket' }).range(
        bracketStart,
        bracketEnd,
      ),
    )

    if (isChecked && contentStart < line.to) {
      decorations.push(
        Decoration.mark({ class: 'mdpad-task-checked' }).range(
          contentStart,
          line.to,
        ),
      )
    }
    return
  }

  const ulMatch = line.text.match(ulPattern)
  if (ulMatch) {
    const markerStart = line.from + ulMatch[1].length
    const markerEnd = markerStart + ulMatch[2].length
    decorations.push(listBulletMark.range(markerStart, markerEnd))
    return
  }

  const olMatch = line.text.match(olPattern)
  if (olMatch) {
    const markerStart = line.from + olMatch[1].length
    const markerEnd = markerStart + olMatch[2].length + olMatch[3].length
    decorations.push(muted.range(markerStart, markerEnd))
    return
  }
}

const decorateHorizontalRule = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const line = doc.lineAt(from)
  decorations.push(muted.range(from, to))
  decorations.push(Decoration.line({ class: 'mdpad-hr' }).range(line.from))
}

const decorateFencedCode = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const startLine = doc.lineAt(from)
  const endLine = doc.lineAt(to)

  if (startLine.number === endLine.number) return

  for (let i = startLine.number; i <= endLine.number; i++) {
    const line = doc.line(i)
    if (
      (i === startLine.number || i === endLine.number) &&
      line.from < line.to
    ) {
      decorations.push(muted.range(line.from, line.to))
    }
    decorations.push(
      Decoration.line({ class: 'mdpad-code-line' }).range(line.from),
    )
  }
}

const decorateTable = (
  decorations: Range<Decoration>[],
  doc: Text,
  from: number,
  to: number,
): void => {
  const startLine = doc.lineAt(from)
  const endLine = doc.lineAt(to)

  for (let i = startLine.number; i <= endLine.number; i++) {
    const line = doc.line(i)
    const lineText = line.text

    const isSeparator = /^\|?[\s-:|]+\|?$/.test(lineText)

    if (isSeparator) {
      decorations.push(muted.range(line.from, line.to))
    } else {
      for (let j = 0; j < lineText.length; j++) {
        if (lineText[j] === '|') {
          decorations.push(muted.range(line.from + j, line.from + j + 1))
        }
      }
      if (i === startLine.number) {
        decorations.push(
          Decoration.line({ class: 'mdpad-table-header' }).range(line.from),
        )
      }
    }
    decorations.push(
      Decoration.line({ class: 'mdpad-table-line' }).range(line.from),
    )
  }
}

// ---------------------------------------------------------------------------
// Build decorations
// ---------------------------------------------------------------------------

const buildDecorations = (view: EditorView): DecorationSet => {
  const decorations: Range<Decoration>[] = []
  const tree = syntaxTree(view.state)
  const doc = view.state.doc

  // Determine frontmatter boundary to skip tree decorations inside it
  let frontmatterEnd = -1
  if (doc.lines >= 3 && doc.line(1).text.trim() === '---') {
    for (let i = 2; i <= doc.lines; i++) {
      if (doc.line(i).text.trim() === '---') {
        frontmatterEnd = doc.line(i).to
        break
      }
    }
  }

  const listItemLines = new Set<number>()

  tree.iterate({
    enter(node) {
      const { from, to, name } = node
      if (frontmatterEnd >= 0 && from < frontmatterEnd) return

      if (headingConfig[name]) {
        decorateHeading(decorations, doc, from, to, name)
        return
      }
      if (name === 'StrongEmphasis') {
        decorateStrongEmphasis(decorations, doc, from, to)
        return
      }
      if (name === 'Emphasis') {
        decorateEmphasis(decorations, doc, from, to)
        return
      }
      if (name === 'Strikethrough') {
        decorateStrikethrough(decorations, from, to)
        return
      }
      if (name === 'InlineCode') {
        decorateInlineCode(decorations, from, to)
        return
      }
      if (name === 'Link') {
        decorateLink(decorations, doc, from, to)
        return
      }
      if (name === 'Blockquote') {
        decorateBlockquote(decorations, doc, from, to)
        return
      }
      if (name === 'ListItem') {
        decorateListItem(decorations, doc, from)
        listItemLines.add(doc.lineAt(from).number)
        return
      }
      if (name === 'HorizontalRule') {
        decorateHorizontalRule(decorations, doc, from, to)
        return
      }
      if (name === 'FencedCode') {
        decorateFencedCode(decorations, doc, from, to)
        return
      }
      if (name === 'Table') {
        decorateTable(decorations, doc, from, to)
        return
      }
    },
  })

  // Fallback: decorate list markers on lines the parser missed (deeply nested)
  for (let i = 1; i <= doc.lines; i++) {
    if (listItemLines.has(i)) continue
    const line = doc.line(i)
    if (frontmatterEnd >= 0 && line.from < frontmatterEnd) continue
    decorateListItem(decorations, doc, line.from)
  }

  // Frontmatter --- block at top of document
  if (doc.lines >= 3) {
    const firstLine = doc.line(1)
    if (firstLine.text.trim() === '---') {
      decorations.push(muted.range(firstLine.from, firstLine.to))
      for (let i = 2; i <= doc.lines; i++) {
        const line = doc.line(i)
        if (line.text.trim() === '---') {
          decorations.push(muted.range(line.from, line.to))
          break
        }
        const colonIdx = line.text.indexOf(':')
        if (colonIdx !== -1 && line.from < line.to) {
          decorations.push(muted.range(line.from, line.from + colonIdx + 1))
        }
      }
    }
  }

  // Highlight ==text== (not a GFM node, requires regex pass)
  const highlightPattern = /==(.*?)==/g
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    highlightPattern.lastIndex = 0
    for (
      let match = highlightPattern.exec(line.text);
      match !== null;
      match = highlightPattern.exec(line.text)
    ) {
      const start = line.from + match.index
      const end = start + match[0].length
      decorations.push(muted.range(start, start + 2))
      decorations.push(highlightMark.range(start + 2, end - 2))
      decorations.push(muted.range(end - 2, end))
    }
  }

  decorations.sort((a, b) => a.from - b.from)
  return Decoration.set(decorations, true)
}

// ---------------------------------------------------------------------------
// ViewPlugin
// ---------------------------------------------------------------------------

export const markdownDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate): void {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.state) !== syntaxTree(update.startState)
      ) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  {
    decorations: v => v.decorations,
  },
)

// ---------------------------------------------------------------------------
// Click handlers
// ---------------------------------------------------------------------------

export const attachClickHandlers = (
  view: EditorView,
  onOpenLink: (url: string) => void,
): void => {
  view.dom.addEventListener('mousedown', e => {
    const target = e.target as HTMLElement

    // --- Checkbox toggle ---
    if (target.closest('.mdpad-task-bracket')) {
      e.preventDefault()
      e.stopPropagation()

      let pos: number
      try {
        pos = view.posAtDOM(target)
      } catch {
        return
      }

      const line = view.state.doc.lineAt(pos)
      const lineText = line.text

      const checkedPattern = /\[(x|X)\]/
      const uncheckedPattern = /\[ \]/

      let newText: string
      if (checkedPattern.test(lineText)) {
        newText = lineText.replace(checkedPattern, '[ ]')
      } else if (uncheckedPattern.test(lineText)) {
        newText = lineText.replace(uncheckedPattern, '[x]')
      } else {
        return
      }

      view.dispatch({
        changes: { from: line.from, to: line.to, insert: newText },
      })
      return
    }

    // --- Cmd/Ctrl + click link ---
    if ((e.metaKey || e.ctrlKey) && target.closest('.mdpad-link-text')) {
      e.preventDefault()
      e.stopPropagation()

      let pos: number
      try {
        pos = view.posAtDOM(target)
      } catch {
        return
      }

      const line = view.state.doc.lineAt(pos)
      const lineText = line.text

      // Find the link URL in the line
      const linkMatch = lineText.match(/\[.+?\]\((.+?)\)/)
      if (linkMatch) {
        onOpenLink(linkMatch[1])
      }
    }
  })
}
