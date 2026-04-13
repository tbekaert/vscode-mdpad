import assert from 'node:assert'
import { describe, it } from 'mocha'
import { buildRow, formatTable, parseRow } from '../../webview/tableFormatter'

describe('parseRow', () => {
  it('splits piped row into trimmed cells', () => {
    assert.deepStrictEqual(parseRow('| a | b | c |'), ['a', 'b', 'c'])
  })

  it('handles no outer pipes', () => {
    assert.deepStrictEqual(parseRow('a | b'), ['a', 'b'])
  })

  it('trims whitespace from cells', () => {
    assert.deepStrictEqual(parseRow('|  foo  |  bar  |'), ['foo', 'bar'])
  })

  it('handles empty cells', () => {
    assert.deepStrictEqual(parseRow('| | b |'), ['', 'b'])
  })
})

describe('buildRow', () => {
  it('pads cells to column widths', () => {
    const result = buildRow(['a', 'bb'], [5, 5], false)
    assert.strictEqual(result, '| a     | bb    |')
  })

  it('builds separator row with dashes', () => {
    const result = buildRow(['---', '---'], [5, 5], true)
    assert.strictEqual(result, '| ----- | ----- |')
  })

  it('preserves left alignment marker', () => {
    const result = buildRow([':---', '---'], [5, 5], true)
    assert.strictEqual(result, '| :---- | ----- |')
  })

  it('preserves right alignment marker', () => {
    const result = buildRow(['---:', '---'], [5, 5], true)
    assert.strictEqual(result, '| ----: | ----- |')
  })

  it('preserves center alignment marker', () => {
    const result = buildRow([':---:', '---'], [5, 5], true)
    assert.strictEqual(result, '| :---: | ----- |')
  })
})

describe('formatTable', () => {
  it('aligns columns to max cell width', () => {
    const input = '| a | b |\n|---|---|\n| longer | x |'
    const result = formatTable(input)
    assert.strictEqual(
      result,
      '| a      | b   |\n| ------ | --- |\n| longer | x   |',
    )
  })

  it('returns null for single line', () => {
    assert.strictEqual(formatTable('| a | b |'), null)
  })

  it('returns null for no separator row', () => {
    assert.strictEqual(formatTable('| a | b |\n| c | d |'), null)
  })

  it('returns null for empty column count', () => {
    assert.strictEqual(formatTable('|\n|---|'), null)
  })

  it('normalizes rows with fewer columns', () => {
    const input = '| a | b | c |\n|---|---|---|\n| x |'
    const result = formatTable(input)
    assert.ok(result)
    const lines = result.split('\n')
    assert.strictEqual(lines[2].split('|').length - 2, 3)
  })
})
