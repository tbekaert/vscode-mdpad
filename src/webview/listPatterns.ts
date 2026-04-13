export const LIST_INDENT = '  '
export const LIST_INDENT_SIZE = LIST_INDENT.length

export const listPattern = /^(\s*)([-*+]|\d+[.)])\s/
export const olPattern = /^(\s*)(\d+)([.)])\s/
export const ulPattern = /^(\s*)([-*+])(\s+)/
export const ulMarkers = ['-', '*', '+']
