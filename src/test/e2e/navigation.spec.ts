import { expect, test } from '@playwright/test'
import { focusEditor, getCursorPos, initEditor } from './utils'

test.describe('navigation', () => {
  test('arrow down moves cursor one line forward', async ({ page }) => {
    await initEditor(page, 'line one\nline two\nline three')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    const startPos = await getCursorPos(page)
    await page.keyboard.press('ArrowDown')
    const nextPos = await getCursorPos(page)
    expect(nextPos).toBeGreaterThan(startPos)
    expect(nextPos).toBeLessThanOrEqual('line one\n'.length + 'line two'.length)
  })

  test('arrow down through headings does not skip lines', async ({ page }) => {
    await initEditor(page, '# heading\nbody 1\n## sub\nbody 2\nbody 3')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    const positions: number[] = []
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown')
      positions.push(await getCursorPos(page))
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1])
    }
  })

  test('arrow up then down returns to same position', async ({ page }) => {
    await initEditor(page, 'line one\nline two\nline three')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowDown')
    const middlePos = await getCursorPos(page)
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowDown')
    const finalPos = await getCursorPos(page)
    expect(finalPos).toBe(middlePos)
  })

  test('cursor navigation works when scrolled', async ({ page }) => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n')
    await initEditor(page, lines)
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    const positions: number[] = []
    for (let i = 0; i < 5; i++) {
      positions.push(await getCursorPos(page))
      await page.keyboard.press('ArrowUp')
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeLessThan(positions[i - 1])
    }
  })
})
