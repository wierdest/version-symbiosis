import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	label: 'Unit Tests - VersionSymbiosis',
	files: 'test/**/*.test.js',
	version: 'insiders',
	workspaceFolder: './version-symbiosis-test-project',
	mocha: {
		timeout: 20000
	}

});
