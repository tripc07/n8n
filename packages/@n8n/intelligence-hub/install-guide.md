# Intelligence Hub Installation Guide

Since n8n is already running successfully at http://localhost:5678, here's how to integrate the Intelligence Hub nodes:

## Option 1: Community Nodes Installation (Recommended)

The Intelligence Hub can be packaged as a community node package:

### 1. Package the Intelligence Hub
```bash
cd packages/@n8n/intelligence-hub
npm pack
```

### 2. Install via n8n UI
1. Open http://localhost:5678
2. Go to Settings → Community Nodes
3. Install package: `@n8n/intelligence-hub`

## Option 2: Development Integration

To run the development version with Intelligence Hub built-in:

### 1. Stop current n8n instance
Press Ctrl+C in the terminal running npx n8n

### 2. Wait for pnpm install to complete
The `pnpm install` should finish in the background

### 3. Build and start development version
```bash
# Once pnpm install completes:
cd packages/@n8n/intelligence-hub
pnpm build

# Start development n8n with Intelligence Hub
cd ../../../
pnpm dev
```

## Option 3: Manual Node Installation

Copy the built nodes to your n8n installation:

### 1. Build the Intelligence Hub
```bash
cd packages/@n8n/intelligence-hub
pnpm install
pnpm build
```

### 2. Copy to global n8n
```bash
# Find your global n8n installation
npm list -g n8n

# Copy the intelligence hub nodes
cp -r dist/* ~/.n8n/nodes/
```

## Current Status

✅ **n8n is running** at http://localhost:5678
✅ **Intelligence Hub is built** with 5 custom nodes
⏳ **Integration pending** - choose an option above

## What You Get

Once integrated, you'll see 5 new nodes in the n8n editor:

- **Terminal Agent** - Execute commands locally/remotely
- **LM Studio Agent** - Connect to your local LLMs
- **MCP Connector** - Connect to MCP servers
- **Web Browse Agent** - Automate web browsing
- **Hub Monitor** - Monitor system health

These will appear in the "Intelligence Hub" category in the node palette.
