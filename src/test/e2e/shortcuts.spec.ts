import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor, sendMessage } from './utils'

// Formatting shortcuts are routed through the VS Code extension host via
// package.json keybindings. These tests exercise the webview's end of that
// protocol: dispatching a `command` message and asserting the resulting doc.

test.describe('command protocol — wrapping', () => {
  test('toggleBold wraps selection with **', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await sendMessage(page, { type: 'command', command: 'toggleBold' })
    expect(await getEditorContent(page)).toBe('**hello**')
  })

  test('toggleItalic wraps selection with *', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await sendMessage(page, { type: 'command', command: 'toggleItalic' })
    expect(await getEditorContent(page)).toBe('*hello*')
  })

  test('toggleStrikethrough wraps selection with ~~', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await sendMessage(page, {
      type: 'command',
      command: 'toggleStrikethrough',
    })
    expect(await getEditorContent(page)).toBe('~~hello~~')
  })

  test('toggleCode wraps selection with backticks', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await sendMessage(page, { type: 'command', command: 'toggleCode' })
    expect(await getEditorContent(page)).toBe('`hello`')
  })

  test('toggleHighlight wraps selection with ==', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await sendMessage(page, { type: 'command', command: 'toggleHighlight' })
    expect(await getEditorContent(page)).toBe('==hello==')
  })

  test('toggleBold with no selection inserts empty markers', async ({
    page,
  }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('End')
    await sendMessage(page, { type: 'command', command: 'toggleBold' })
    expect(await getEditorContent(page)).toBe('hello****')
  })
})

test.describe('command protocol — unwrapping', () => {
  test('toggleBold unwraps already-bold selection', async ({ page }) => {
    await initEditor(page, '**hello**')
    await focusEditor(page)
    await page.keyboard.press('Control+a')
    await sendMessage(page, { type: 'command', command: 'toggleBold' })
    expect(await getEditorContent(page)).toBe('hello')
  })

  test('toggleItalic unwraps italic when cursor is inside', async ({
    page,
  }) => {
    await initEditor(page, '*hello*')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
    await sendMessage(page, { type: 'command', command: 'toggleItalic' })
    expect(await getEditorContent(page)).toBe('hello')
  })
})

test.describe('command protocol — headings', () => {
  test('toggleHeading cycles heading level', async ({ page }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await sendMessage(page, { type: 'command', command: 'toggleHeading' })
    expect(await getEditorContent(page)).toBe('# hello')

    await sendMessage(page, { type: 'command', command: 'toggleHeading' })
    expect(await getEditorContent(page)).toBe('## hello')
  })

  test('toggleHeading cycles H1 → H2 → H3 → plain', async ({ page }) => {
    await initEditor(page, 'text')
    await focusEditor(page)

    await sendMessage(page, { type: 'command', command: 'toggleHeading' })
    expect(await getEditorContent(page)).toBe('# text')

    await sendMessage(page, { type: 'command', command: 'toggleHeading' })
    expect(await getEditorContent(page)).toBe('## text')

    await sendMessage(page, { type: 'command', command: 'toggleHeading' })
    expect(await getEditorContent(page)).toBe('### text')

    await sendMessage(page, { type: 'command', command: 'toggleHeading' })
    expect(await getEditorContent(page)).toBe('text')
  })
})
