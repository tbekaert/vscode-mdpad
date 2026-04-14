import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

test.describe('shortcuts — wrapping', () => {
  test('Ctrl+B wraps selection with **', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+b')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('**hello**')
  })

  test('Ctrl+I wraps selection with *', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+i')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('*hello*')
  })

  test('Ctrl+Shift+X wraps selection with ~~', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+Shift+x')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('~~hello~~')
  })

  test('Ctrl+Shift+` wraps selection with backticks', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+Shift+`')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('`hello`')
  })

  test('Ctrl+Shift+E wraps selection with ==', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+Shift+e')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('==hello==')
  })

  test('Ctrl+B with no selection inserts empty markers', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Control+b')
    expect(await getEditorContent(page)).toBe('hello****')
  })
})

test.describe('shortcuts — unwrapping', () => {
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
    await page.keyboard.press('Control+Home')
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Control+i')
    expect(await getEditorContent(page)).toBe('hello')
  })
})

test.describe('shortcuts — headings', () => {
  test('Ctrl+Shift+H cycles heading level', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+Shift+h')
    const content1 = await page.locator('.cm-content').textContent()
    expect(content1).toContain('# hello')

    await page.keyboard.press('Control+Shift+h')
    const content2 = await page.locator('.cm-content').textContent()
    expect(content2).toContain('## hello')
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
})
