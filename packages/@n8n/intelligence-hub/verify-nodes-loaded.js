#!/usr/bin/env node

/**
 * Script to verify that Intelligence Hub nodes are properly loaded in n8n
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying Intelligence Hub nodes are available...\n');

// Check if all node files exist and are built
const nodePaths = [
	'dist/nodes/TerminalAgent/TerminalAgent.node.js',
	'dist/nodes/LMStudioAgent/LMStudioAgent.node.js',
	'dist/nodes/MCPConnector/MCPConnector.node.js',
	'dist/nodes/WebBrowseAgent/WebBrowseAgent.node.js',
	'dist/nodes/HubMonitor/HubMonitor.node.js',
];

const nodeNames = [
	'Terminal Agent',
	'LM Studio Agent',
	'MCP Connector',
	'Web Browse Agent',
	'Hub Monitor',
];

let allNodesExist = true;

console.log('📁 Checking compiled node files:');
nodePaths.forEach((nodePath, index) => {
	const fullPath = path.join(__dirname, nodePath);
	const exists = fs.existsSync(fullPath);
	const status = exists ? '✅' : '❌';
	console.log(`${status} ${nodeNames[index]}: ${nodePath}`);
	if (!exists) allNodesExist = false;
});

console.log('\n📦 Checking package.json configuration:');
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Check if n8n field exists
if (packageJson.n8n) {
	console.log('✅ n8n configuration found in package.json');
	if (packageJson.n8n.nodes) {
		console.log(`✅ Nodes array defined with ${packageJson.n8n.nodes.length} entries`);
		packageJson.n8n.nodes.forEach((nodePath) => {
			console.log(`   📄 ${nodePath}`);
		});
	} else {
		console.log('❌ No nodes array found in n8n configuration');
	}
} else {
	console.log('❌ No n8n configuration found in package.json');
}

console.log('\n🔗 Checking CLI dependency:');
const cliPackagePath = path.join(__dirname, '../../../cli/package.json');
if (fs.existsSync(cliPackagePath)) {
	const cliPackageJson = JSON.parse(fs.readFileSync(cliPackagePath, 'utf8'));
	if (cliPackageJson.dependencies && cliPackageJson.dependencies['@n8n/intelligence-hub']) {
		console.log('✅ Intelligence Hub added to CLI dependencies');
		console.log(`   Version: ${cliPackageJson.dependencies['@n8n/intelligence-hub']}`);
	} else {
		console.log('❌ Intelligence Hub not found in CLI dependencies');
	}
} else {
	console.log('❌ CLI package.json not found');
}

console.log('\n🎯 Summary:');
if (allNodesExist) {
	console.log('✅ All node files are compiled and ready');
	console.log('🚀 Intelligence Hub nodes should be available in n8n UI');
	console.log('');
	console.log('📋 Expected nodes in your n8n interface:');
	console.log('   • Terminal Agent - Execute local/remote commands via SSH');
	console.log('   • LM Studio Agent - Interact with local LM Studio API');
	console.log('   • MCP Connector - Connect to Model Context Protocol servers');
	console.log('   • Web Browse Agent - Automate web browsing with Puppeteer');
	console.log('   • Hub Monitor - Monitor system health and network services');
	console.log('');
	console.log('🌐 Open http://localhost:5678 to access n8n and create workflows!');
} else {
	console.log('❌ Some node files are missing - rebuild may be required');
}
