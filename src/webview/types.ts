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
  | { type: 'updateContent'; id: string; content: string }
  | { type: 'newPage' }
  | { type: 'deletePage'; id: string }
  | { type: 'switchPage'; id: string }
  | { type: 'openLink'; url: string }

export type MdpadCommand = 'toggleBold' | 'toggleItalic' | 'toggleStrikethrough'

// Extension -> Webview messages
export type ExtensionMessage =
  | { type: 'init'; pages: Page[]; activeId: string }
  | { type: 'command'; command: MdpadCommand }
