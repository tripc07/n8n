import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

async function executeChatCompletion(
	executeFunctions: IExecuteFunctions,
	lmStudioUrl: string,
	itemIndex: number,
): Promise<any> {
	const model = executeFunctions.getNodeParameter('model', itemIndex) as string;
	const message = executeFunctions.getNodeParameter('message', itemIndex) as string;
	const systemMessage = executeFunctions.getNodeParameter('systemMessage', itemIndex) as string;
	const temperature = executeFunctions.getNodeParameter('temperature', itemIndex) as number;
	const maxTokens = executeFunctions.getNodeParameter('maxTokens', itemIndex) as number;
	const stream = executeFunctions.getNodeParameter('stream', itemIndex) as boolean;

	const messages: any[] = [];

	if (systemMessage) {
		messages.push({
			role: 'system',
			content: systemMessage,
		});
	}

	messages.push({
		role: 'user',
		content: message,
	});

	const requestBody: any = {
		messages,
		temperature,
		max_tokens: maxTokens,
		stream,
	};

	if (model) {
		requestBody.model = model;
	}

	try {
		const response = await axios.post(`${lmStudioUrl}/v1/chat/completions`, requestBody, {
			headers: {
				'Content-Type': 'application/json',
			},
			timeout: 60000, // 60 second timeout
		});

		return {
			success: true,
			response: response.data.choices[0].message.content,
			usage: response.data.usage,
			model: response.data.model,
			rawResponse: response.data,
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`LM Studio chat completion failed: ${(error as Error).message}`,
		);
	}
}

async function executeTextCompletion(
	executeFunctions: IExecuteFunctions,
	lmStudioUrl: string,
	itemIndex: number,
): Promise<any> {
	const model = executeFunctions.getNodeParameter('model', itemIndex) as string;
	const prompt = executeFunctions.getNodeParameter('prompt', itemIndex) as string;
	const temperature = executeFunctions.getNodeParameter('temperature', itemIndex) as number;
	const maxTokens = executeFunctions.getNodeParameter('maxTokens', itemIndex) as number;
	const stream = executeFunctions.getNodeParameter('stream', itemIndex) as boolean;

	const requestBody: any = {
		prompt,
		temperature,
		max_tokens: maxTokens,
		stream,
	};

	if (model) {
		requestBody.model = model;
	}

	try {
		const response = await axios.post(`${lmStudioUrl}/v1/completions`, requestBody, {
			headers: {
				'Content-Type': 'application/json',
			},
			timeout: 60000, // 60 second timeout
		});

		return {
			success: true,
			response: response.data.choices[0].text,
			usage: response.data.usage,
			model: response.data.model,
			rawResponse: response.data,
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`LM Studio text completion failed: ${(error as Error).message}`,
		);
	}
}

async function executeListModels(
	executeFunctions: IExecuteFunctions,
	lmStudioUrl: string,
): Promise<any> {
	try {
		const response = await axios.get(`${lmStudioUrl}/v1/models`, {
			timeout: 10000, // 10 second timeout
		});

		return {
			success: true,
			models: response.data.data,
			count: response.data.data.length,
			rawResponse: response.data,
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`LM Studio list models failed: ${(error as Error).message}`,
		);
	}
}

class LMStudioAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LM Studio Agent',
		name: 'lmStudioAgent',
		icon: 'fa:robot',
		group: ['transform'],
		version: 1,
		description: 'Interact with LM Studio for local LLM operations',
		defaults: {
			name: 'LM Studio Agent',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'LM Studio URL',
				name: 'lmStudioUrl',
				type: 'string',
				default: 'http://localhost:1234',
				placeholder: 'http://localhost:1234',
				description: 'LM Studio server URL',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Chat Completion',
						value: 'chat',
						description: 'Send a chat message to the LLM',
					},
					{
						name: 'Text Completion',
						value: 'completion',
						description: 'Complete text using the LLM',
					},
					{
						name: 'List Models',
						value: 'listModels',
						description: 'Get available models from LM Studio',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
				placeholder: 'llama-2-7b-chat',
				description: 'Model name to use (leave empty for default)',
				displayOptions: {
					show: {
						operation: ['chat', 'completion'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				placeholder: 'Hello, how can you help me?',
				description: 'Message to send to the LLM',
				required: true,
				displayOptions: {
					show: {
						operation: ['chat'],
					},
				},
			},
			{
				displayName: 'System Message',
				name: 'systemMessage',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: 'You are a helpful assistant.',
				description: 'System message to set context for the LLM',
				displayOptions: {
					show: {
						operation: ['chat'],
					},
				},
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				placeholder: 'Complete this text...',
				description: 'Text prompt for completion',
				required: true,
				displayOptions: {
					show: {
						operation: ['completion'],
					},
				},
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.7,
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 2,
				},
				description: 'Temperature for response generation (0.0 to 2.0)',
				displayOptions: {
					show: {
						operation: ['chat', 'completion'],
					},
				},
			},
			{
				displayName: 'Max Tokens',
				name: 'maxTokens',
				type: 'number',
				default: 100,
				typeOptions: {
					minValue: 1,
					maxValue: 4096,
				},
				description: 'Maximum number of tokens to generate',
				displayOptions: {
					show: {
						operation: ['chat', 'completion'],
					},
				},
			},
			{
				displayName: 'Stream Response',
				name: 'stream',
				type: 'boolean',
				default: false,
				description: 'Whether to stream the response',
				displayOptions: {
					show: {
						operation: ['chat', 'completion'],
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
				const lmStudioUrl = this.getNodeParameter('lmStudioUrl', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let result: any;

				switch (operation) {
					case 'chat':
						result = await executeChatCompletion(this, lmStudioUrl, i);
						break;
					case 'completion':
						result = await executeTextCompletion(this, lmStudioUrl, i);
						break;
					case 'listModels':
						result = await executeListModels(this, lmStudioUrl);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push({
					json: {
						operation,
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

export { LMStudioAgent };
