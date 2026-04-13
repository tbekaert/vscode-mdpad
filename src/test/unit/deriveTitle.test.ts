import assert from 'node:assert'
import { describe, it } from 'mocha'
import { deriveTitle } from '../../webview/toolbar'

describe('deriveTitle', () => {
  it('returns first # heading text', () => {
    assert.strictEqual(deriveTitle('# Hello World'), 'Hello World')
  })

  it('returns ## heading (not just H1)', () => {
    assert.strictEqual(deriveTitle('## Second Level'), 'Second Level')
  })

  it('ignores # without space (not a heading)', () => {
    assert.strictEqual(deriveTitle('#notaheading\nactual text'), '#notaheading')
  })

  it('falls back to first non-empty line when no heading', () => {
    assert.strictEqual(
      deriveTitle('just some text\nmore text'),
      'just some text',
    )
  })

  it('skips empty lines before finding content', () => {
    assert.strictEqual(deriveTitle('\n\n\nthird line'), 'third line')
  })

  it('truncates to 50 characters', () => {
    const long = 'a'.repeat(60)
    assert.strictEqual(deriveTitle(`# ${long}`), long.substring(0, 50))
  })

  it('returns "Empty note" for empty string', () => {
    assert.strictEqual(deriveTitle(''), 'Empty note')
  })

  it('returns "Empty note" for whitespace-only', () => {
    assert.strictEqual(deriveTitle('   \n  \n  '), 'Empty note')
  })
})
