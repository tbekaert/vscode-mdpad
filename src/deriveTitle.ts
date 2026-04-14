const extractFrontmatterTitle = (lines: string[]): string | undefined => {
  if (lines.length < 3 || lines[0].trim() !== '---') return undefined
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return undefined
    const match = lines[i].match(/^title:\s*(.+)/)
    if (match) return match[1].trim().substring(0, 50)
  }
  return undefined
}

const skipFrontmatter = (lines: string[]): string[] => {
  if (lines.length < 3 || lines[0].trim() !== '---') return lines
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1)
    }
  }
  return lines
}

export const deriveTitle = (content: string): string => {
  const allLines = content.split('\n')
  const frontmatterTitle = extractFrontmatterTitle(allLines)
  if (frontmatterTitle) return frontmatterTitle
  const lines = skipFrontmatter(allLines)
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+)/)
    if (heading) {
      return heading[1].trim().substring(0, 50)
    }
  }
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      return trimmed.substring(0, 50)
    }
  }
  return 'Empty note'
}
