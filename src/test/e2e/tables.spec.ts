import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

const pasteText = async (
  page: import('@playwright/test').Page,
  text: string,
) => {
  await page.evaluate(pastedText => {
    const target = document.querySelector('.cm-content') as HTMLElement
    const event = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
      bubbles: true,
      cancelable: true,
    })
    event.clipboardData?.setData('text/plain', pastedText)
    target.dispatchEvent(event)
  }, text)
}

test.describe('table auto-formatting', () => {
  test('misaligned table gets columns aligned after debounce', async ({
    page,
  }) => {
    await initEditor(page, '')
    await focusEditor(page)
    const messy = '|a|bb|c|\n|-|-|-|\n|1|2|3|'
    await pasteText(page, messy)
    // Table formatter debounces at 500ms
    await page.waitForTimeout(700)
    const content = await getEditorContent(page)
    // Formatter uses minimum separator width of 3 (--- per column)
    expect(content).toContain('| a   | bb  | c   |')
    expect(content).toContain('| --- | --- | --- |')
    expect(content).toContain('| 1   | 2   | 3   |')
  })

  test('wider content expands column width', async ({ page }) => {
    await initEditor(page, '')
    await focusEditor(page)
    const messy = '|name|score|\n|-|-|\n|alice|100|'
    await pasteText(page, messy)
    await page.waitForTimeout(700)
    const content = await getEditorContent(page)
    // "alice" is 5 chars, "score" is 5 chars — columns should fit widest
    expect(content).toContain('| name  | score |')
    expect(content).toContain('| alice | 100   |')
  })

  test('table pasted into existing content gets formatted', async ({
    page,
  }) => {
    await initEditor(page, '# My note\n\nSome text before\n\n')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    const messy = '|a|bb|c|\n|-|-|-|\n|1|2|3|'
    await pasteText(page, messy)
    await page.waitForTimeout(700)
    const content = await getEditorContent(page)
    expect(content).toContain('| a   | bb  | c   |')
    expect(content).toContain('| --- | --- | --- |')
    expect(content).toContain('| 1   | 2   | 3   |')
  })

  test('table pasted between blank-line-separated content gets formatted', async ({
    page,
  }) => {
    // Realistic case: paste a table between content with blank lines around the paste position
    await initEditor(page, 'before\n\n\n\nafter')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    // Move to the middle empty line (line 3)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    const messy = '|a|bb|c|\n|-|-|-|\n|1|2|3|'
    await pasteText(page, messy)
    await page.waitForTimeout(700)
    const content = await getEditorContent(page)
    expect(content).toContain('| a   | bb  | c   |')
    expect(content).toContain('| --- | --- | --- |')
    expect(content).toContain('| 1   | 2   | 3   |')
    // before/after should remain untouched
    expect(content).toContain('before\n')
    expect(content).toContain('\nafter')
  })

  test('table inside larger pasted content gets formatted', async ({
    page,
  }) => {
    // Reproduces the case where a table is in the middle of a larger paste
    // The cursor ends up after the table, not inside it
    await initEditor(page, '')
    await focusEditor(page)
    const content = `# Header

Some intro text

|a|bb|c|
|-|-|-|
|1|2|3|

Some trailing text
`
    await pasteText(page, content)
    await page.waitForTimeout(700)
    const result = await getEditorContent(page)
    expect(result).toContain('| a   | bb  | c   |')
    expect(result).toContain('| --- | --- | --- |')
    expect(result).toContain('| 1   | 2   | 3   |')
  })

  test('typing in table cell triggers realignment', async ({ page }) => {
    await initEditor(page, '| a   | b   |\n| --- | --- |\n| 1   | 2   |')
    await focusEditor(page)
    // Go to end of first cell "a"
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    // Type content that widens the column
    await page.keyboard.type('long')
    await page.waitForTimeout(700)
    const content = await getEditorContent(page)
    // The first cell grew, separator and data rows should realign
    expect(content).toContain('along')
    // All pipe-separated rows should have consistent column widths
    const lines = content.split('\n').filter(l => l.startsWith('|'))
    const widths = lines.map(l => l.length)
    expect(new Set(widths).size).toBe(1)
  })
})
