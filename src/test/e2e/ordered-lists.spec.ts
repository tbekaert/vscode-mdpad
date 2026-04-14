import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

const gotoLine = async (
  page: import('@playwright/test').Page,
  lineNum: number,
) => {
  await page.keyboard.press('Control+Home')
  for (let i = 1; i < lineNum; i++) await page.keyboard.press('ArrowDown')
}

test.describe('ordered list decorations', () => {
  test('numbered list marker is muted', async ({ page }) => {
    await initEditor(page, '1. item')
    // Marker "1." is muted (same class as other syntax markers)
    const mutedCount = await page.locator('.mdpad-muted').count()
    expect(mutedCount).toBeGreaterThan(0)
  })

  test('supports `)` suffix for ordered lists', async ({ page }) => {
    await initEditor(page, '1) item')
    const mutedCount = await page.locator('.mdpad-muted').count()
    expect(mutedCount).toBeGreaterThan(0)
  })
})

test.describe('ordered list indent/outdent', () => {
  test('indenting item 2 of 4 renumbers siblings', async ({ page }) => {
    await initEditor(page, '1. a\n2. b\n3. c\n4. d')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    // Item 2 becomes 1. in sublist, remaining renumber
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n2. c\n3. d')
  })

  test('indenting into existing sublist continues numbering', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b\n  1. c')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    // Item b joins the sublist → should become 1. b, and existing 1. c becomes 2. c
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n  2. c')
  })

  test('outdenting from sublist continues parent numbering', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n  1. b')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b')
  })

  test('round-trip: indent then outdent restores original', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b\n3. c\n4. d')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n3. c\n4. d')
  })

  test('preserves `.` suffix on indent', async ({ page }) => {
    await initEditor(page, '1. a\n2. b')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b')
  })

  test('preserves `)` suffix on indent', async ({ page }) => {
    await initEditor(page, '1) a\n2) b')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1) a\n  1) b')
  })

  test('outdenting with siblings at original level renumbers them', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n  1. b\n  2. c')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Shift+Tab')
    // b moves up to parent level as 2., remaining c becomes 1. at sublist
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n  1. c')
  })

  test('deep nesting: 3 levels', async ({ page }) => {
    await initEditor(page, '1. a\n  1. b\n    1. c')
    await focusEditor(page)
    await gotoLine(page, 3)
    await page.keyboard.press('Shift+Tab')
    // c outdents to sublist level as 2.
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n  2. c')
  })
})
