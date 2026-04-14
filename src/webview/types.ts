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

export interface MdpadSettings {
  fontFamily: string
  lineHeight: number
  listIndentSize: number
  lineNumbers: boolean
  lineWrapping: boolean
}

// Extension -> Webview messages
export type ExtensionMessage =
  | { type: 'init'; content: string }
  | { type: 'command'; command: MdpadCommand }
  | ({ type: 'settings' } & MdpadSettings)
  | { type: 'setCursor'; pos: number }
