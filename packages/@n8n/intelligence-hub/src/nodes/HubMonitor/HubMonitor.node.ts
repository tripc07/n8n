import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { spawn } from 'child_process';
import axios from 'axios';

async function checkDiskSpace(): Promise<any> {
	// Simplified disk space check
	return new Promise((resolve) => {
		const isWindows = process.platform === 'win32';
		const command = isWindows ? 'wmic' : 'df';
		const args = isWindows ? ['logicaldisk', 'get', 'size,freespace,caption'] : ['-h', '/'];

		const child = spawn(command, args);
		let output = '';

		child.stdout.on('data', (data) => {
			output += data.toString();
		});

		child.on('close', () => {
			// Simplified parsing - in real implementation would parse actual output
			resolve({
				total: '100GB',
				free: '50GB',
				usage: 50,
				status: 'ok',
			});
		});

		child.on('error', () => {
			resolve({
				total: 'unknown',
				free: 'unknown',
				usage: 0,
				status: 'error',
			});
		});
	});
}

async function checkMemoryUsage(): Promise<any> {
	const totalMem = process.memoryUsage();
	const freeMem = totalMem.heapTotal - totalMem.heapUsed;
	const usage = (totalMem.heapUsed / totalMem.heapTotal) * 100;

	return {
		total: Math.round(totalMem.heapTotal / 1024 / 1024) + 'MB',
		used: Math.round(totalMem.heapUsed / 1024 / 1024) + 'MB',
		free: Math.round(freeMem / 1024 / 1024) + 'MB',
		usage: Math.round(usage),
		status: usage > 90 ? 'critical' : usage > 70 ? 'warning' : 'ok',
	};
}

async function checkCpuUsage(): Promise<any> {
	// Simplified CPU usage - in real implementation would get actual CPU metrics
	return new Promise((resolve) => {
		const usage = Math.random() * 100; // Placeholder
		resolve({
			usage: Math.round(usage),
			cores: require('os').cpus().length,
			status: usage > 90 ? 'critical' : usage > 70 ? 'warning' : 'ok',
		});
	});
}

async function checkWebSocketService(url: string): Promise<any> {
	// Simplified WebSocket health check
	return new Promise((resolve) => {
		try {
			// In a real implementation, would use WebSocket library
			resolve({
				status: 'healthy',
				type: 'websocket',
				url,
			});
		} catch (error) {
			resolve({
				status: 'error',
				error: (error as Error).message,
				url,
			});
		}
	});
}

function guessService(port: number): string {
	const commonPorts: any = {
		22: 'SSH',
		80: 'HTTP',
		443: 'HTTPS',
		1234: 'LM Studio',
		8080: 'MCP Server',
		3000: 'Development Server',
		5678: 'n8n',
	};
	return commonPorts[port] || 'Unknown';
}

function parseProcessList(output: string, pattern: string, isWindows: boolean): any[] {
	const processes: any[] = [];
	const lines = output.split('\n');

	const regex = pattern ? new RegExp(pattern, 'i') : null;

	for (const line of lines) {
		if (!line.trim()) continue;

		let processName = '';
		let pid = '';

		if (isWindows) {
			// Parse Windows tasklist output
			const parts = line.split(',');
			if (parts.length > 1) {
				processName = parts[0].replace(/"/g, '');
				pid = parts[1].replace(/"/g, '');
			}
		} else {
			// Parse Unix ps output
			const parts = line.trim().split(/\s+/);
			if (parts.length > 10) {
				pid = parts[1];
				processName = parts.slice(10).join(' ');
			}
		}

		if (processName && (!regex || regex.test(processName))) {
			processes.push({
				name: processName,
				pid: pid,
			});
		}
	}

	return processes;
}

async function executeSystemHealth(executeFunctions: IExecuteFunctions): Promise<any> {
	const health = {
		status: 'healthy',
		checks: {} as any,
		overall: true,
	};

	try {
		// Check disk space
		const diskSpace = await checkDiskSpace();
		health.checks.diskSpace = diskSpace;
		if (diskSpace.usage > 90) {
			health.overall = false;
			health.status = 'warning';
		}

		// Check memory usage
		const memory = await checkMemoryUsage();
		health.checks.memory = memory;
		if (memory.usage > 90) {
			health.overall = false;
			health.status = 'warning';
		}

		// Check CPU usage
		const cpu = await checkCpuUsage();
		health.checks.cpu = cpu;
		if (cpu.usage > 90) {
			health.overall = false;
			health.status = 'critical';
		}

		return health;
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`System health check failed: ${(error as Error).message}`,
		);
	}
}

async function executeServiceStatus(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
): Promise<any> {
	const servicesJson = executeFunctions.getNodeParameter('services', itemIndex) as string;
	const services = JSON.parse(servicesJson);
	const results: any = {};

	for (const [serviceName, serviceUrl] of Object.entries(services)) {
		try {
			const startTime = Date.now();

			if (
				(serviceUrl as string).startsWith('ws://') ||
				(serviceUrl as string).startsWith('wss://')
			) {
				// WebSocket health check
				results[serviceName] = await checkWebSocketService(serviceUrl as string);
			} else {
				// HTTP health check
				const response = await axios.get(serviceUrl as string, {
					timeout: 5000,
					validateStatus: () => true, // Don't throw on non-2xx status
				});

				const responseTime = Date.now() - startTime;
				results[serviceName] = {
					status: response.status < 400 ? 'healthy' : 'unhealthy',
					statusCode: response.status,
					responseTime,
					url: serviceUrl,
				};
			}
		} catch (error) {
			results[serviceName] = {
				status: 'error',
				error: (error as Error).message,
				url: serviceUrl,
			};
		}
	}

	return { services: results };
}

async function executeNetworkScan(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
): Promise<any> {
	const networkRange = executeFunctions.getNodeParameter('networkRange', itemIndex) as string;
	const portsStr = executeFunctions.getNodeParameter('ports', itemIndex) as string;
	const ports = portsStr.split(',').map((p) => parseInt(p.trim()));

	// This is a simplified network scan
	// In a real implementation, you'd use a proper network scanning library
	const results: any = {
		range: networkRange,
		ports: ports,
		discovered: [],
		timestamp: new Date().toISOString(),
	};

	// For demonstration, we'll just check localhost
	for (const port of ports) {
		try {
			const response = await axios.get(`http://localhost:${port}`, {
				timeout: 1000,
				validateStatus: () => true,
			});

			results.discovered.push({
				host: 'localhost',
				port,
				status: 'open',
				service: guessService(port),
			});
		} catch (error) {
			// Port is closed or filtered
		}
	}

	return results;
}

async function executeProcessMonitor(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
): Promise<any> {
	const processPattern = executeFunctions.getNodeParameter('processPattern', itemIndex) as string;

	return new Promise((resolve, reject) => {
		// Use appropriate command based on OS
		const isWindows = process.platform === 'win32';
		const command = isWindows ? 'tasklist' : 'ps';
		const args = isWindows ? ['/fo', 'csv'] : ['aux'];

		const child = spawn(command, args);
		let output = '';

		child.stdout.on('data', (data) => {
			output += data.toString();
		});

		child.on('close', (code) => {
			if (code !== 0) {
				reject(new NodeOperationError(executeFunctions.getNode(), 'Failed to get process list'));
				return;
			}

			const processes = parseProcessList(output, processPattern, isWindows);
			resolve({ processes, pattern: processPattern, count: processes.length });
		});

		child.on('error', (error) => {
			reject(
				new NodeOperationError(
					executeFunctions.getNode(),
					`Process monitor failed: ${error.message}`,
				),
			);
		});
	});
}

async function executePerformanceMetrics(executeFunctions: IExecuteFunctions): Promise<any> {
	try {
		const metrics = {
			cpu: await checkCpuUsage(),
			memory: await checkMemoryUsage(),
			disk: await checkDiskSpace(),
			uptime: process.uptime(),
			nodeVersion: process.version,
			platform: process.platform,
			arch: process.arch,
		};

		return { metrics };
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Performance metrics failed: ${(error as Error).message}`,
		);
	}
}

class HubMonitor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hub Monitor',
		name: 'hubMonitor',
		icon: 'fa:heartbeat',
		group: ['transform'],
		version: 1,
		description: 'Monitor health and performance of intelligence hub components',
		defaults: {
			name: 'Hub Monitor',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'System Health',
						value: 'systemHealth',
						description: 'Check overall system health',
					},
					{
						name: 'Service Status',
						value: 'serviceStatus',
						description: 'Check status of specific services',
					},
					{
						name: 'Network Scan',
						value: 'networkScan',
						description: 'Scan network for available services',
					},
					{
						name: 'Process Monitor',
						value: 'processMonitor',
						description: 'Monitor running processes',
					},
					{
						name: 'Performance Metrics',
						value: 'performanceMetrics',
						description: 'Collect system performance metrics',
					},
				],
				default: 'systemHealth',
			},
			{
				displayName: 'Services to Check',
				name: 'services',
				type: 'json',
				default: '{"lmStudio": "http://localhost:1234", "mcpServer": "ws://localhost:8080"}',
				description: 'JSON object with service names and their URLs/endpoints',
				displayOptions: {
					show: {
						operation: ['serviceStatus'],
					},
				},
			},
			{
				displayName: 'Network Range',
				name: 'networkRange',
				type: 'string',
				default: '192.168.1.0/24',
				placeholder: '192.168.1.0/24',
				description: 'Network range to scan (CIDR notation)',
				displayOptions: {
					show: {
						operation: ['networkScan'],
					},
				},
			},
			{
				displayName: 'Ports to Scan',
				name: 'ports',
				type: 'string',
				default: '22,80,443,1234,8080',
				placeholder: '22,80,443,1234,8080',
				description: 'Comma-separated list of ports to scan',
				displayOptions: {
					show: {
						operation: ['networkScan'],
					},
				},
			},
			{
				displayName: 'Process Name Pattern',
				name: 'processPattern',
				type: 'string',
				default: '',
				placeholder: 'node|python|lm-studio',
				description: 'Regular expression pattern to match process names',
				displayOptions: {
					show: {
						operation: ['processMonitor'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let result: any;

				switch (operation) {
					case 'systemHealth':
						result = await executeSystemHealth(this);
						break;
					case 'serviceStatus':
						result = await executeServiceStatus(this, i);
						break;
					case 'networkScan':
						result = await executeNetworkScan(this, i);
						break;
					case 'processMonitor':
						result = await executeProcessMonitor(this, i);
						break;
					case 'performanceMetrics':
						result = await executePerformanceMetrics(this);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push({
					json: {
						operation,
						timestamp: new Date().toISOString(),
						...result,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							timestamp: new Date().toISOString(),
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

export { HubMonitor };
