import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

test.describe('shortcut edge cases', () => {
  test('Ctrl+B unwraps already-bold selection', async ({ page }) => {
    await initEditor(page, '**hello**')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+b')
    expect(await getEditorContent(page)).toBe('hello')
  })

  test('Ctrl+I unwraps italic when cursor is inside', async ({ page }) => {
    await initEditor(page, '*hello*')
    await focusEditor(page)
    // Move cursor to position 3 (inside "hello")
    await page.keyboard.press('Control+Home')
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Control+i')
    expect(await getEditorContent(page)).toBe('hello')
  })

  test('Ctrl+B with no selection inserts empty markers', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Control+b')
    expect(await getEditorContent(page)).toBe('hello****')
  })

  test('Ctrl+Shift+H cycles H1 → H2 → H3 → plain', async ({ page }) => {
    await initEditor(page, 'text')
    await focusEditor(page)

    await page.keyboard.press('Control+Shift+h')
    expect(await getEditorContent(page)).toBe('# text')

    await page.keyboard.press('Control+Shift+h')
    expect(await getEditorContent(page)).toBe('## text')

    await page.keyboard.press('Control+Shift+h')
    expect(await getEditorContent(page)).toBe('### text')

    await page.keyboard.press('Control+Shift+h')
    expect(await getEditorContent(page)).toBe('text')
  })

  test('Tab on non-list line does nothing unusual', async ({ page }) => {
    await initEditor(page, 'just text')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    // Default Tab behavior may insert whitespace; just verify content wasn't list-indented
    expect(content.startsWith('  * ')).toBe(false)
  })

  test('indent cycles unordered list markers: - → * → +', async ({ page }) => {
    await initEditor(page, '- item')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('  * item')
  })

  test('indent preserves ordered list and starts at 1', async ({ page }) => {
    await initEditor(page, '1. a\n2. b\n3. c')
    await focusEditor(page)
    // Move cursor to line 2
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    // Line 2 "b" becomes "  1. b", and remaining "c" renumbers to "2. c"
    expect(content).toContain('  1. b')
    expect(content).toContain('2. c')
  })

  test('outdent restores list marker', async ({ page }) => {
    await initEditor(page, '  * item')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('- item')
  })
})
