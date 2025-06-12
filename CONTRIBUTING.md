# Contributing to Trello Desktop MCP

We welcome contributions to the Trello Desktop MCP project! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/trello-desktop-mcp.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit your changes: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Type check
npm run type-check
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Add types for all parameters and return values
- Use meaningful variable and function names

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Testing

- Test your changes with Claude Desktop
- Ensure all tools work as expected
- Check error handling

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure your code builds without errors
3. Update the version number if appropriate
4. The PR will be merged once reviewed and approved

## Questions?

Feel free to open an issue for any questions or concerns.
