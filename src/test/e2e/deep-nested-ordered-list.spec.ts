import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

const gotoLine = async (
  page: import('@playwright/test').Page,
  lineNum: number,
) => {
  await page.keyboard.press('Control+Home')
  for (let i = 1; i < lineNum; i++) await page.keyboard.press('ArrowDown')
}

test.describe('deep-nested ordered list (3+ levels)', () => {
  test('3-level nested ordered list has muted markers on all levels', async ({
    page,
  }) => {
    // Build up: 1.a / 2.b / 3.c → tab 2 → tab 3 twice → should produce 3 levels
    await initEditor(page, '1. a\n2. b\n3. c')
    await focusEditor(page)

    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    // Now: 1. a / __1. b / 2. c

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    // Now: 1. a / __1. b / __2. c

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    // Now: 1. a / __1. b / ____1. c

    const content = await getEditorContent(page)
    expect(content).toBe('1. a\n  1. b\n    1. c')

    // All 3 ordered list markers should be muted
    // Count muted decorations — each ordered marker contributes to the muted count
    // Expected: "1." at each of 3 levels, plus " " after each = 3 muted ranges for markers
    // We verify by looking at each line for a muted span on the number
    const lines = await page.locator('.cm-line').all()
    expect(lines.length).toBe(3)

    // Each line with an ordered list marker should contain a .mdpad-muted span
    // that covers the number
    for (let i = 0; i < 3; i++) {
      const lineText = await lines[i].textContent()
      const mutedInLine = await lines[i].locator('.mdpad-muted').count()
      expect(
        mutedInLine,
        `line ${i + 1} (${lineText}) should have muted marker`,
      ).toBeGreaterThan(0)
    }
  })

  test('Enter at end of deeply-nested ordered list continues numbering', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n  1. b\n    1. c')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('d')
    const content = await getEditorContent(page)
    expect(content).toBe('1. a\n  1. b\n    1. c\n    2. d')
  })
})
