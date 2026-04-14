// Installs a require hook so `import * as vscode from 'vscode'` resolves to
// our in-process stub during mocha unit tests. Must run before any test file
// is loaded (wired via .mocharc.json `require`).

import Module from 'node:module'
import path from 'node:path'

const stubPath = path.resolve(__dirname, 'vscodeStub.js')

type ModuleWithInternals = typeof Module & {
  _resolveFilename: (
    request: string,
    parent: unknown,
    ...rest: unknown[]
  ) => string
}

const moduleInternals = Module as ModuleWithInternals
const original = moduleInternals._resolveFilename

moduleInternals._resolveFilename = function (
  request: string,
  parent: unknown,
  ...rest: unknown[]
): string {
  if (request === 'vscode') return stubPath
  return original.call(this, request, parent, ...rest)
}
