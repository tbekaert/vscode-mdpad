import type * as vscode from 'vscode'
import type { NotesState, Page } from './webview/types'

const STORAGE_KEY = 'mdpad.notes'

const WELCOME_CONTENT = `# Welcome to mdpad

A lightweight markdown notepad inside VS Code. Just type — markdown syntax is styled as you write.

## Try it out

- **Bold**, *italic*, and ~~strikethrough~~ are styled inline
- Syntax characters like **\`**\` stay visible but dimmed
- [x] Click the brackets to toggle checkboxes
- [ ] Like this one
- Create multiple pages with the toolbar above
- \`Cmd/Ctrl+click\` on [links](https://github.com) to open them

> Tip: Run the command **Mdpad: Open as Panel** to use mdpad as a floating editor panel.
`

const createPage = (content = ''): Page => ({
  id: crypto.randomUUID(),
  content,
})

export class NotesStorage {
  private cachedState: NotesState | undefined

  constructor(private readonly state: vscode.Memento) {}

  getState(): NotesState {
    if (this.cachedState) {
      return this.cachedState
    }
    const stored = this.state.get<NotesState>(STORAGE_KEY)
    if (stored && stored.pages.length > 0) {
      this.cachedState = stored
      return stored
    }
    const page = createPage(WELCOME_CONTENT)
    const initial: NotesState = { pages: [page], activeId: page.id }
    this.setState(initial)
    return initial
  }

  updateContent(id: string, content: string): void {
    const state = this.getState()
    const page = state.pages.find(p => p.id === id)
    if (page) {
      page.content = content
      this.setState(state)
    }
  }

  newPage(): NotesState {
    const state = this.getState()
    const page = createPage()
    state.pages.push(page)
    state.activeId = page.id
    this.setState(state)
    return state
  }

  deletePage(id: string): NotesState {
    const state = this.getState()
    const idx = state.pages.findIndex(p => p.id === id)
    if (idx === -1) {
      return state
    }
    state.pages.splice(idx, 1)
    if (state.pages.length === 0) {
      const page = createPage()
      state.pages.push(page)
    }
    if (state.activeId === id) {
      state.activeId = state.pages[Math.min(idx, state.pages.length - 1)].id
    }
    this.setState(state)
    return state
  }

  switchPage(id: string): NotesState {
    const state = this.getState()
    if (state.pages.some(p => p.id === id)) {
      state.activeId = id
      this.setState(state)
    }
    return state
  }

  previousPage(): NotesState {
    const state = this.getState()
    const idx = state.pages.findIndex(p => p.id === state.activeId)
    if (idx > 0) {
      state.activeId = state.pages[idx - 1].id
      this.setState(state)
    }
    return state
  }

  nextPage(): NotesState {
    const state = this.getState()
    const idx = state.pages.findIndex(p => p.id === state.activeId)
    if (idx < state.pages.length - 1) {
      state.activeId = state.pages[idx + 1].id
      this.setState(state)
    }
    return state
  }

  private setState(state: NotesState): void {
    this.cachedState = state
    this.state.update(STORAGE_KEY, state).then(undefined, err => {
      console.error('[mdpad] Failed to persist state:', err)
    })
  }
}
