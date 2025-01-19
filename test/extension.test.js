const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const myExtension = require('../extension');

suite('VersionSymbiosis Tests ', () => {
	vscode.window.showInformationMessage('Start all tests.');
	
	test('exists', async () => {	
		assert.ok(myExtension, 'Extension does not exist!')
	})
	
	test('has workspace folder', () => {
		const workspace = vscode.workspace.name
		assert.ok(workspace === 'version-symbiosis-test-project', `Actual name is ${workspace}`)
	})
	
	test('has appropriate config', () => {
		const config = vscode.workspace.getConfiguration('versionSymbiosis')
		assert.ok(config, 'No configuration found for versionSymbiosis!')
		
		const filesToUpdate = config.get('filesToUpdate')
		assert.ok(Array.isArray(filesToUpdate), 'Config versionSymbiosis.filesToUpdate must be an array!')
		assert.ok(filesToUpdate.length > 0, 'Config versionSymbiosis.filesToUpdate must not be empty!')
	})
	
	test('sucessful symbiosis', async () => {
		const workspaceFolder = vscode.workspace.workspaceFolders[0]
		const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json')
		const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonPath)
		const packageJson = JSON.parse(packageJsonContent.toString())
		const newVersion = '2.0.0'
		packageJson.version = newVersion
		await vscode.workspace.fs.writeFile(packageJsonPath, Buffer.from(JSON.stringify(packageJson, null, 2)))
		await new Promise(resolve => setTimeout(resolve, 2000))
		const targetFilePath = vscode.Uri.joinPath(workspaceFolder.uri, 'index.js')
		const targetFileContent = (await vscode.workspace.fs.readFile(targetFilePath)).toString()
		const variableRegex = /MY_VERSION\s*=\s*['"]([\d.]+)['"]/
		const match = RegExp(variableRegex).exec(targetFileContent)
		assert.ok(match, `Variable MY_VERSION not found in ${targetFilePath}!`)
		const updatedVersion = match[1]
		assert.strictEqual(updatedVersion, newVersion, `Expected version ${newVersion}, but got ${updatedVersion}!`)
	})

	test('fails to synchronize', async () => {
		const packageJsonPath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'package.json')
		const originalFile = await vscode.workspace.fs.readFile(packageJsonPath)
		await vscode.workspace.fs.writeFile(packageJsonPath, Buffer.from('INVALID PACKAGE JSON', 'utf-8'))
		let errorMessage = ''
		const ogShowErrorMessage = vscode.window.showErrorMessage
		vscode.window.showErrorMessage = (e) => {
			errorMessage = e
		}
		try {
			await vscode.workspace.fs.writeFile(packageJsonPath, Buffer.from('INVALID PACKAGE JSON UPDATE', 'utf-8'))
			await new Promise(resolve => setTimeout(resolve, 1000))
			assert.ok(errorMessage.includes('Unexpected token'), `Expected JSON error but got ${errorMessage}`)
		} finally {
			await vscode.workspace.fs.writeFile(packageJsonPath, originalFile)
			vscode.window.showErrorMessage = ogShowErrorMessage
		}
	})
});
