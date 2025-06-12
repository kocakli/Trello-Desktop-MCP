# Troubleshooting Guide

This comprehensive guide helps you diagnose and resolve common issues with Trello Desktop MCP.

## Quick Diagnostic Checklist

Start with these quick checks:

- [ ] Claude Desktop is completely restarted (not just closed)
- [ ] Trello API credentials are valid and have proper permissions
- [ ] File path in Claude Desktop config points to `dist/index.js` 
- [ ] Project was built successfully (`npm run build`)
- [ ] Configuration file uses absolute paths
- [ ] JSON configuration syntax is valid

## Common Issues and Solutions

### Installation and Setup Issues

#### Issue: "No Trello tools available" in Claude Desktop

**Symptoms**:
- Claude Desktop doesn't show any Trello tools
- No response when asking about Trello functionality
- MCP connection appears inactive

**Possible Causes and Solutions**:

1. **Path Configuration Issue**
   ```json
   // ❌ Incorrect - relative path
   "args": ["./dist/index.js"]
   
   // ✅ Correct - absolute path
   "args": ["/Users/username/Projects/trello-desktop-mcp/dist/index.js"]
   ```

2. **Build Missing or Failed**
   ```bash
   # Check if dist directory exists
   ls -la dist/
   
   # If missing, rebuild
   npm run clean
   npm run build
   
   # Verify build success
   ls -la dist/index.js
   ```

3. **Claude Desktop Not Restarted**
   - Completely quit Claude Desktop (Cmd+Q on Mac, not just close window)
   - Wait 5 seconds
   - Restart Claude Desktop
   - Wait for full startup before testing

4. **Configuration File Location**
   ```bash
   # Verify config file location
   # macOS
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   dir %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux
   ls -la ~/.config/Claude/claude_desktop_config.json
   ```

5. **JSON Syntax Errors**
   ```bash
   # Validate JSON syntax
   python -m json.tool ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Or use online JSON validator
   ```

#### Issue: "Invalid credentials" or Authentication Failures

**Symptoms**:
- Error messages about invalid API key or token
- 401 Unauthorized responses
- "Permission denied" errors

**Solutions**:

1. **Verify API Credentials**
   ```bash
   # Test credentials with curl
   curl "https://api.trello.com/1/members/me?key=YOUR_KEY&token=YOUR_TOKEN"
   
   # Should return your user information
   ```

2. **Regenerate Trello Token**
   - Visit [https://trello.com/app-key](https://trello.com/app-key)
   - Generate new token with:
     - **Read access**: Yes
     - **Write access**: Yes  
     - **Expiration**: Never (recommended for personal use)

3. **Check Token Permissions**
   - Ensure token has read/write permissions
   - Verify token hasn't expired
   - Confirm token is associated with correct Trello account

4. **Update Configuration**
   ```json
   {
     "mcpServers": {
       "trello": {
         "command": "node",
         "args": ["/absolute/path/to/dist/index.js"],
         "env": {
           "TRELLO_API_KEY": "your-new-api-key",
           "TRELLO_TOKEN": "your-new-token"
         }
       }
     }
   }
   ```

### Runtime Issues

#### Issue: "Rate limit exceeded" Errors

**Symptoms**:
- HTTP 429 errors
- Delays in tool responses
- "Too many requests" messages

**Solutions**:

1. **Understand Rate Limits**
   - Trello API allows 300 requests per 10 seconds per API key
   - Rate limits reset every 10 seconds
   - MCP server includes automatic retry logic

2. **Reduce Request Frequency**
   ```
   # Instead of multiple rapid requests
   "Show me board 1"
   "Show me board 2" 
   "Show me board 3"
   
   # Use batch requests
   "Show me details for all my boards"
   ```

3. **Wait for Rate Limit Reset**
   - Rate limits automatically reset
   - MCP server will retry automatically
   - Wait 10-15 seconds before retrying manually

#### Issue: "Resource not found" (404 Errors)

**Symptoms**:
- "Board not found" errors
- "Card not found" errors
- "List not found" errors

**Solutions**:

1. **Verify Resource IDs**
   ```bash
   # Board IDs are 24-character hex strings
   # Valid: 507f1f77bcf86cd799439011
   # Invalid: board_123 or short-id
   ```

2. **Check Access Permissions**
   - Ensure you have access to the board/card
   - Verify the resource hasn't been deleted
   - Confirm you're a member of private boards

3. **Use Search to Find Resources**
   ```
   # Find boards by name
   "Search for boards named 'Project Management'"
   
   # Find cards by title
   "Search for cards containing 'bug fix'"
   ```

#### Issue: Network Connection Problems

**Symptoms**:
- Timeout errors
- "Unable to reach Trello API" messages
- Intermittent connection failures

**Solutions**:

1. **Check Internet Connection**
   ```bash
   # Test basic connectivity
   ping api.trello.com
   
   # Test HTTPS access
   curl -I https://api.trello.com/1/members/me
   ```

2. **Firewall and Proxy Issues**
   - Check corporate firewall settings
   - Verify proxy configuration
   - Ensure HTTPS traffic is allowed

3. **DNS Resolution**
   ```bash
   # Test DNS resolution
   nslookup api.trello.com
   ```

### Performance Issues

#### Issue: Slow Response Times

**Symptoms**:
- Long delays before tool responses
- Timeouts on large operations
- Poor performance with large boards

**Solutions**:

1. **Optimize Request Scope**
   ```
   # Instead of broad requests
   "Show me everything about my board"
   
   # Use specific requests
   "Show me just the lists in my board"
   "Show me cards in the 'To Do' list"
   ```

2. **Use Filtering Options**
   ```
   # Filter by status
   "Show me only open cards in my board"
   
   # Limit results
   "Show me the first 20 cards in my board"
   ```

3. **Break Down Large Operations**
   ```
   # Instead of batch operations
   "Update 50 cards at once"
   
   # Process in smaller batches
   "Update cards in the 'To Do' list"
   "Update cards in the 'In Progress' list"
   ```

### Data and Content Issues

#### Issue: Missing or Incomplete Data

**Symptoms**:
- Cards missing expected fields
- Empty board responses
- Incomplete member information

**Solutions**:

1. **Request Detailed Information**
   ```
   # Basic request
   "Show me my board"
   
   # Detailed request
   "Show me my board with all lists, cards, members, and labels"
   ```

2. **Check Data Availability**
   - Verify data exists in Trello web interface
   - Confirm permissions to access detailed data
   - Check if data was recently modified

3. **Use Specific Detail Tools**
   ```
   # Get comprehensive card details
   "Show me complete details for card 'Task Name'"
   
   # Get member information
   "Show me information about @username"
   ```

#### Issue: Character Encoding Problems

**Symptoms**:
- Special characters display incorrectly
- Unicode symbols broken
- Non-English text garbled

**Solutions**:

1. **Verify Environment Settings**
   ```bash
   # Check locale settings
   echo $LANG
   
   # Should be UTF-8 compatible (e.g., en_US.UTF-8)
   ```

2. **Update Terminal/Console Settings**
   - Ensure Claude Desktop uses UTF-8 encoding
   - Check system locale configuration

## Advanced Troubleshooting

### Log Analysis

#### Enable Debug Logging

```json
// Add to Claude Desktop config
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your-key",
        "TRELLO_TOKEN": "your-token",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### Log File Locations

```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp-server-trello.log

# Windows  
type %APPDATA%\Claude\Logs\mcp-server-trello.log

# Linux
tail -f ~/.config/Claude/Logs/mcp-server-trello.log
```

#### Common Log Patterns

```bash
# Successful operations
grep "successful" mcp-server-trello.log

# Error patterns
grep "error\|ERROR" mcp-server-trello.log

# Rate limit issues
grep "rate limit\|429" mcp-server-trello.log

# Network issues
grep "timeout\|ENOTFOUND" mcp-server-trello.log
```

### Manual API Testing

#### Test API Access Directly

```bash
# Test basic API access
curl -X GET \
  "https://api.trello.com/1/members/me/boards?key=YOUR_KEY&token=YOUR_TOKEN" \
  -H "Accept: application/json"

# Test specific board access
curl -X GET \
  "https://api.trello.com/1/boards/BOARD_ID?key=YOUR_KEY&token=YOUR_TOKEN" \
  -H "Accept: application/json"

# Test card creation
curl -X POST \
  "https://api.trello.com/1/cards?key=YOUR_KEY&token=YOUR_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Card",
    "idList": "LIST_ID"
  }'
```

### Environment Validation

#### System Requirements Check

```bash
# Node.js version (should be 18+)
node --version

# NPM version
npm --version

# TypeScript version (should be 5.7+)
npx tsc --version

# Check available memory
free -h  # Linux
vm_stat  # macOS
```

#### Dependency Verification

```bash
# Check installed dependencies
npm list

# Verify specific dependencies
npm list @modelcontextprotocol/sdk
npm list zod

# Check for dependency conflicts
npm audit
```

## Environment-Specific Issues

### macOS Issues

#### Issue: Permission Denied Errors

```bash
# Fix file permissions
chmod +x dist/index.js

# Fix directory permissions
chmod -R 755 /path/to/trello-desktop-mcp

# Check file ownership
ls -la dist/index.js
```

#### Issue: Path Resolution Problems

```bash
# Use full absolute paths
pwd  # Get current directory
/Users/username/Projects/trello-desktop-mcp

# Update config with full path
"/Users/username/Projects/trello-desktop-mcp/dist/index.js"
```

### Windows Issues

#### Issue: Command Not Found

```cmd
# Verify Node.js in PATH
where node

# Use full path to node if needed
"C:\\Program Files\\nodejs\\node.exe"
```

#### Issue: Path Separator Problems

```json
// Use forward slashes or escaped backslashes
"args": ["C:/Projects/trello-desktop-mcp/dist/index.js"]
// OR
"args": ["C:\\Projects\\trello-desktop-mcp\\dist\\index.js"]
```

### Linux Issues

#### Issue: Node.js Version Problems

```bash
# Install Node.js 18+ via package manager
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL/Fedora
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

## Getting Additional Help

### Information to Collect

When reporting issues, include:

1. **System Information**
   ```bash
   # Operating system and version
   uname -a  # Linux/macOS
   ver       # Windows
   
   # Node.js version
   node --version
   
   # NPM version
   npm --version
   ```

2. **Configuration**
   ```json
   // Sanitized version of your config (remove credentials)
   {
     "mcpServers": {
       "trello": {
         "command": "node",
         "args": ["/path/to/dist/index.js"],
         "env": {
           "TRELLO_API_KEY": "[REDACTED]",
           "TRELLO_TOKEN": "[REDACTED]"
         }
       }
     }
   }
   ```

3. **Error Messages**
   - Complete error text from Claude Desktop
   - Relevant log file entries
   - Steps to reproduce the issue

4. **Build Information**
   ```bash
   # Verify build status
   npm run type-check
   ls -la dist/
   ```

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/trello-desktop-mcp/issues)
- **Documentation**: Check other wiki pages for detailed information
- **Claude Desktop Community**: Claude Desktop user forums and communities

### Professional Support

For production deployments:
- Review [Deployment Guide](Deployment) for production considerations
- Consider [Performance](Performance) optimization techniques
- Implement [Monitoring](Monitoring) for proactive issue detection

---

**Quick Resolution Flowchart**:

1. **Tools not appearing** → Check path configuration and restart Claude Desktop
2. **Authentication errors** → Verify and regenerate Trello credentials
3. **Rate limits** → Wait 10 seconds and reduce request frequency
4. **Network errors** → Check internet connection and firewall settings
5. **Performance issues** → Use more specific requests and filtering
6. **Still having issues** → Enable debug logging and check log files