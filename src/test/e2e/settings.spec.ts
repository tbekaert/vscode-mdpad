import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

test.describe('settings — applied on init', () => {
  test('font family is applied from settings', async ({ page }) => {
    await initEditor(page, 'text', { fontFamily: 'monospace' })
    const fontFamily = await page
      .locator('.cm-content')
      .evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('monospace')
  })

  test('line numbers hidden by default', async ({ page }) => {
    await initEditor(page, 'text')
    const count = await page.locator('.cm-lineNumbers').count()
    expect(count).toBe(0)
  })

  test('line numbers shown when enabled', async ({ page }) => {
    await initEditor(page, 'line one\nline two', { lineNumbers: true })
    const count = await page.locator('.cm-lineNumbers').count()
    expect(count).toBeGreaterThan(0)
  })

  test('custom list indent size applies to Tab', async ({ page }) => {
    await initEditor(page, '- item', { listIndentSize: 4 })
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toBe('    * item')
  })
})
