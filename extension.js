const vscode = require('vscode')
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const workspaceFolder = vscode.workspace.workspaceFolders[0]
	const packageJsonPattern = new vscode.RelativePattern(workspaceFolder, 'package.json')
	const watcher = vscode.workspace.createFileSystemWatcher(packageJsonPattern)
	watcher.onDidChange(updateVersionInFile)
	async function updateVersionInFile() {
		const config = vscode.workspace.getConfiguration('versionSymbiosis')
		const filesToUpdate = config.get('filesToUpdate')
		try {
			const [packageJsonUri] = await vscode.workspace.findFiles(packageJsonPattern)
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri)
			const packageJson = JSON.parse(packageJsonContent.toString())
			const version = packageJson.version
			for (const fileConfig of filesToUpdate) {
				const { targetFile, targetVariable } = fileConfig			
				const targetFilePattern = new vscode.RelativePattern(workspaceFolder, targetFile)
				const [targetFileUri] = await vscode.workspace.findFiles(targetFilePattern)
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
