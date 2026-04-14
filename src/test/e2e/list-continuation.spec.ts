import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

test.describe('list continuation on Enter', () => {
  test('Enter on unordered list line inserts new marker', async ({ page }) => {
    await initEditor(page, '- first')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('second')
    expect(await getEditorContent(page)).toBe('- first\n- second')
  })

  test('Enter on ordered list line inserts incremented number', async ({
    page,
  }) => {
    await initEditor(page, '1. first')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('second')
    expect(await getEditorContent(page)).toBe('1. first\n2. second')
  })

  test('Enter on task list inserts new empty task', async ({ page }) => {
    await initEditor(page, '- [x] done')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('next')
    const content = await getEditorContent(page)
    expect(content).toBe('- [x] done\n- [ ] next')
  })

  test('Enter preserves indentation for nested lists', async ({ page }) => {
    await initEditor(page, '- a\n  * b')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('c')
    expect(await getEditorContent(page)).toBe('- a\n  * b\n  * c')
  })

  test('Enter on empty list item clears the marker', async ({ page }) => {
    await initEditor(page, '- first\n- ')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Enter')
    const content = await getEditorContent(page)
    // After pressing Enter on empty `- ` line, the marker is cleared
    // We should be on a plain line now (no `- ` prefix on the cursor's line)
    expect(content).not.toContain('- \n')
  })

  test('ordered list continues numbering when appending at end', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('c')
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n3. c')
  })
})
