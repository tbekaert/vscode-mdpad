import assert from 'node:assert'
import { describe, it } from 'mocha'
import { isLinkable } from '../../webview/editor'

describe('isLinkable', () => {
  it('matches http URLs', () => {
    assert.strictEqual(isLinkable('http://example.com'), true)
  })

  it('matches https URLs', () => {
    assert.strictEqual(isLinkable('https://example.com/page'), true)
  })

  it('matches file paths with extensions', () => {
    assert.strictEqual(isLinkable('src/foo.ts'), true)
    assert.strictEqual(isLinkable('./README.md'), true)
    assert.strictEqual(isLinkable('../styles.css'), true)
    assert.strictEqual(isLinkable('file.json'), true)
  })

  it('matches paths with trailing whitespace', () => {
    assert.strictEqual(isLinkable('src/foo.ts  '), true)
  })

  it('rejects plain text', () => {
    assert.strictEqual(isLinkable('hello world'), false)
    assert.strictEqual(isLinkable('some random text'), false)
  })

  it('rejects text without a file extension', () => {
    assert.strictEqual(isLinkable('Makefile'), false)
    assert.strictEqual(isLinkable('src/folder/'), false)
  })
})
