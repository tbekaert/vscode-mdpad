import assert from 'node:assert'
import * as vscode from 'vscode'

suite('Extension', () => {
  test('should activate', async () => {
    const ext = vscode.extensions.getExtension('tbekaert.mdpad')
    assert.ok(ext, 'Extension not found')
    await ext.activate()
    assert.strictEqual(ext.isActive, true)
  })

  test('should register mdpad.openPanel command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('mdpad.openPanel'))
  })

  test('should register mdpad.newPage command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('mdpad.newPage'))
  })

  test('should register mdpad.deletePage command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('mdpad.deletePage'))
  })

  test('should register mdpad.toggleBold command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('mdpad.toggleBold'))
  })

  test('should register mdpad.toggleItalic command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('mdpad.toggleItalic'))
  })

  test('should register mdpad.toggleStrikethrough command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('mdpad.toggleStrikethrough'))
  })
})
