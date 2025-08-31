# Intelligence Hub for n8n

A comprehensive suite of custom nodes for n8n that creates a unified intelligence hub for orchestrating AI agents, tools, and processes across your local network.

## Overview

The Intelligence Hub provides a visual, web-based interface for managing and coordinating various AI and automation components from a single control plane. It extends n8n's workflow capabilities with specialized nodes for:

- **Terminal operations** (local and remote via SSH)
- **LLM integration** (LM Studio and other local models)
- **MCP server connectivity** (Model Context Protocol)
- **Web browsing automation** (screenshots, form filling, interaction)
- **System monitoring** (health checks, performance metrics, network scanning)

## Available Nodes

### 1. Terminal Agent
Execute commands locally or on remote machines via SSH.

**Features:**
- Local command execution
- Remote SSH execution with key or password auth
- Real-time output streaming
- Working directory support
- Configurable timeouts

**Use Cases:**
- Deploy code to remote servers
- Run system maintenance tasks
- Execute build scripts
- Monitor log files

### 2. LM Studio Agent
Direct integration with LM Studio for local LLM operations.

**Features:**
- Chat completions
- Text completions
- Model listing and switching
- Streaming responses
- Custom temperature and token controls

**Use Cases:**
- Code generation and review
- Document analysis
- Natural language processing
- AI-assisted decision making

### 3. MCP Connector
Connect to Model Context Protocol servers for extended tool access.

**Features:**
- WebSocket and HTTP connectivity
- Tool discovery and execution
- Resource access and management
- Custom message protocols
- Real-time communication

**Use Cases:**
- Access external APIs through MCP
- Extend LLM capabilities with tools
- Connect to specialized services
- Protocol-based integrations

### 4. Web Browse Agent
Automated web browsing with interaction capabilities.

**Features:**
- Page navigation and screenshots
- Element interaction (click, fill forms)
- Text extraction
- JavaScript execution
- Viewport and user agent control

**Use Cases:**
- Web scraping and monitoring
- Automated form submissions
- UI testing and validation
- Content extraction

### 5. Hub Monitor
System health and performance monitoring.

**Features:**
- System health checks (CPU, memory, disk)
- Service status monitoring
- Network scanning and discovery
- Process monitoring
- Performance metrics collection

**Use Cases:**
- Infrastructure monitoring
- Service health dashboards
- Network topology discovery
- Performance optimization

## Installation

The Intelligence Hub is designed to be built and deployed as part of the n8n monorepo.

### Prerequisites

- Node.js >= 22.16
- pnpm >= 10.2.1
- Operating system: Windows, macOS, or Linux

### Build Process

1. **Install dependencies:**
   ```bash
   cd n8n
   pnpm install
   ```

2. **Build the intelligence hub package:**
   ```bash
   cd packages/@n8n/intelligence-hub
   pnpm build
   ```

3. **Start n8n with the intelligence hub nodes:**
   ```bash
   cd ../../../
   pnpm dev
   ```

## Usage Examples

### Example 1: AI-Assisted Code Deployment

Create a workflow that:
1. Uses **LM Studio Agent** to review code changes
2. Uses **Terminal Agent** to run tests locally
3. Uses **Terminal Agent** (SSH) to deploy to remote server
4. Uses **Hub Monitor** to verify deployment health

### Example 2: Automated Web Monitoring

Create a workflow that:
1. Uses **Web Browse Agent** to navigate to target websites
2. Uses **Web Browse Agent** to take screenshots
3. Uses **LM Studio Agent** to analyze content changes
4. Uses **Terminal Agent** to send notifications

### Example 3: Infrastructure Management

Create a workflow that:
1. Uses **Hub Monitor** to scan network for services
2. Uses **Terminal Agent** to check service logs
3. Uses **MCP Connector** to access monitoring APIs
4. Uses **LM Studio Agent** to generate status reports

## Configuration

### LM Studio Integration
Ensure LM Studio is running and accessible:
```bash
# Default LM Studio server
http://localhost:1234
```

### MCP Server Setup
Configure MCP servers according to your needs:
```json
{
  "myMCPServer": "ws://localhost:8080",
  "apiMCPServer": "http://localhost:3001"
}
```

### SSH Configuration
For remote terminal access, set up SSH keys or use password authentication:
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key to remote server
ssh-copy-id user@remote-server
```

## Architecture

The Intelligence Hub follows n8n's node architecture patterns:

- **Modular Design**: Each component is a separate node type
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error handling with continue-on-fail support
- **Performance**: Async operations with proper resource cleanup
- **Security**: SSH key support, configurable timeouts, input validation

## Node Development

Each node implements the `INodeType` interface and provides:

- **Description**: UI configuration and parameter definitions
- **Execute Method**: Main logic implementation
- **Type Safety**: Full TypeScript typing
- **Error Handling**: Proper error propagation and user feedback

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   - Ensure all dependencies are installed: `pnpm install`
   - Check TypeScript configuration in `tsconfig.json`

2. **SSH Connection Failures**
   - Verify SSH key permissions (600 for private keys)
   - Check network connectivity and firewall settings
   - Validate SSH server configuration

3. **LM Studio Connection Issues**
   - Ensure LM Studio server is running
   - Check port configuration (default: 1234)
   - Verify API endpoints are accessible

4. **Performance Issues**
   - Monitor system resources with Hub Monitor
   - Adjust timeout values for long-running operations
   - Consider parallel execution for independent tasks

## Contributing

The Intelligence Hub is designed to be extensible. To add new nodes:

1. Create a new node directory under `src/nodes/`
2. Implement the `INodeType` interface
3. Add the node export to `src/index.ts`
4. Update this README with documentation

## Security Considerations

- **SSH Keys**: Store private keys securely and use appropriate permissions
- **Network Access**: Configure firewalls to restrict access to necessary services
- **Input Validation**: All user inputs are validated before execution
- **Process Isolation**: Commands run in isolated processes with timeouts
- **Error Handling**: Sensitive information is not exposed in error messages

## License

This package follows the same licensing as the main n8n project. See the main n8n repository for license details.
