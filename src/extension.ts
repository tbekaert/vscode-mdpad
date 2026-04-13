import * as vscode from 'vscode'
import { deriveTitle } from './deriveTitle'
import { NotesStorage } from './NotesStorage'
import { PanelProvider } from './PanelProvider'
import { SidebarProvider } from './SidebarProvider'
import type { MdpadCommand, MdpadSettings } from './webview/types'

export const activate = (context: vscode.ExtensionContext): void => {
  const workspaceStorage = new NotesStorage(context.workspaceState)
  const globalStorage = new NotesStorage(context.globalState)

  let currentScope: 'workspace' | 'global' = 'workspace'

  const getActiveStorage = (): NotesStorage =>
    currentScope === 'workspace' ? workspaceStorage : globalStorage

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    getActiveStorage,
  )

  const panelProvider = new PanelProvider(
    context.extensionUri,
    getActiveStorage,
    () => {},
  )

  const syncEnabled = vscode.workspace
    .getConfiguration('mdpad')
    .get<boolean>('syncGlobalNotes', false)
  context.globalState.setKeysForSync(syncEnabled ? ['mdpad.notes'] : [])

  vscode.commands.executeCommand('setContext', 'mdpad.scope', currentScope)

  const statusBar = vscode.window.createStatusBarItem(
    'mdpad-status',
    vscode.StatusBarAlignment.Right,
    100,
  )
  context.subscriptions.push(statusBar)

  const scopeLabel = (): string =>
    currentScope === 'workspace' ? 'Workspace' : 'Global'

  const getSettings = (): MdpadSettings => {
    const config = vscode.workspace.getConfiguration('mdpad')
    return {
      fontFamily: config.get<string>('fontFamily', 'inherit'),
      lineHeight: config.get<number>('lineHeight', 1.6),
      listIndentSize: config.get<number>('listIndentSize', 2),
      lineNumbers: config.get<boolean>('lineNumbers', false),
      lineWrapping: config.get<boolean>('lineWrapping', true),
    }
  }

  const sendSettingsToActive = () => {
    const settings = getSettings()
    if (panelProvider.isActive) {
      panelProvider.sendSettings(settings)
    } else {
      sidebarProvider.sendSettings(settings)
    }
  }

  const sendInitToActive = () => {
    const settings = getSettings()
    if (panelProvider.isActive) {
      panelProvider.sendInit()
      panelProvider.sendSettings(settings)
    } else {
      sidebarProvider.sendInit()
      sidebarProvider.sendSettings(settings)
    }
  }

  const updateStatusBar = () => {
    const state = getActiveStorage().getState()
    const idx = state.pages.findIndex(p => p.id === state.activeId)
    const page = state.pages[idx]
    const title = page ? deriveTitle(page.content) : 'Empty note'
    const scopeIcon =
      currentScope === 'workspace' ? '$(root-folder)' : '$(globe)'
    statusBar.text = `$(notebook) ${title} (${idx + 1}/${state.pages.length}) · ${scopeIcon}`
    statusBar.tooltip = `mdpad — ${scopeLabel()}`
    statusBar.show()
  }

  const switchAndUpdate = () => {
    const title = `mdpad (${scopeLabel()})`
    sidebarProvider.setTitle(title)
    panelProvider.setTitle(title)
    sendInitToActive()
    updateStatusBar()
  }

  const setScope = (scope: 'workspace' | 'global'): void => {
    currentScope = scope
    vscode.commands.executeCommand('setContext', 'mdpad.scope', scope)
    switchAndUpdate()
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
      panelProvider.setTitle(`mdpad (${scopeLabel()})`)
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.newPage', () => {
      getActiveStorage().newPage()
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
      const { activeId } = getActiveStorage().getState()
      getActiveStorage().deletePage(activeId)
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.previousPage', () => {
      getActiveStorage().previousPage()
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.nextPage', () => {
      getActiveStorage().nextPage()
      switchAndUpdate()
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.selectPage', async () => {
      const activeState = getActiveStorage().getState()
      const inactiveScope: 'workspace' | 'global' =
        currentScope === 'workspace' ? 'global' : 'workspace'
      const inactiveStorage =
        currentScope === 'workspace' ? globalStorage : workspaceStorage
      const inactiveState = inactiveStorage.getState()

      const activeIcon =
        currentScope === 'workspace' ? '$(root-folder)' : '$(globe)'
      const inactiveIcon =
        currentScope === 'workspace' ? '$(globe)' : '$(root-folder)'
      const activeLabel = currentScope === 'workspace' ? 'Workspace' : 'Global'
      const inactiveLabel =
        currentScope === 'workspace' ? 'Global' : 'Workspace'

      const activeItems = activeState.pages.map((page, i) => ({
        label: `${page.id === activeState.activeId ? '$(check) ' : ''}${activeIcon} ${deriveTitle(page.content)}`,
        description: `Page ${i + 1} · ${activeLabel}`,
        pageId: page.id,
        scope: currentScope,
      }))

      const inactiveItems = inactiveState.pages.map((page, i) => ({
        label: `${inactiveIcon} ${deriveTitle(page.content)}`,
        description: `Page ${i + 1} · ${inactiveLabel}`,
        pageId: page.id,
        scope: inactiveScope,
      }))

      const separator = {
        label: '',
        kind: vscode.QuickPickItemKind.Separator,
      }

      const allItems = [
        ...activeItems,
        ...(inactiveItems.length > 0 ? [separator, ...inactiveItems] : []),
      ]

      const picked = await vscode.window.showQuickPick(allItems, {
        placeHolder: `Select a page (${activeLabel})`,
      })

      if (picked && 'pageId' in picked) {
        if (picked.scope !== currentScope) {
          currentScope = picked.scope as 'workspace' | 'global'
          vscode.commands.executeCommand(
            'setContext',
            'mdpad.scope',
            currentScope,
          )
        }
        getActiveStorage().switchPage(picked.pageId)
        switchAndUpdate()
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.switchToGlobal', () => {
      setScope('global')
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.switchToWorkspace', () => {
      setScope('workspace')
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.exportPage', async () => {
      const state = getActiveStorage().getState()
      const page = state.pages.find(p => p.id === state.activeId)
      if (!page) return
      const title = deriveTitle(page.content)
      const fileName =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'note'
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${fileName}.md`),
        filters: { Markdown: ['md'] },
      })
      if (uri) {
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(page.content, 'utf-8'),
        )
        vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`)
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.openSettings', () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        '@ext:tbekaert.mdpad',
      )
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

  context.subscriptions.push(
    vscode.commands.registerCommand('mdpad.find', () =>
      postCommandToActive('openSearch'),
    ),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('mdpad')) {
        sendSettingsToActive()
      }
      if (e.affectsConfiguration('mdpad.syncGlobalNotes')) {
        const sync = vscode.workspace
          .getConfiguration('mdpad')
          .get<boolean>('syncGlobalNotes', false)
        context.globalState.setKeysForSync(sync ? ['mdpad.notes'] : [])
      }
    }),
  )

  updateStatusBar()
}

export const deactivate = (): void => {}
