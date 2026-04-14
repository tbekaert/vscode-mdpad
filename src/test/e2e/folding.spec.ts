import { expect, test } from '@playwright/test'
import { initEditor } from './utils'

test.describe('folding', () => {
  test('fold chevron appears on H2 when folding is enabled', async ({
    page,
  }) => {
    await initEditor(page, '# title\n\n## section\n\ncontent', {
      folding: true,
    })
    const count = await page.locator('.mdpad-foldable').count()
    expect(count).toBeGreaterThan(0)
  })

  test('no fold chevron when folding is disabled', async ({ page }) => {
    await initEditor(page, '## section\n\ncontent', { folding: false })
    const count = await page.locator('.mdpad-foldable').count()
    expect(count).toBe(0)
  })

  test('no fold chevron on H1', async ({ page }) => {
    await initEditor(page, '# h1\n\ncontent', { folding: true })
    // H1 line should not have the foldable class
    const h1Line = page.locator('.cm-line', { hasText: 'h1' }).first()
    const classes = await h1Line.getAttribute('class')
    expect(classes).not.toContain('mdpad-foldable')
  })

  test('no fold chevron when heading has no content', async ({ page }) => {
    await initEditor(page, '## empty section', { folding: true })
    const count = await page.locator('.mdpad-foldable').count()
    expect(count).toBe(0)
  })

  test('frontmatter is foldable', async ({ page }) => {
    await initEditor(page, '---\ntitle: test\n---\n\ncontent', {
      folding: true,
    })
    const count = await page.locator('.mdpad-foldable').count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('settings-driven behavior', () => {
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
    const { focusEditor, getEditorContent } = await import('./utils')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toBe('    * item')
  })
})
