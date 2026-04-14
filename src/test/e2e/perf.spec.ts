import { expect, test } from '@playwright/test'
import { focusEditor, initEditor } from './utils'

// Perf budget: typing a single character into a large document must round-trip
// through CodeMirror dispatch + decoration rebuild in under BUDGET_MS on CI
// hardware. A regression (e.g. O(n²) scan in decorations) will blow this.
//
// Measured on local dev machines the current build lands around 5–15ms. We
// leave generous headroom so the test is reliable in CI rather than flaky.
const BUDGET_MS = 50
const DOC_LINES = 5000

const buildLargeDoc = (lines: number): string => {
  // Mix of plain text, headings, lists, and a fenced code block so the
  // decoration builder exercises every branch (not just trivial prose).
  const chunks: string[] = []
  for (let i = 0; i < lines; i++) {
    const mod = i % 20
    if (mod === 0) chunks.push(`## Section ${i / 20}`)
    else if (mod === 5) chunks.push(`- bullet with **bold** and *italic* ${i}`)
    else if (mod === 10) chunks.push(`1. ordered item ${i}`)
    else if (mod === 15) chunks.push(`> quote line ${i}`)
    else chunks.push(`plain line ${i} with [a link](./foo.md) and ==mark==`)
  }
  return chunks.join('\n')
}

test.describe('perf', () => {
  test(`single-keystroke dispatch stays under ${BUDGET_MS}ms on a ${DOC_LINES}-line doc`, async ({
    page,
  }) => {
    await initEditor(page, buildLargeDoc(DOC_LINES))
    await focusEditor(page)

    // Move caret to end of doc so the insert happens in a fully-decorated region
    await page.evaluate(() => {
      const view = (
        window as unknown as {
          __mdpadView?: {
            state: { doc: { length: number } }
            dispatch: (spec: unknown) => void
          }
        }
      ).__mdpadView
      if (!view) throw new Error('editor not ready')
      view.dispatch({
        selection: { anchor: view.state.doc.length, head: view.state.doc.length },
      })
    })

    // Warm up: first dispatch can include JIT / lazy-init costs we don't want
    // to count. Measure the steady-state cost.
    const warmupRuns = 3
    const sampleRuns = 10

    const timings: number[] = await page.evaluate(
      async ({ warmup, samples }) => {
        const view = (
          window as unknown as {
            __mdpadView?: {
              state: { doc: { length: number } }
              dispatch: (spec: unknown) => void
              requestMeasure: (spec?: unknown) => void
            }
          }
        ).__mdpadView
        if (!view) throw new Error('editor not ready')

        const oneRun = async (): Promise<number> => {
          const start = performance.now()
          const pos = view.state.doc.length
          view.dispatch({
            changes: { from: pos, to: pos, insert: 'x' },
            selection: { anchor: pos + 1, head: pos + 1 },
          })
          // Wait for CodeMirror to flush layout / decoration measure phase
          await new Promise<void>(resolve => {
            view.requestMeasure({ read: () => resolve() })
          })
          return performance.now() - start
        }

        for (let i = 0; i < warmup; i++) await oneRun()

        const out: number[] = []
        for (let i = 0; i < samples; i++) out.push(await oneRun())
        return out
      },
      { warmup: warmupRuns, samples: sampleRuns },
    )

    // Median is more resilient than mean against one-off GC spikes.
    const sorted = [...timings].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const max = sorted[sorted.length - 1]

    console.log(
      `perf: median=${median.toFixed(2)}ms max=${max.toFixed(2)}ms samples=${timings.map(t => t.toFixed(1)).join(',')}`,
    )

    expect(median, 'median keystroke dispatch time').toBeLessThan(BUDGET_MS)
  })
})
