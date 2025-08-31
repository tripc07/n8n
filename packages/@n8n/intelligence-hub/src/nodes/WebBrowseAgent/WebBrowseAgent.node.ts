import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import puppeteer from 'puppeteer';

async function executeNavigate(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const url = executeFunctions.getNodeParameter('url', itemIndex) as string;

	try {
		await page.goto(url, { waitUntil: 'networkidle2' });
		const title = await page.title();
		const currentUrl = page.url();

		return {
			success: true,
			url: currentUrl,
			title,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Navigation failed: ${(error as Error).message}`,
		);
	}
}

async function executeScreenshot(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const screenshotOptions = executeFunctions.getNodeParameter(
		'screenshotOptions',
		itemIndex,
	) as any;

	try {
		const screenshot = await page.screenshot({
			encoding: 'base64',
			fullPage: screenshotOptions.fullPage !== false,
			quality: screenshotOptions.quality || 90,
			type: 'jpeg',
		});

		return {
			success: true,
			screenshot: `data:image/jpeg;base64,${screenshot}`,
			url: page.url(),
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Screenshot failed: ${(error as Error).message}`,
		);
	}
}

async function executeGetText(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const selector = executeFunctions.getNodeParameter('selector', itemIndex) as string;

	try {
		await page.waitForSelector(selector, { timeout: 5000 });
		const text = await page.$eval(selector, (el: any) => el.textContent || el.innerText);

		return {
			success: true,
			text: text.trim(),
			selector,
			url: page.url(),
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Get text failed: ${(error as Error).message}`,
		);
	}
}

async function executeClick(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const selector = executeFunctions.getNodeParameter('selector', itemIndex) as string;

	try {
		await page.waitForSelector(selector, { timeout: 5000 });
		await page.click(selector);

		return {
			success: true,
			action: 'clicked',
			selector,
			url: page.url(),
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Click failed: ${(error as Error).message}`,
		);
	}
}

async function executeFillForm(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const selector = executeFunctions.getNodeParameter('selector', itemIndex) as string;
	const textValue = executeFunctions.getNodeParameter('textValue', itemIndex) as string;

	try {
		await page.waitForSelector(selector, { timeout: 5000 });
		await page.focus(selector);
		await page.keyboard.down('Control');
		await page.keyboard.press('KeyA');
		await page.keyboard.up('Control');
		await page.type(selector, textValue);

		return {
			success: true,
			action: 'filled',
			selector,
			value: textValue,
			url: page.url(),
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Fill form failed: ${(error as Error).message}`,
		);
	}
}

async function executeWaitForElement(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const selector = executeFunctions.getNodeParameter('selector', itemIndex) as string;
	const waitTimeout = executeFunctions.getNodeParameter('waitTimeout', itemIndex) as number;

	try {
		await page.waitForSelector(selector, { timeout: waitTimeout });

		return {
			success: true,
			action: 'element_found',
			selector,
			url: page.url(),
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Wait for element failed: ${(error as Error).message}`,
		);
	}
}

async function executeScript(
	executeFunctions: IExecuteFunctions,
	page: any,
	itemIndex: number,
): Promise<any> {
	const jsCode = executeFunctions.getNodeParameter('jsCode', itemIndex) as string;

	try {
		const result = await page.evaluate(jsCode);

		return {
			success: true,
			result,
			code: jsCode,
			url: page.url(),
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Script execution failed: ${(error as Error).message}`,
		);
	}
}

class WebBrowseAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Web Browse Agent',
		name: 'webBrowseAgent',
		icon: 'fa:globe',
		group: ['transform'],
		version: 1,
		description: 'Automated web browsing with screenshot and interaction capabilities',
		defaults: {
			name: 'Web Browse Agent',
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
						name: 'Navigate',
						value: 'navigate',
						description: 'Navigate to a URL',
					},
					{
						name: 'Screenshot',
						value: 'screenshot',
						description: 'Take a screenshot of the current page',
					},
					{
						name: 'Get Text',
						value: 'getText',
						description: 'Extract text content from page',
					},
					{
						name: 'Click Element',
						value: 'click',
						description: 'Click on an element',
					},
					{
						name: 'Fill Form',
						value: 'fillForm',
						description: 'Fill out a form field',
					},
					{
						name: 'Wait for Element',
						value: 'waitForElement',
						description: 'Wait for an element to appear',
					},
					{
						name: 'Execute Script',
						value: 'executeScript',
						description: 'Execute JavaScript on the page',
					},
				],
				default: 'navigate',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: 'URL to navigate to',
				required: true,
				displayOptions: {
					show: {
						operation: ['navigate'],
					},
				},
			},
			{
				displayName: 'Selector',
				name: 'selector',
				type: 'string',
				default: '',
				placeholder: '#button-id, .class-name, button[type="submit"]',
				description: 'CSS selector for the element',
				required: true,
				displayOptions: {
					show: {
						operation: ['click', 'fillForm', 'waitForElement', 'getText'],
					},
				},
			},
			{
				displayName: 'Text Value',
				name: 'textValue',
				type: 'string',
				default: '',
				placeholder: 'Text to enter',
				description: 'Text value to enter in the form field',
				required: true,
				displayOptions: {
					show: {
						operation: ['fillForm'],
					},
				},
			},
			{
				displayName: 'JavaScript Code',
				name: 'jsCode',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: 'return document.title;',
				description: 'JavaScript code to execute',
				required: true,
				displayOptions: {
					show: {
						operation: ['executeScript'],
					},
				},
			},
			{
				displayName: 'Screenshot Options',
				name: 'screenshotOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['screenshot'],
					},
				},
				options: [
					{
						displayName: 'Full Page',
						name: 'fullPage',
						type: 'boolean',
						default: true,
						description: 'Capture the full scrollable page',
					},
					{
						displayName: 'Quality',
						name: 'quality',
						type: 'number',
						default: 90,
						typeOptions: {
							minValue: 0,
							maxValue: 100,
						},
						description: 'JPEG quality (0-100)',
					},
				],
			},
			{
				displayName: 'Browser Options',
				name: 'browserOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Headless',
						name: 'headless',
						type: 'boolean',
						default: true,
						description: 'Run browser in headless mode',
					},
					{
						displayName: 'User Agent',
						name: 'userAgent',
						type: 'string',
						default: '',
						description: 'Custom user agent string',
					},
					{
						displayName: 'Viewport Width',
						name: 'viewportWidth',
						type: 'number',
						default: 1280,
						description: 'Browser viewport width',
					},
					{
						displayName: 'Viewport Height',
						name: 'viewportHeight',
						type: 'number',
						default: 720,
						description: 'Browser viewport height',
					},
				],
			},
			{
				displayName: 'Wait Timeout (ms)',
				name: 'waitTimeout',
				type: 'number',
				default: 5000,
				description: 'Maximum time to wait for elements (milliseconds)',
				displayOptions: {
					show: {
						operation: ['waitForElement'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let browser: any = null;
		let page: any = null;

		try {
			// Initialize browser once for all items
			const browserOptions = this.getNodeParameter('browserOptions', 0) as any;
			browser = await puppeteer.launch({
				headless: browserOptions.headless !== false,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			});

			page = await browser.newPage();

			// Set viewport if specified
			if (browserOptions.viewportWidth || browserOptions.viewportHeight) {
				await page.setViewport({
					width: browserOptions.viewportWidth || 1280,
					height: browserOptions.viewportHeight || 720,
				});
			}

			// Set user agent if specified
			if (browserOptions.userAgent) {
				await page.setUserAgent(browserOptions.userAgent);
			}

			for (let i = 0; i < items.length; i++) {
				try {
					const operation = this.getNodeParameter('operation', i) as string;
					let result: any;

					switch (operation) {
						case 'navigate':
							result = await executeNavigate(this, page, i);
							break;
						case 'screenshot':
							result = await executeScreenshot(this, page, i);
							break;
						case 'getText':
							result = await executeGetText(this, page, i);
							break;
						case 'click':
							result = await executeClick(this, page, i);
							break;
						case 'fillForm':
							result = await executeFillForm(this, page, i);
							break;
						case 'waitForElement':
							result = await executeWaitForElement(this, page, i);
							break;
						case 'executeScript':
							result = await executeScript(this, page, i);
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
		} finally {
			// Clean up browser
			if (browser) {
				await browser.close();
			}
		}

		return [returnData];
	}
}

export { WebBrowseAgent };
