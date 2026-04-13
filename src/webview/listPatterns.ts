export let LIST_INDENT = '  '
export let LIST_INDENT_SIZE = 2

export const setListIndent = (size: number): void => {
  LIST_INDENT_SIZE = size
  LIST_INDENT = ' '.repeat(size)
}

export const listPattern = /^(\s*)([-*+]|\d+[.)])\s/
export const olPattern = /^(\s*)(\d+)([.)])\s/
export const ulPattern = /^(\s*)([-*+])(\s+)/
export const ulMarkers = ['-', '*', '+']
