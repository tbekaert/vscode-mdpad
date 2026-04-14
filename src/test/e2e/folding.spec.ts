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
