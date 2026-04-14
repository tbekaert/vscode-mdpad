import { expect, test } from '@playwright/test'
import {
  focusEditor,
  getCursorPos,
  getEditorContent,
  initEditor,
} from './utils'

test.describe('auto-close', () => {
  test('triple backtick inserts closing fence', async ({ page }) => {
    await initEditor(page, '')
    await focusEditor(page)
    await page.keyboard.type('```')
    const content = await getEditorContent(page)
    expect(content).toBe('```\n\n```')
  })

  test('triple backtick positions cursor on opening fence', async ({
    page,
  }) => {
    await initEditor(page, '')
    await focusEditor(page)
    await page.keyboard.type('```')
    // Cursor should be after opening ``` on line 1
    const pos = await getCursorPos(page)
    expect(pos).toBe(3)
  })

  test('triple dash at line 1 inserts closing frontmatter', async ({
    page,
  }) => {
    await initEditor(page, '')
    await focusEditor(page)
    await page.keyboard.type('---')
    const content = await getEditorContent(page)
    expect(content).toBe('---\n\n---')
  })

  test('triple dash not on line 1 does not auto-close', async ({ page }) => {
    await initEditor(page, 'some text\n')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.type('---')
    const content = await getEditorContent(page)
    // Should just be the three dashes on their own line, no auto-close
    expect(content).toBe('some text\n---')
  })

  test('single backtick does not trigger auto-close', async ({ page }) => {
    await initEditor(page, '')
    await focusEditor(page)
    await page.keyboard.type('`')
    expect(await getEditorContent(page)).toBe('`')
  })

  test('double backtick does not trigger auto-close', async ({ page }) => {
    await initEditor(page, '')
    await focusEditor(page)
    await page.keyboard.type('``')
    expect(await getEditorContent(page)).toBe('``')
  })
})
