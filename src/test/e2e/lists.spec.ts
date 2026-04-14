import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

const gotoLine = async (
  page: import('@playwright/test').Page,
  lineNum: number,
) => {
  await page.keyboard.press('Control+Home')
  for (let i = 1; i < lineNum; i++) await page.keyboard.press('ArrowDown')
}

test.describe('lists — basic indent/outdent shortcuts', () => {
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

  test('indent cycles unordered list markers: - → * → +', async ({ page }) => {
    await initEditor(page, '- item')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('  * item')
  })

  test('outdent restores list marker', async ({ page }) => {
    await initEditor(page, '  * item')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('- item')
  })
})

test.describe('lists — continuation on Enter', () => {
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

  test('Enter at end of deeply-nested ordered list continues numbering', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n  1. b\n    1. c')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('d')
    const content = await getEditorContent(page)
    expect(content).toBe('1. a\n  1. b\n    1. c\n    2. d')
  })
})

test.describe('lists — unordered deep nesting', () => {
  test('marker cycles through 5 levels: - → * → + → - → *', async ({
    page,
  }) => {
    await initEditor(page, '- item')
    await focusEditor(page)
    await gotoLine(page, 1)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('  * item')
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('    + item')
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('      - item')
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('        * item')
  })

  test('outdent from deep level cycles markers back', async ({ page }) => {
    await initEditor(page, '        * item')
    await focusEditor(page)
    await gotoLine(page, 1)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('      - item')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('    + item')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('  * item')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('- item')
  })

  test('outdent at root level stays at root', async ({ page }) => {
    await initEditor(page, '- item')
    await focusEditor(page)
    await gotoLine(page, 1)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('- item')
  })
})

test.describe('lists — ordered indent/outdent', () => {
  test('indenting item 2 of 4 renumbers siblings', async ({ page }) => {
    await initEditor(page, '1. a\n2. b\n3. c\n4. d')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n2. c\n3. d')
  })

  test('indenting into existing sublist continues numbering', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b\n  1. c')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n  2. c')
  })

  test('outdenting from sublist continues parent numbering', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n  1. b')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b')
  })

  test('round-trip: indent then outdent restores original', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b\n3. c\n4. d')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n3. c\n4. d')
  })

  test('preserves `.` suffix on indent', async ({ page }) => {
    await initEditor(page, '1. a\n2. b')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b')
  })

  test('preserves `)` suffix on indent', async ({ page }) => {
    await initEditor(page, '1) a\n2) b')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1) a\n  1) b')
  })

  test('outdenting with siblings at original level renumbers them', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n  1. b\n  2. c')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n  1. c')
  })

  test('deep nesting: outdent from 3 levels', async ({ page }) => {
    await initEditor(page, '1. a\n  1. b\n    1. c')
    await focusEditor(page)
    await gotoLine(page, 3)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n  2. c')
  })

  test('indent 3 times creates 4-level deep structure', async ({ page }) => {
    await initEditor(page, '1. item')
    await focusEditor(page)
    await gotoLine(page, 1)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('      1. item')
  })

  test('complex reorg: indent multiple items at different levels', async ({
    page,
  }) => {
    await initEditor(page, '1. a\n2. b\n3. c\n4. d')
    await focusEditor(page)

    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n2. c\n3. d')

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n  2. c\n2. d')

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n    1. c\n2. d')
  })

  test('outdent cascading renumbering', async ({ page }) => {
    await initEditor(page, '1. a\n  1. b\n  2. c\n  3. d')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n  1. c\n  2. d')
  })

  test('indent preserves ordered list and starts at 1', async ({ page }) => {
    await initEditor(page, '1. a\n2. b\n3. c')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toContain('  1. b')
    expect(content).toContain('2. c')
  })
})

test.describe('lists — task lists', () => {
  test('nested task lists with Tab/Shift+Tab', async ({ page }) => {
    await initEditor(page, '- [ ] parent\n- [ ] child')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toContain('- [ ] parent')
    expect(content.split('\n')[1]).toMatch(/^ {2}\* \[ \] child$/)
  })

  test('deep nested task lists 3 levels', async ({ page }) => {
    await initEditor(page, '- [ ] level 1\n- [ ] level 2\n- [ ] level 3')
    await focusEditor(page)

    await gotoLine(page, 2)
    await page.keyboard.press('Tab')

    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const content = await getEditorContent(page)
    const lines = content.split('\n')
    expect(lines[0]).toBe('- [ ] level 1')
    expect(lines[1]).toBe('  * [ ] level 2')
    expect(lines[2]).toBe('    + [ ] level 3')
  })
})

test.describe('lists — tab edge cases', () => {
  test('Tab on non-list line is not handled by our keymap', async ({
    page,
  }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content.startsWith('  ')).toBe(false)
  })

  test('Tab on non-list line does nothing unusual', async ({ page }) => {
    await initEditor(page, 'just text')
    await focusEditor(page)
    await page.keyboard.press('Control+End')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content.startsWith('  * ')).toBe(false)
  })

  test('Tab on empty line does nothing list-related', async ({ page }) => {
    await initEditor(page, '\n')
    await focusEditor(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content.startsWith('  * ')).toBe(false)
  })

  test('Tab preserves cursor column position', async ({ page }) => {
    await initEditor(page, '- item')
    await focusEditor(page)
    await gotoLine(page, 1)
    await page.keyboard.press('End')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toBe('  * item')
  })

  test('Tab then type continues at deeper level', async ({ page }) => {
    await initEditor(page, '- a')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('- b')
    await page.keyboard.press('Home')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toBe('- a\n  * - b')
  })
})
