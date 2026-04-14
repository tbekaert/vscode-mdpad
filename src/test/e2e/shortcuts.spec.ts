import { expect, test } from '@playwright/test'
import { focusEditor, initEditor } from './utils'

test.describe('shortcuts', () => {
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

  test('Tab indents list item', async ({ page }) => {
    await initEditor(page, '- first\n- second')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Home')
    await page.keyboard.press('Tab')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('  * second')
  })

  test('Shift+Tab outdents list item', async ({ page }) => {
    await initEditor(page, '- first\n  * second')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+Tab')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('- second')
  })
})
