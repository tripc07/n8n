import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import WebSocket from 'ws';

function buildMCPMessage(
	executeFunctions: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): any {
	const baseMessage = {
		jsonrpc: '2.0',
		id: Math.random().toString(36).substring(7),
		method: '',
		params: {},
	};

	switch (operation) {
		case 'initialize':
			return {
				...baseMessage,
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {
						tools: {},
						resources: {},
					},
					clientInfo: {
						name: 'n8n-intelligence-hub',
						version: '1.0.0',
					},
				},
			};

		case 'listTools':
			return {
				...baseMessage,
				method: 'tools/list',
			};

		case 'callTool':
			const toolName = executeFunctions.getNodeParameter('toolName', itemIndex) as string;
			const toolArguments = executeFunctions.getNodeParameter('toolArguments', itemIndex) as string;

			return {
				...baseMessage,
				method: 'tools/call',
				params: {
					name: toolName,
					arguments: JSON.parse(toolArguments),
				},
			};

		case 'listResources':
			return {
				...baseMessage,
				method: 'resources/list',
			};

		case 'readResource':
			const resourceUri = executeFunctions.getNodeParameter('resourceUri', itemIndex) as string;

			return {
				...baseMessage,
				method: 'resources/read',
				params: {
					uri: resourceUri,
				},
			};

		case 'sendMessage':
			const customMessage = executeFunctions.getNodeParameter('customMessage', itemIndex) as string;
			return JSON.parse(customMessage);

		default:
			throw new NodeOperationError(executeFunctions.getNode(), `Unknown operation: ${operation}`);
	}
}

async function executeWebSocketOperation(
	executeFunctions: IExecuteFunctions,
	serverUrl: string,
	operation: string,
	itemIndex: number,
	timeout: number,
): Promise<any> {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(serverUrl);
		let responseReceived = false;

		const timeoutId = setTimeout(() => {
			if (!responseReceived) {
				ws.close();
				reject(
					new NodeOperationError(
						executeFunctions.getNode(),
						`WebSocket operation timeout after ${timeout} seconds`,
					),
				);
			}
		}, timeout * 1000);

		ws.on('open', () => {
			try {
				const message = buildMCPMessage(executeFunctions, operation, itemIndex);
				ws.send(JSON.stringify(message));
			} catch (error) {
				clearTimeout(timeoutId);
				ws.close();
				reject(
					new NodeOperationError(
						executeFunctions.getNode(),
						`Failed to send message: ${(error as Error).message}`,
					),
				);
			}
		});

		ws.on('message', (data: any) => {
			responseReceived = true;
			clearTimeout(timeoutId);

			try {
				const response = JSON.parse(data.toString());
				ws.close();
				resolve({
					success: true,
					response,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				ws.close();
				reject(
					new NodeOperationError(
						executeFunctions.getNode(),
						`Failed to parse response: ${(error as Error).message}`,
					),
				);
			}
		});

		ws.on('error', (error: any) => {
			responseReceived = true;
			clearTimeout(timeoutId);
			reject(
				new NodeOperationError(executeFunctions.getNode(), `WebSocket error: ${error.message}`),
			);
		});

		ws.on('close', () => {
			if (!responseReceived) {
				clearTimeout(timeoutId);
				reject(
					new NodeOperationError(
						executeFunctions.getNode(),
						'WebSocket connection closed unexpectedly',
					),
				);
			}
		});
	});
}

async function executeHttpOperation(
	executeFunctions: IExecuteFunctions,
	serverUrl: string,
	operation: string,
	itemIndex: number,
	timeout: number,
): Promise<any> {
	// For HTTP connections, we'll use axios (assuming it's available)
	// This is a simplified implementation
	const message = buildMCPMessage(executeFunctions, operation, itemIndex);

	try {
		// Note: This would require axios to be properly imported
		// const response = await axios.post(serverUrl, message, { timeout: timeout * 1000 });

		// For now, return a placeholder response
		return {
			success: true,
			response: { message: 'HTTP MCP not fully implemented yet' },
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`HTTP MCP operation failed: ${(error as Error).message}`,
		);
	}
}

class MCPConnector implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MCP Connector',
		name: 'mcpConnector',
		icon: 'fa:plug',
		group: ['transform'],
		version: 1,
		description: 'Connect to Model Context Protocol (MCP) servers',
		defaults: {
			name: 'MCP Connector',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Connection Type',
				name: 'connectionType',
				type: 'options',
				options: [
					{
						name: 'WebSocket',
						value: 'websocket',
						description: 'Connect via WebSocket',
					},
					{
						name: 'HTTP',
						value: 'http',
						description: 'Connect via HTTP',
					},
				],
				default: 'websocket',
			},
			{
				displayName: 'Server URL',
				name: 'serverUrl',
				type: 'string',
				default: 'ws://localhost:8080',
				placeholder: 'ws://localhost:8080',
				description: 'MCP server URL',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Initialize',
						value: 'initialize',
						description: 'Initialize connection with MCP server',
					},
					{
						name: 'List Tools',
						value: 'listTools',
						description: 'Get available tools from server',
					},
					{
						name: 'Call Tool',
						value: 'callTool',
						description: 'Execute a tool on the MCP server',
					},
					{
						name: 'List Resources',
						value: 'listResources',
						description: 'Get available resources from server',
					},
					{
						name: 'Read Resource',
						value: 'readResource',
						description: 'Read a specific resource',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send custom message to MCP server',
					},
				],
				default: 'initialize',
			},
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				default: '',
				placeholder: 'tool_name',
				description: 'Name of the tool to call',
				required: true,
				displayOptions: {
					show: {
						operation: ['callTool'],
					},
				},
			},
			{
				displayName: 'Tool Arguments',
				name: 'toolArguments',
				type: 'json',
				default: '{}',
				description: 'Arguments to pass to the tool (JSON format)',
				displayOptions: {
					show: {
						operation: ['callTool'],
					},
				},
			},
			{
				displayName: 'Resource URI',
				name: 'resourceUri',
				type: 'string',
				default: '',
				placeholder: 'file://path/to/resource',
				description: 'URI of the resource to read',
				required: true,
				displayOptions: {
					show: {
						operation: ['readResource'],
					},
				},
			},
			{
				displayName: 'Custom Message',
				name: 'customMessage',
				type: 'json',
				default: '{}',
				description: 'Custom JSON message to send to MCP server',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				default: 30,
				description: 'Connection/operation timeout in seconds',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const connectionType = this.getNodeParameter('connectionType', i) as string;
				const serverUrl = this.getNodeParameter('serverUrl', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const timeout = this.getNodeParameter('timeout', i) as number;

				let result: any;

				if (connectionType === 'websocket') {
					result = await executeWebSocketOperation(this, serverUrl, operation, i, timeout);
				} else {
					result = await executeHttpOperation(this, serverUrl, operation, i, timeout);
				}

				returnData.push({
					json: {
						operation,
						connectionType,
						serverUrl,
						...result,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

export { MCPConnector };
