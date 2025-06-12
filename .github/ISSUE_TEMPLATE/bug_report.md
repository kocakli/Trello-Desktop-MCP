---
name: Bug Report
about: Create a report to help us improve Trello Desktop MCP
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Ask Claude '....'
3. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Error Messages
```
Paste any error messages here
```

## Environment Information
**Please complete the following information:**
- OS: [e.g. macOS 14.1, Windows 11, Ubuntu 22.04]
- Claude Desktop Version: [e.g. 1.0.0]
- Node.js Version: [e.g. 20.9.0]
- Trello MCP Version: [e.g. 1.0.0]

## Configuration
**Claude Desktop Configuration (remove credentials):**
```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "[REDACTED]",
        "TRELLO_TOKEN": "[REDACTED]",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Logs
**Relevant log entries (if available):**
```
Paste relevant log entries here
```

## Additional Context
Add any other context about the problem here. This could include:
- Screenshots
- Trello board structure
- Network conditions
- Recent changes to setup

## Checklist
- [ ] I have checked the [Troubleshooting Guide](https://github.com/kocakli/trello-desktop-mcp/wiki/Troubleshooting)
- [ ] I have searched existing issues for duplicates
- [ ] I have provided all required information above
- [ ] I have removed all sensitive information (API keys, tokens, personal data)