import { syntaxTree } from '@codemirror/language'
import { type EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view'

// ---------------------------------------------------------------------------
// Table parsing
// ---------------------------------------------------------------------------

export const parseRow = (line: string): string[] => {
  // Split by `|`, trim each cell, ignore leading/trailing empty cells from outer pipes
  const raw = line.split('|')
  // Remove first and last if they're empty (from leading/trailing `|`)
  if (raw.length > 0 && raw[0].trim() === '') raw.shift()
  if (raw.length > 0 && raw[raw.length - 1].trim() === '') raw.pop()
  return raw.map(c => c.trim())
}

const isSeparatorRow = (line: string): boolean =>
  /^\|?[\s-:|]+\|?$/.test(line) && line.includes('-')

export const buildRow = (
  cells: string[],
  widths: number[],
  isSep: boolean,
): string => {
  const parts = cells.map((cell, i) => {
    const w = widths[i] || cell.length
    if (isSep) {
      // Rebuild separator: preserve alignment markers
      const stripped = cell.replace(/[^:-]/g, '')
      const left = stripped.startsWith(':')
      const right = stripped.endsWith(':')
      const inner = '-'.repeat(
        Math.max(w, 3) - (left ? 1 : 0) - (right ? 1 : 0),
      )
      return (left ? ':' : '') + inner + (right ? ':' : '')
    }
    return cell + ' '.repeat(Math.max(0, w - cell.length))
  })
  return `| ${parts.join(' | ')} |`
}

export const formatTable = (tableText: string): string | null => {
  const lines = tableText.split('\n')
  if (lines.length < 2) return null

  // Find separator row index
  const sepIdx = lines.findIndex(l => isSeparatorRow(l))
  if (sepIdx === -1) return null

  // Parse all rows
  const rows = lines.map(l => parseRow(l))

  // Determine column count from header
  const colCount = rows[0].length
  if (colCount === 0) return null

  // Calculate max width per column (excluding separator)
  const widths: number[] = Array(colCount).fill(3) // minimum 3 for `---`
  for (let i = 0; i < rows.length; i++) {
    if (i === sepIdx) continue
    for (let j = 0; j < Math.min(rows[i].length, colCount); j++) {
      widths[j] = Math.max(widths[j], rows[i][j].length)
    }
  }

  // Rebuild each row with padding
  const formatted = lines.map((_line, i) => {
    // Pad row to colCount if needed
    const cells = rows[i]
    while (cells.length < colCount) cells.push('')
    return buildRow(cells.slice(0, colCount), widths, i === sepIdx)
  })

  return formatted.join('\n')
}

// ---------------------------------------------------------------------------
// Cursor position mapping
// ---------------------------------------------------------------------------

const mapCursorPosition = (
  oldText: string,
  newText: string,
  cursorOffset: number,
  tableFrom: number,
): number => {
  const oldLines = oldText.split('\n')
  let charCount = 0
  let cursorRow = 0
  let cursorCol = 0
  let cursorInCell = 0

  for (let i = 0; i < oldLines.length; i++) {
    if (charCount + oldLines[i].length >= cursorOffset) {
      cursorRow = i
      const posInLine = cursorOffset - charCount
      const cells = oldLines[i].split('|')
      let cellStart = 0
      for (let j = 0; j < cells.length; j++) {
        const cellEnd = cellStart + cells[j].length
        if (posInLine <= cellEnd) {
          cursorCol = j
          cursorInCell = Math.min(
            posInLine - cellStart,
            cells[j].trimEnd().length,
          )
          break
        }
        cellStart = cellEnd + 1
      }
      break
    }
    charCount += oldLines[i].length + 1
  }

  const newLines = newText.split('\n')
  let newCursorPos = tableFrom
  if (cursorRow < newLines.length) {
    for (let i = 0; i < cursorRow; i++) {
      newCursorPos += newLines[i].length + 1
    }
    const newCells = newLines[cursorRow].split('|')
    let newCellStart = 0
    for (let j = 0; j < Math.min(cursorCol, newCells.length); j++) {
      newCellStart += newCells[j].length + 1
    }
    newCursorPos += Math.min(
      newCellStart + cursorInCell,
      newLines[cursorRow].length,
    )
  }

  return newCursorPos
}

// ---------------------------------------------------------------------------
// ViewPlugin — auto-format tables on change
// ---------------------------------------------------------------------------

export const tableAutoFormat = ViewPlugin.fromClass(
  class {
    private formatTimer: ReturnType<typeof setTimeout> | undefined
    private isFormatting = false

    update(update: ViewUpdate): void {
      if (!update.docChanged || this.isFormatting) return

      const changedRanges: { from: number; to: number }[] = []
      update.changes.iterChanges((_fromA, _toA, fromB, toB) => {
        changedRanges.push({ from: fromB, to: toB })
      })
      if (changedRanges.length === 0) return

      const tree = syntaxTree(update.state)
      let foundTable = false
      tree.iterate({
        enter(node) {
          if (node.name !== 'Table') return undefined
          for (const range of changedRanges) {
            if (range.from <= node.to && range.to >= node.from) {
              foundTable = true
              return false
            }
          }
          return undefined
        },
      })

      if (!foundTable) return

      if (this.formatTimer) clearTimeout(this.formatTimer)
      this.formatTimer = setTimeout(() => {
        this.doFormat(update.view)
      }, 500)
    }

    private doFormat(view: EditorView): void {
      const tree = syntaxTree(view.state)
      const doc = view.state.doc
      const cursor = view.state.selection.main.head

      const tables: { from: number; to: number }[] = []
      tree.iterate({
        enter(node) {
          if (node.name === 'Table') {
            tables.push({ from: node.from, to: node.to })
          }
        },
      })

      if (tables.length === 0) return

      const changes: { from: number; to: number; insert: string }[] = []
      let cursorTable: { from: number; to: number } | undefined
      let formattedCursorTable: string | undefined

      for (const table of tables) {
        const tableText = doc.sliceString(table.from, table.to)
        const formatted = formatTable(tableText)
        if (!formatted || formatted === tableText) continue
        changes.push({ from: table.from, to: table.to, insert: formatted })
        if (table.from <= cursor && table.to >= cursor) {
          cursorTable = table
          formattedCursorTable = formatted
        }
      }

      if (changes.length === 0) return

      let newCursorPos = cursor
      if (cursorTable && formattedCursorTable) {
        const cursorOffset = cursor - cursorTable.from
        newCursorPos = mapCursorPosition(
          doc.sliceString(cursorTable.from, cursorTable.to),
          formattedCursorTable,
          cursorOffset,
          cursorTable.from,
        )
      }

      this.isFormatting = true
      view.dispatch({
        changes,
        selection: { anchor: newCursorPos },
      })
      this.isFormatting = false
    }

    destroy(): void {
      if (this.formatTimer) clearTimeout(this.formatTimer)
    }
  },
)
