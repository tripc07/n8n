# How to Find Your Intelligence Hub Nodes in n8n

## 🔍 Where to Look for the Nodes

1. **Open n8n**: Go to http://localhost:5678 in your browser
2. **Create a workflow**: Click the "+" button to create a new workflow
3. **Add a node**: Click the "+" button on the canvas to add a node
4. **Search for nodes**: In the node panel that opens, you can:

### Option 1: Search by Name
- Type "Terminal" to find **Terminal Agent**
- Type "LM Studio" to find **LM Studio Agent**
- Type "MCP" to find **MCP Connector**
- Type "Web Browse" to find **Web Browse Agent**
- Type "Hub Monitor" to find **Hub Monitor**

### Option 2: Browse by Category
The nodes should appear in these categories:
- **Terminal Agent**: Transform category
- **LM Studio Agent**: AI category
- **MCP Connector**: Developer Tools category
- **Web Browse Agent**: Developer Tools category
- **Hub Monitor**: Monitoring category

## 🚨 If You Don't See the Nodes

If the Intelligence Hub nodes are not visible, it means n8n isn't discovering them as workspace packages. This is common with development setups.

### Quick Test
You can verify if the nodes are being loaded by checking the browser's developer console:
1. Open your browser's dev tools (F12)
2. Look for any errors related to loading nodes
3. Check if "Intelligence Hub" appears in any logs

## 📦 Alternative: Install as Community Package

If the workspace approach isn't working, we can package the Intelligence Hub as a proper npm package for installation.

## 🔧 Current Status Check

The Intelligence Hub has:
✅ Proper package.json configuration
✅ All 5 nodes compiled successfully
✅ Correct export patterns
✅ Added to CLI dependencies
✅ n8n configuration section

If nodes still don't appear, we may need to adjust the discovery mechanism.
