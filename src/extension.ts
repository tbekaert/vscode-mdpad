import * as vscode from 'vscode'
import { deriveTitle } from './deriveTitle'
import { NotesStorage } from './NotesStorage'
import { PanelProvider } from './PanelProvider'
import { SidebarProvider } from './SidebarProvider'
import type { MdpadCommand } from './webview/types'

export const activate = (context: vscode.ExtensionContext): void => {
  const storage = new NotesStorage(context.workspaceState)
  const sidebarProvider = new SidebarProvider(context.extensionUri, storage)

  const panelProvider = new PanelProvider(
    context.extensionUri,
    storage,
    () => {},
  )

  const statusBar = vscode.window.createStatusBarItem(
    'mdpad-status',
    vscode.StatusBarAlignment.Right,
    100,
  )
  context.subscriptions.push(statusBar)

  const sendInitToActive = () => {
    if (panelProvider.isActive) {
      panelProvider.sendInit()
    } else {
      sidebarProvider.sendInit()
    }
  }

  const updateStatusBar = () => {
    const state = storage.getState()
    const idx = state.pages.findIndex(p => p.id === state.activeId)
    const page = state.pages[idx]
    const title = page ? deriveTitle(page.content) : 'Empty note'
    statusBar.text = `$(notebook) ${title} (${idx + 1}/${state.pages.length})`
    statusBar.tooltip = 'mdpad — current page'
    statusBar.show()
  }

  const switchAndUpdate = () => {
    sendInitToActive()
    updateStatusBar()
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewId,
      sidebarProvider,
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.openPanel', () => {
      sidebarProvider.detach()
      panelProvider.open()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.newPage', () => {
      storage.newPage()
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.deletePage', async () => {
      const confirmed = await vscode.window.showWarningMessage(
        'Delete this page?',
        { modal: true },
        'Delete',
      )
      if (confirmed !== 'Delete') return
      const { activeId } = storage.getState()
      storage.deletePage(activeId)
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.previousPage', () => {
      storage.previousPage()
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.nextPage', () => {
      storage.nextPage()
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.selectPage', async () => {
      const state = storage.getState()
      const items = state.pages.map((page, i) => ({
        label: `${page.id === state.activeId ? '$(check) ' : ''}${deriveTitle(page.content)}`,
        description: `Page ${i + 1}`,
        pageId: page.id,
      }))
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a page',
      })
      if (picked) {
        storage.switchPage(picked.pageId)
        switchAndUpdate()
      }
    }),
  )

  const postCommandToActive = (command: MdpadCommand) => {
    if (panelProvider.isActive) {
      panelProvider.postCommand(command)
    } else {
      sidebarProvider.postCommand(command)
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.toggleBold', () =>
      postCommandToActive('toggleBold'),
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.toggleItalic', () =>
      postCommandToActive('toggleItalic'),
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.toggleStrikethrough', () =>
      postCommandToActive('toggleStrikethrough'),
    ),
  )

  updateStatusBar()
}

export const deactivate = (): void => {}
