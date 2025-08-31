#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of node files to fix
const nodeFiles = [
	'src/nodes/LMStudioAgent/LMStudioAgent.node.ts',
	'src/nodes/MCPConnector/MCPConnector.node.ts',
	'src/nodes/WebBrowseAgent/WebBrowseAgent.node.ts',
	'src/nodes/HubMonitor/HubMonitor.node.ts',
];

console.log('🔧 Fixing node export patterns...\n');

nodeFiles.forEach((filePath) => {
	const fullPath = path.join(__dirname, filePath);

	if (!fs.existsSync(fullPath)) {
		console.log(`❌ File not found: ${filePath}`);
		return;
	}

	let content = fs.readFileSync(fullPath, 'utf8');

	// Extract class name from file path
	const className = path.basename(filePath).replace('.node.ts', '');

	// Fix export class to class
	const exportClassRegex = new RegExp(`export class ${className}`, 'g');
	content = content.replace(exportClassRegex, `class ${className}`);

	// Add export statement at the end if not present
	if (!content.includes(`export { ${className} }`)) {
		content = content.trim() + `\n\nexport { ${className} };\n`;
	}

	fs.writeFileSync(fullPath, content);
	console.log(`✅ Fixed exports for: ${className}`);
});

console.log('\n🎯 All node exports fixed! Ready to rebuild.');
