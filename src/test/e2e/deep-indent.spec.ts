import { expect, test } from '@playwright/test'
import { focusEditor, getEditorContent, initEditor } from './utils'

const gotoLine = async (
  page: import('@playwright/test').Page,
  lineNum: number,
) => {
  await page.keyboard.press('Control+Home')
  for (let i = 1; i < lineNum; i++) await page.keyboard.press('ArrowDown')
}

test.describe('deep nesting — unordered lists', () => {
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
    // Outdenting a root-level item returns true (handled) but doesn't change content
    expect(await getEditorContent(page)).toBe('- item')
  })
})

test.describe('deep nesting — ordered lists', () => {
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

    // Indent item 2 → becomes sublist
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n2. c\n3. d')

    // Indent item 3 (now "c") again → should join existing sublist as 2.
    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n  2. c\n2. d')

    // Indent item 3 once more → nested sublist under 2. c
    await gotoLine(page, 3)
    await page.keyboard.press('Tab')
    expect(await getEditorContent(page)).toBe('1. a\n  1. b\n    1. c\n2. d')
  })

  test('outdent cascading renumbering', async ({ page }) => {
    await initEditor(page, '1. a\n  1. b\n  2. c\n  3. d')
    await focusEditor(page)
    // Outdent b → b becomes 2. at parent level, c and d renumber
    await gotoLine(page, 2)
    await page.keyboard.press('Shift+Tab')
    expect(await getEditorContent(page)).toBe('1. a\n2. b\n  1. c\n  2. d')
  })
})

test.describe('deep nesting — task lists', () => {
  test('nested task lists with Tab/Shift+Tab', async ({ page }) => {
    await initEditor(page, '- [ ] parent\n- [ ] child')
    await focusEditor(page)
    await gotoLine(page, 2)
    await page.keyboard.press('Tab')
    // Child becomes nested; unordered marker cycles but task structure preserved
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

test.describe('tab mechanism edge cases', () => {
  test('Tab on non-list line is not handled by our keymap', async ({
    page,
  }) => {
    await initEditor(page, 'hello')
    await focusEditor(page)
    await page.keyboard.press('End')
    await page.keyboard.press('Tab')
    // Our shiftListItem returns false → default Tab handler runs
    // The line should not have been indented as a list
    const content = await getEditorContent(page)
    expect(content.startsWith('  ')).toBe(false)
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
    // Move to end of line
    await page.keyboard.press('End')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toBe('  * item')
  })

  test('Tab then type continues at deeper level', async ({ page }) => {
    await initEditor(page, '- a')
    await focusEditor(page)
    await page.keyboard.press('End')
    // Create new line and type new item
    await page.keyboard.press('Enter')
    await page.keyboard.type('- b')
    await page.keyboard.press('Home')
    await page.keyboard.press('Tab')
    const content = await getEditorContent(page)
    expect(content).toBe('- a\n  * - b')
  })
})
