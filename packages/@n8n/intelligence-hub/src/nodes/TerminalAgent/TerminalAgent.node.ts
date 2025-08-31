import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { spawn } from 'child_process';
import { Client } from 'ssh2';

async function executeLocalCommand(
	executeFunctions: IExecuteFunctions,
	command: string,
	itemIndex: number,
): Promise<any> {
	const workingDirectory = executeFunctions.getNodeParameter(
		'workingDirectory',
		itemIndex,
	) as string;

	return new Promise((resolve, reject) => {
		const options: any = {};
		if (workingDirectory) {
			options.cwd = workingDirectory;
		}

		const child = spawn('sh', ['-c', command], options);
		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		child.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		child.on('close', (code) => {
			resolve({
				exitCode: code,
				stdout: stdout.trim(),
				stderr: stderr.trim(),
				success: code === 0,
			});
		});

		child.on('error', (error) => {
			reject(
				new NodeOperationError(
					executeFunctions.getNode(),
					`Command execution failed: ${error.message}`,
				),
			);
		});
	});
}

async function executeRemoteCommand(
	executeFunctions: IExecuteFunctions,
	command: string,
	itemIndex: number,
	timeout: number,
): Promise<any> {
	const host = executeFunctions.getNodeParameter('host', itemIndex) as string;
	const port = executeFunctions.getNodeParameter('port', itemIndex) as number;
	const username = executeFunctions.getNodeParameter('username', itemIndex) as string;
	const authMethod = executeFunctions.getNodeParameter('authMethod', itemIndex) as string;
	const password = executeFunctions.getNodeParameter('password', itemIndex) as string;
	const privateKey = executeFunctions.getNodeParameter('privateKey', itemIndex) as string;

	return new Promise((resolve, reject) => {
		const conn = new Client();

		const timeoutId = setTimeout(() => {
			conn.end();
			reject(
				new NodeOperationError(
					executeFunctions.getNode(),
					`SSH connection timeout after ${timeout} seconds`,
				),
			);
		}, timeout * 1000);

		conn.on('ready', () => {
			clearTimeout(timeoutId);

			conn.exec(command, (err, stream) => {
				if (err) {
					conn.end();
					reject(
						new NodeOperationError(executeFunctions.getNode(), `SSH exec failed: ${err.message}`),
					);
					return;
				}

				let stdout = '';
				let stderr = '';

				stream.on('close', (code: number) => {
					conn.end();
					resolve({
						exitCode: code,
						stdout: stdout.trim(),
						stderr: stderr.trim(),
						success: code === 0,
					});
				});

				stream.on('data', (data: Buffer) => {
					stdout += data.toString();
				});

				stream.stderr.on('data', (data: Buffer) => {
					stderr += data.toString();
				});
			});
		});

		conn.on('error', (err) => {
			clearTimeout(timeoutId);
			reject(
				new NodeOperationError(executeFunctions.getNode(), `SSH connection failed: ${err.message}`),
			);
		});

		const connectionConfig: any = {
			host,
			port,
			username,
		};

		if (authMethod === 'password') {
			connectionConfig.password = password;
		} else {
			connectionConfig.privateKey = privateKey;
		}

		conn.connect(connectionConfig);
	});
}

class TerminalAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terminal Agent',
		name: 'terminalAgent',
		icon: 'fa:terminal',
		group: ['transform'],
		version: 1,
		description: 'Execute commands locally or on remote machines via SSH',
		defaults: {
			name: 'Terminal Agent',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Execution Mode',
				name: 'executionMode',
				type: 'options',
				options: [
					{
						name: 'Local',
						value: 'local',
						description: 'Execute command on local machine',
					},
					{
						name: 'Remote (SSH)',
						value: 'remote',
						description: 'Execute command on remote machine via SSH',
					},
				],
				default: 'local',
			},
			{
				displayName: 'Command',
				name: 'command',
				type: 'string',
				default: '',
				placeholder: 'ls -la',
				description: 'Command to execute',
				required: true,
			},
			{
				displayName: 'Working Directory',
				name: 'workingDirectory',
				type: 'string',
				default: '',
				placeholder: '/home/user',
				description: 'Working directory for command execution (optional)',
				displayOptions: {
					show: {
						executionMode: ['local'],
					},
				},
			},
			{
				displayName: 'Host',
				name: 'host',
				type: 'string',
				default: '',
				placeholder: '192.168.1.100',
				description: 'Remote host IP or hostname',
				required: true,
				displayOptions: {
					show: {
						executionMode: ['remote'],
					},
				},
			},
			{
				displayName: 'Port',
				name: 'port',
				type: 'number',
				default: 22,
				description: 'SSH port',
				displayOptions: {
					show: {
						executionMode: ['remote'],
					},
				},
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				description: 'SSH username',
				required: true,
				displayOptions: {
					show: {
						executionMode: ['remote'],
					},
				},
			},
			{
				displayName: 'Authentication Method',
				name: 'authMethod',
				type: 'options',
				options: [
					{
						name: 'Password',
						value: 'password',
					},
					{
						name: 'Private Key',
						value: 'privateKey',
					},
				],
				default: 'password',
				displayOptions: {
					show: {
						executionMode: ['remote'],
					},
				},
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'SSH password',
				displayOptions: {
					show: {
						executionMode: ['remote'],
						authMethod: ['password'],
					},
				},
			},
			{
				displayName: 'Private Key',
				name: 'privateKey',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				description: 'SSH private key content',
				displayOptions: {
					show: {
						executionMode: ['remote'],
						authMethod: ['privateKey'],
					},
				},
			},
			{
				displayName: 'Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				default: 30,
				description: 'Command execution timeout in seconds',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const executionMode = this.getNodeParameter('executionMode', i) as string;
				const command = this.getNodeParameter('command', i) as string;
				const timeout = this.getNodeParameter('timeout', i) as number;

				let result: any;

				if (executionMode === 'local') {
					result = await executeLocalCommand(this, command, i);
				} else {
					result = await executeRemoteCommand(this, command, i, timeout);
				}

				returnData.push({
					json: {
						command,
						executionMode,
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

export { TerminalAgent };
