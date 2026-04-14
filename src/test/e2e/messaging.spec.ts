import { expect, test } from '@playwright/test'
import {
  clearPostedMessages,
  focusEditor,
  getCursorPos,
  getPostedMessages,
  initEditor,
  openHarness,
  sendMessage,
} from './utils'

test.describe('messaging', () => {
  test('posts ready message on load', async ({ page }) => {
    await openHarness(page)
    await page.waitForTimeout(200)
    const posted = await getPostedMessages(page)
    expect(posted.some(m => m.type === 'ready')).toBe(true)
  })

  test('init message sets content', async ({ page }) => {
    await initEditor(page, 'hello world')
    const content = await page.locator('.cm-content').textContent()
    expect(content).toContain('hello world')
  })

  test('settings message applies font family', async ({ page }) => {
    await initEditor(page, 'text', { fontFamily: 'monospace' })
    const fontFamily = await page
      .locator('.cm-content')
      .evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily).toContain('monospace')
  })

  test('setCursor message moves cursor', async ({ page }) => {
    await initEditor(page, 'hello world')
    await sendMessage(page, { type: 'setCursor', pos: 5 })
    await page.waitForTimeout(100)
    const pos = await getCursorPos(page)
    expect(pos).toBe(5)
  })

  test('typing triggers updateContent after debounce', async ({ page }) => {
    await initEditor(page, '')
    await focusEditor(page)
    await clearPostedMessages(page)
    await page.keyboard.type('hello')
    await page.waitForTimeout(700)
    const posted = await getPostedMessages(page)
    const updates = posted.filter(m => m.type === 'updateContent')
    expect(updates.length).toBeGreaterThan(0)
    expect(updates[updates.length - 1].content).toBe('hello')
  })
})
