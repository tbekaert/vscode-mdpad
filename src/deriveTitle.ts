export const deriveTitle = (content: string): string => {
  const lines = content.split('\n')
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
