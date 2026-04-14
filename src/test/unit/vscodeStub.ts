// Minimal `vscode` runtime stub for mocha unit tests. Only covers the surface
// currently exercised by code under test — extend as new call sites appear.

type Call = { method: string; args: unknown[] }

export const calls: Call[] = []

export const resetCalls = (): void => {
  calls.length = 0
}

const record = (method: string, args: unknown[]): void => {
  calls.push({ method, args })
}

type FakeUri = { scheme: string; fsPath: string; path: string; toString(): string }

const makeUri = (raw: string): FakeUri => ({
  scheme: raw.match(/^([a-z]+):/)?.[1] ?? 'file',
  fsPath: raw.replace(/^file:\/\//, ''),
  path: raw,
  toString: () => raw,
})

export const Uri = {
  parse: (raw: string): FakeUri => {
    record('Uri.parse', [raw])
    return makeUri(raw)
  },
  joinPath: (base: FakeUri, ...segments: string[]): FakeUri => {
    const joined = [base.path.replace(/\/$/, ''), ...segments].join('/')
    return makeUri(joined)
  },
  file: (path: string): FakeUri => makeUri(`file://${path}`),
}

export let openTextDocumentShouldFail: Error | null = null

export const setOpenTextDocumentFailure = (err: Error | null): void => {
  openTextDocumentShouldFail = err
}

export const workspace = {
  workspaceFolders: [{ uri: makeUri('file:///workspace') }] as
    | { uri: FakeUri }[]
    | undefined,
  openTextDocument: (uri: FakeUri): Promise<{ uri: FakeUri }> => {
    record('workspace.openTextDocument', [uri])
    if (openTextDocumentShouldFail) {
      return Promise.reject(openTextDocumentShouldFail)
    }
    return Promise.resolve({ uri })
  },
  getConfiguration: () => ({ get: () => undefined }),
}

export const env = {
  openExternal: (uri: FakeUri): Promise<boolean> => {
    record('env.openExternal', [uri])
    return Promise.resolve(true)
  },
}

export const window = {
  showTextDocument: (doc: unknown): Promise<unknown> => {
    record('window.showTextDocument', [doc])
    return Promise.resolve(doc)
  },
  showErrorMessage: (message: string): Promise<string | undefined> => {
    record('window.showErrorMessage', [message])
    return Promise.resolve(undefined)
  },
  showInformationMessage: (message: string): Promise<string | undefined> => {
    record('window.showInformationMessage', [message])
    return Promise.resolve(undefined)
  },
}

export const setWorkspaceFolders = (
  folders: { uri: FakeUri }[] | undefined,
): void => {
  workspace.workspaceFolders = folders
}
