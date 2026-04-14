export interface SearchMatch {
  line: string
  lineNum: number
  cursorPos: number
}

export const MIN_QUERY_LENGTH = 2
export const MAX_RESULTS = 50

export const searchLines = (
  content: string,
  query: string,
  maxResults = MAX_RESULTS,
): SearchMatch[] => {
  if (query.length < MIN_QUERY_LENGTH) return []
  const lower = query.toLowerCase()
  const results: SearchMatch[] = []
  const lines = content.split('\n')
  let offset = 0
  for (let i = 0; i < lines.length; i++) {
    const col = lines[i].toLowerCase().indexOf(lower)
    if (col !== -1) {
      results.push({
        line: lines[i].trim(),
        lineNum: i + 1,
        cursorPos: offset + col + query.length,
      })
      if (results.length >= maxResults) return results
    }
    offset += lines[i].length + 1
  }
  return results
}
