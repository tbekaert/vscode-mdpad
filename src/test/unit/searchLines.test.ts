import assert from 'node:assert'
import { describe, it } from 'mocha'
import { MAX_RESULTS, MIN_QUERY_LENGTH, searchLines } from '../../searchLines'

describe('searchLines', () => {
  it('finds a match on a single line', () => {
    const results = searchLines('hello world', 'world')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].line, 'hello world')
    assert.strictEqual(results[0].lineNum, 1)
    assert.strictEqual(results[0].cursorPos, 11)
  })

  it('finds matches across multiple lines', () => {
    const results = searchLines('foo\nbar\nfoo again', 'foo')
    assert.strictEqual(results.length, 2)
    assert.strictEqual(results[0].lineNum, 1)
    assert.strictEqual(results[1].lineNum, 3)
  })

  it('is case insensitive', () => {
    const results = searchLines('Hello World', 'hello')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].line, 'Hello World')
  })

  it('returns empty array for no matches', () => {
    const results = searchLines('hello world', 'xyz')
    assert.strictEqual(results.length, 0)
  })

  it('returns empty array for empty query', () => {
    const results = searchLines('hello world', '')
    assert.strictEqual(results.length, 0)
  })

  it('returns empty array for single-character query', () => {
    const results = searchLines('hello world', 'h')
    assert.strictEqual(results.length, 0)
  })

  it('matches with minimum query length', () => {
    const results = searchLines('hello world', 'he')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(MIN_QUERY_LENGTH, 2)
  })

  it('computes cursorPos at end of match', () => {
    const results = searchLines('abc\ndef ghi', 'ghi')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].cursorPos, 11)
  })

  it('trims the line text in results', () => {
    const results = searchLines('  indented text  ', 'indented')
    assert.strictEqual(results[0].line, 'indented text')
  })

  it('only returns first match per line', () => {
    const results = searchLines('foo foo foo', 'foo')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].cursorPos, 3)
  })

  it('respects maxResults parameter', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i} match`)
    const content = lines.join('\n')
    const results = searchLines(content, 'match', 5)
    assert.strictEqual(results.length, 5)
  })

  it('defaults to MAX_RESULTS cap', () => {
    const lines = Array.from(
      { length: MAX_RESULTS + 20 },
      (_, i) => `line ${i} test`,
    )
    const content = lines.join('\n')
    const results = searchLines(content, 'test')
    assert.strictEqual(results.length, MAX_RESULTS)
  })
})
