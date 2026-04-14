import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

const gotoLine = async (
  page: import('@playwright/test').Page,
  lineNum: number,
) => {
  await page.keyboard.press('Control+Home')
  for (let i = 1; i < lineNum; i++) await page.keyboard.press('ArrowDown')
}

test.describe('decorations', () => {
  test('bold text gets mdpad-bold class', async ({ page }) => {
    await initEditor(page, '**bold text**')
    await expect(page.locator('.mdpad-bold').first()).toHaveText('bold text')
  })

  test('italic text gets mdpad-italic class', async ({ page }) => {
    await initEditor(page, '*italic*')
    await expect(page.locator('.mdpad-italic').first()).toHaveText('italic')
  })

  test('strikethrough gets mdpad-strike class', async ({ page }) => {
    await initEditor(page, '~~strike~~')
    await expect(page.locator('.mdpad-strike').first()).toHaveText('strike')
  })

  test('inline code gets mdpad-inline-code class', async ({ page }) => {
    await initEditor(page, '`code`')
    await expect(page.locator('.mdpad-inline-code').first()).toHaveText('code')
  })

  test('highlight gets mdpad-highlight class', async ({ page }) => {
    await initEditor(page, '==highlighted==')
    await expect(page.locator('.mdpad-highlight').first()).toHaveText(
      'highlighted',
    )
  })

  test('heading 1 gets mdpad-heading-1 class', async ({ page }) => {
    await initEditor(page, '# heading')
    await expect(page.locator('.mdpad-heading-1')).toHaveText('heading')
  })

  test('heading 2 gets mdpad-heading-2 class', async ({ page }) => {
    await initEditor(page, '## heading')
    await expect(page.locator('.mdpad-heading-2')).toHaveText('heading')
  })

  test('markdown syntax is muted', async ({ page }) => {
    await initEditor(page, '# heading')
    const mutedCount = await page.locator('.mdpad-muted').count()
    expect(mutedCount).toBeGreaterThan(0)
  })

  test('link text is decorated', async ({ page }) => {
    await initEditor(page, '[link text](https://example.com)')
    await expect(page.locator('.mdpad-link-text').first()).toHaveText(
      'link text',
    )
  })

  test('task list checkbox is decorated', async ({ page }) => {
    await initEditor(page, '- [ ] task')
    await expect(page.locator('.mdpad-task-bracket').first()).toHaveText('[ ]')
  })

  test('checked task has strikethrough class', async ({ page }) => {
    await initEditor(page, '- [x] done')
    await expect(page.locator('.mdpad-task-checked').first()).toHaveText('done')
  })

  test('unordered list marker is decorated', async ({ page }) => {
    await initEditor(page, '- item')
    const bulletCount = await page.locator('.mdpad-list-bullet').count()
    expect(bulletCount).toBeGreaterThan(0)
  })

  test('numbered list marker is muted', async ({ page }) => {
    await initEditor(page, '1. item')
    const mutedCount = await page.locator('.mdpad-muted').count()
    expect(mutedCount).toBeGreaterThan(0)
  })

  test('supports `)` suffix for ordered lists', async ({ page }) => {
    await initEditor(page, '1) item')
    const mutedCount = await page.locator('.mdpad-muted').count()
    expect(mutedCount).toBeGreaterThan(0)
  })

  test('3-level nested ordered list has muted markers on all levels', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b\n3. c')
    await focusEditor(page)

    await gotoLine(page, 2)
    await page.keyboard.press('Tab')

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')

    const content = await getEditorContent(page)
    expect(content).toBe('1. a\n  1. b\n    1. c')

    const lines = await page.locator('.cm-line').all()
    expect(lines.length).toBe(3)

    for (let i = 0; i < 3; i++) {
      const lineText = await lines[i].textContent()
      const mutedInLine = await lines[i].locator('.mdpad-muted').count()
      expect(
        mutedInLine,
        `line ${i + 1} (${lineText}) should have muted marker`,
      ).toBeGreaterThan(0)
    }
  })

  test('blockquote gets mdpad-blockquote class', async ({ page }) => {
    await initEditor(page, '> quoted')
    const blockquoteCount = await page.locator('.mdpad-blockquote').count()
    expect(blockquoteCount).toBeGreaterThan(0)
  })

  test('frontmatter keys are muted', async ({ page }) => {
    await initEditor(page, '---\ntitle: Test\n---\n\ncontent')
    const mutedCount = await page.locator('.mdpad-muted').count()
    expect(mutedCount).toBeGreaterThan(0)
  })
})
