# Installation Guide

This guide will walk you through setting up Trello Desktop MCP with Claude Desktop.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed on your system
- **Claude Desktop** application installed
- An active **Trello account** with API access
- Basic familiarity with command line operations

## Step 1: Clone and Build the Project

### 1.1 Clone the Repository

```bash
git clone https://github.com/yourusername/trello-desktop-mcp.git
cd trello-desktop-mcp
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Build the Project

```bash
npm run build
```

This creates the compiled JavaScript files in the `dist/` directory that Claude Desktop will use.

## Step 2: Obtain Trello API Credentials

### 2.1 Get Your API Key

1. Visit [https://trello.com/app-key](https://trello.com/app-key)
2. Copy your **API Key** (you'll need this for configuration)

### 2.2 Generate a Token

1. On the same page, click the **Token** link
2. Authorize the application with the following permissions:
   - **Read**: Access to view your boards, cards, and lists
   - **Write**: Ability to create and modify cards, lists, and comments
   - **Never expires**: For continuous access (recommended)
3. Copy the generated **Token**

> **Security Note**: Your API credentials provide full access to your Trello account. Keep them secure and never share them publicly.

## Step 3: Configure Claude Desktop

### 3.1 Locate Configuration File

Find your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 3.2 Add MCP Server Configuration

Edit the configuration file and add the Trello MCP server:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-api-key-here",
        "TRELLO_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Important Configuration Notes**:

1. **Use Absolute Paths**: Replace `/absolute/path/to/trello-desktop-mcp/dist/index.js` with the full path to your installation
2. **Replace Credentials**: Insert your actual API key and token from Step 2
3. **JSON Format**: Ensure proper JSON formatting with no trailing commas

### 3.3 Example Configuration

Here's a complete example configuration:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node", 
      "args": ["/Users/username/Projects/trello-desktop-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        "TRELLO_TOKEN": "x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0"
      }
    }
  }
}
```

## Step 4: Restart Claude Desktop

1. **Completely quit** Claude Desktop (not just close the window)
2. **Restart** Claude Desktop
3. Wait for the application to fully load

## Step 5: Verify Installation

### 5.1 Test Basic Connectivity

In Claude Desktop, try these commands to verify the installation:

```
Show me my Trello boards
```

You should see a list of your Trello boards.

### 5.2 Test Tool Availability

Ask Claude to list available tools:

```
What Trello tools are available?
```

You should see all 20 Trello tools listed and organized by category.

## Common Installation Issues

### Issue: "No Trello tools available"

**Possible Causes & Solutions**:

1. **Path Issue**: Verify the path to `dist/index.js` is absolute and correct
2. **Build Issue**: Run `npm run build` again to ensure the dist folder exists
3. **Restart Required**: Completely restart Claude Desktop
4. **File Permissions**: Ensure Node.js can read the files

### Issue: "Invalid credentials" 

**Possible Causes & Solutions**:

1. **Incorrect API Key/Token**: Double-check your credentials from Trello
2. **Token Permissions**: Ensure your token has read/write permissions
3. **Expired Token**: Generate a new token if the current one expired
4. **Environment Variables**: Verify the credentials are correctly set in the config

### Issue: "Module not found" or Node.js errors

**Possible Causes & Solutions**:

1. **Dependencies**: Run `npm install` to ensure all dependencies are installed
2. **Node Version**: Verify you're using Node.js 18+
3. **Build Process**: Run `npm run type-check` to verify TypeScript compilation

### Issue: Configuration not loading

**Possible Causes & Solutions**:

1. **JSON Syntax**: Validate your JSON configuration file
2. **File Location**: Ensure you're editing the correct config file location
3. **Permissions**: Check file read/write permissions
4. **Backup Config**: Create a backup before making changes

## Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned and dependencies installed
- [ ] Project built successfully (`dist/` folder exists)
- [ ] Trello API key and token obtained
- [ ] Claude Desktop configuration file updated
- [ ] Absolute paths used in configuration
- [ ] Claude Desktop completely restarted
- [ ] Basic Trello commands working

## Next Steps

Once installation is complete:

1. **Explore Available Tools**: Check out the [Available Tools](Available-Tools) reference
2. **Try Examples**: Review [Usage Examples](Usage-Examples) for practical scenarios
3. **Optimize Setup**: Read [Best Practices](Best-Practices) for optimal usage

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](Troubleshooting)
2. Review Claude Desktop's MCP logs
3. [Open an issue](https://github.com/yourusername/trello-desktop-mcp/issues) with detailed error information

---

**Next**: [Quick Start Guide](Quick-Start) to begin using your Trello MCP server.