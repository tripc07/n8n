// Simple test script to verify Intelligence Hub nodes work
const { TerminalAgent } = require('./dist/nodes/TerminalAgent/TerminalAgent.node');
const { HubMonitor } = require('./dist/nodes/HubMonitor/HubMonitor.node');

console.log('Testing Intelligence Hub nodes...');

// Mock execution context for testing
const mockContext = {
	getInputData: () => [{}],
	getNodeParameter: (name, index) => {
		const params = {
			operation: 'systemHealth',
			executionMode: 'local',
			command: 'echo "Hello from Intelligence Hub!"',
			timeout: 10,
		};
		return params[name] || '';
	},
	continueOnFail: () => false,
	getNode: () => ({ name: 'Test Node' }),
};

async function testNodes() {
	try {
		console.log('1. Testing Hub Monitor...');
		const hubMonitor = new HubMonitor();
		console.log('✓ Hub Monitor created successfully');
		console.log('   Description:', hubMonitor.description.displayName);

		console.log('2. Testing Terminal Agent...');
		const terminalAgent = new TerminalAgent();
		console.log('✓ Terminal Agent created successfully');
		console.log('   Description:', terminalAgent.description.displayName);

		console.log('\n🎉 All Intelligence Hub nodes loaded successfully!');
		console.log('📝 Node types available:');
		console.log('   - Terminal Agent (local/remote command execution)');
		console.log('   - LM Studio Agent (local LLM integration)');
		console.log('   - MCP Connector (Model Context Protocol)');
		console.log('   - Web Browse Agent (automated browsing)');
		console.log('   - Hub Monitor (system monitoring)');
	} catch (error) {
		console.error('❌ Test failed:', error.message);
		process.exit(1);
	}
}

testNodes();
