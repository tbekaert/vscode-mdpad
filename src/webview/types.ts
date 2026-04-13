export interface Page {
  id: string
  content: string
}

export interface NotesState {
  pages: Page[]
  activeId: string
}

// Webview -> Extension messages
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'updateContent'; content: string }
  | { type: 'openLink'; url: string }

export type MdpadCommand = 'toggleBold' | 'toggleItalic' | 'toggleStrikethrough'

// Extension -> Webview messages
export type ExtensionMessage =
  | { type: 'init'; content: string }
  | { type: 'command'; command: MdpadCommand }
