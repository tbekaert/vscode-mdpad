import assert from 'node:assert'
import { describe, it } from 'mocha'
import { deriveTitle } from '../../deriveTitle'

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

  it('uses frontmatter title over heading after it', () => {
    assert.strictEqual(
      deriveTitle('---\ntitle: My Note\n---\n# Real Title'),
      'My Note',
    )
  })

  it('skips frontmatter and falls back to first content line', () => {
    assert.strictEqual(
      deriveTitle('---\ntags: test\n---\njust text'),
      'just text',
    )
  })

  it('does not treat --- in middle of doc as frontmatter', () => {
    assert.strictEqual(deriveTitle('some text\n---\nmore text'), 'some text')
  })

  it('returns "Empty note" for frontmatter-only content without title', () => {
    assert.strictEqual(deriveTitle('---\ntags: test\n---'), 'Empty note')
  })

  it('uses frontmatter title when present', () => {
    assert.strictEqual(
      deriveTitle('---\ntitle: Custom Title\n---\n# Heading'),
      'Custom Title',
    )
  })

  it('frontmatter title takes priority over heading', () => {
    assert.strictEqual(
      deriveTitle('---\ntitle: From Frontmatter\n---\n# From Heading'),
      'From Frontmatter',
    )
  })

  it('trims and truncates frontmatter title', () => {
    const long = 'a'.repeat(60)
    assert.strictEqual(
      deriveTitle(`---\ntitle: ${long}\n---`),
      long.substring(0, 50),
    )
  })

  it('falls back to heading if frontmatter has no title field', () => {
    assert.strictEqual(
      deriveTitle('---\ntags: test\n---\n# Actual Title'),
      'Actual Title',
    )
  })

  it('ignores empty frontmatter title value', () => {
    assert.strictEqual(
      deriveTitle('---\ntitle:   \n---\n# Fallback'),
      'Fallback',
    )
  })

  it('handles frontmatter title with extra whitespace', () => {
    assert.strictEqual(
      deriveTitle('---\ntitle:   Spaced Title  \n---'),
      'Spaced Title',
    )
  })

  it('does not match title: outside frontmatter', () => {
    assert.strictEqual(deriveTitle('title: Not a title\n# Heading'), 'Heading')
  })

  it('handles unclosed frontmatter gracefully', () => {
    assert.strictEqual(deriveTitle('---\ntitle: Orphan\nno closing'), 'Orphan')
  })

  it('handles frontmatter with only delimiters', () => {
    assert.strictEqual(deriveTitle('---\n---\n# After'), 'After')
  })

  describe('malformed frontmatter', () => {
    // Unterminated frontmatter without `title:` — skipFrontmatter can't find
    // a closer and returns the whole doc, so the `---` line is reported as
    // the title fallback. Pinning this behaviour so a future refactor can't
    // silently drift.
    it('unterminated frontmatter without title falls back to the --- line', () => {
      assert.strictEqual(
        deriveTitle('---\nkey: v\nbody text'),
        '---',
      )
    })

    it('two-line doc starting with --- is not treated as frontmatter', () => {
      // length < 3 short-circuits the scan, so the first non-empty line wins
      assert.strictEqual(deriveTitle('---\nbody'), '---')
    })

    it('frontmatter closer with no content between fences returns "Empty note"', () => {
      assert.strictEqual(deriveTitle('---\n---\n'), 'Empty note')
    })

    it('frontmatter title field with no value after whitespace falls through', () => {
      assert.strictEqual(
        deriveTitle('---\ntitle:\n---\nbody'),
        'body',
      )
    })
  })
})
