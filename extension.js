const vscode = require('vscode')
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('VersionSymbiosis: No workspace folder is open!')
		return
	}

	const workspaceFolder = vscode.workspace.workspaceFolders[0]

	const packageJsonPattern = new vscode.RelativePattern(workspaceFolder, 'package.json')
	const watcher = vscode.workspace.createFileSystemWatcher(packageJsonPattern)
	watcher.onDidChange(updateVersionInFile)
	async function updateVersionInFile() {
		const config = vscode.workspace.getConfiguration('versionSymbiosis')
		const filesToUpdate = config.get('filesToUpdate')

		if (!filesToUpdate || !Array.isArray(filesToUpdate) || filesToUpdate.length === 0) {
			vscode.window.showWarningMessage(
				'VersionSymbiosis: Please, configure "filesToUpdate" in settings as an array of objects with "targetFile" and "variableName" properties.')
			return
		}

		try {
			const [packageJsonUri] = await vscode.workspace.findFiles(packageJsonPattern)	
			if (!packageJsonUri) {
				vscode.window.showErrorMessage('VersionSymbiosis: package.json not found')
				return
			}

			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri)
			const packageJson = JSON.parse(packageJsonContent.toString())
			const version = packageJson.version

			if (!version) {
				vscode.window.showErrorMessage('VersionSymbiosis: Version not found in package.json.')
				return
			}

			for (const fileConfig of filesToUpdate) {
				const { targetFile, targetVariable } = fileConfig
				if (!targetFile || !targetVariable) {
					vscode.window.showWarningMessage('VersionSymbiosis: Each entry in "filesToUpdate" must have "targetFile" and "targetVariable " properties.')
					continue
				}

				const targetFilePattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], targetFile)
				const [targetFileUri] = await vscode.workspace.findFiles(targetFilePattern)
				if (!targetFileUri) {
					vscode.window.showWarningMessage(`VersionSymbiosis: File not found: ${targetFile}.`)
					continue
				}

				const targetFileContent = (await vscode.workspace.fs.readFile(targetFileUri)).toString()
				const regex = new RegExp(`(${targetVariable}\\s*=\\s*['"])([\\d.]+)(['"])`)
				const updatedContent = targetFileContent.replace(regex, `$1${version}$3`)

				await vscode.workspace.fs.writeFile(targetFileUri, Buffer.from(updatedContent, 'utf-8'))
				vscode.window.showInformationMessage(`VersionSymbiosis: Updated version to ${version} in ${targetFile}.`)
			}
		} catch (e) {
			vscode.window.showErrorMessage(`VersionSymbiosis: Error: ${e.message}`)
		}
	}
	context.subscriptions.push(watcher)
}

// This method is called when your extension is deactivated
function deactivate () {
	// no need to do anything here for our extension
}

module.exports = {
	activate,
	deactivate
}
