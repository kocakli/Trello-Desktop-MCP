# Development Guide

This guide covers everything you need to know about contributing to and developing with the Trello Desktop MCP project.

## Development Setup

### Prerequisites

- **Node.js 18+** with npm
- **TypeScript 5.7+** 
- **Git** for version control
- **Claude Desktop** for testing
- **Trello account** with API access

### Local Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/trello-desktop-mcp.git
cd trello-desktop-mcp

# Install dependencies
npm install

# Set up environment variables for testing
cp .env.example .env
# Edit .env with your Trello credentials

# Build the project
npm run build

# Run type checking
npm run type-check

# Start development with file watching
npm run dev
```

### Development Scripts

```bash
# Build and compilation
npm run build          # Compile TypeScript to JavaScript
npm run clean          # Remove dist directory
npm run rebuild        # Clean and build

# Development and testing
npm run type-check     # Run TypeScript type checking
npm run lint           # Run ESLint (if configured)
npm run test           # Run test suite (if available)

# Utility scripts
npm run prepare        # Pre-commit build (runs automatically)
```

## Project Structure Deep Dive

### Core Architecture

```
src/
├── index.ts              # Desktop MCP server entry point
├── server.ts             # Generic MCP server factory
├── tools/                # Tool implementations by category
│   ├── boards.ts         # Board management operations
│   ├── cards.ts          # Card lifecycle operations
│   ├── lists.ts          # List and comment operations
│   ├── members.ts        # Member and user operations
│   ├── search.ts         # Universal search functionality
│   └── advanced.ts       # Advanced features and metadata
├── trello/               # API client layer
│   └── client.ts         # HTTP client with retry logic
├── types/                # TypeScript type definitions
│   └── trello.ts         # Trello entity and API types
└── utils/                # Shared utilities
    ├── validation.ts     # Zod schemas and validation
    ├── logger.ts         # Structured logging
    ├── health.ts         # Health check functionality
    └── appInsights.ts    # Telemetry and monitoring
```

### Key Files and Their Responsibilities

| File | Purpose | Key Features |
|------|---------|--------------|
| `index.ts` | MCP server for Claude Desktop | Credential injection, tool routing |
| `server.ts` | Generic MCP server factory | Reusable server implementation |
| `tools/*.ts` | Individual tool implementations | Business logic, validation, formatting |
| `trello/client.ts` | Trello API communication | HTTP client, retry logic, error handling |
| `types/trello.ts` | Type definitions | TypeScript interfaces for all entities |
| `utils/validation.ts` | Input validation | Zod schemas and validation logic |

## Development Patterns

### 1. Tool Development Pattern

Every tool follows this consistent structure:

```typescript
// 1. Import dependencies
import { z } from 'zod';
import { trelloIdSchema, validateArgs } from '../utils/validation.js';
import { TrelloClient } from '../trello/client.js';

// 2. Define validation schema
const toolSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  // Tool-specific parameters
  requiredParam: z.string().min(1, 'Required parameter description'),
  optionalParam: z.string().optional()
});

// 3. Define tool metadata
export const toolDefinition = {
  name: 'tool_name',
  description: 'Clear, user-friendly description of what this tool does',
  inputSchema: {
    type: 'object' as const,
    properties: {
      requiredParam: {
        type: 'string',
        description: 'Description for users'
      },
      optionalParam: {
        type: 'string', 
        description: 'Optional parameter description'
      }
    },
    required: ['requiredParam']
  }
};

// 4. Implement tool handler
export async function handleTool(args: unknown) {
  // Validate input
  const { apiKey, token, ...params } = validateArgs(toolSchema, args);
  
  // Create API client
  const client = new TrelloClient({ apiKey, token });
  
  try {
    // Execute business logic
    const result = await client.apiMethod(params);
    
    // Format response
    return {
      content: [
        {
          type: 'text',
          text: formatResponse(result)
        }
      ]
    };
  } catch (error) {
    // Handle and format errors
    throw error;
  }
}

// 5. Helper functions
function formatResponse(data: any): string {
  // Format data for user consumption
  return `Formatted result: ${JSON.stringify(data, null, 2)}`;
}
```

### 2. API Client Extension Pattern

To add new API endpoints:

```typescript
// In trello/client.ts
export class TrelloClient {
  async newMethod(params: NewMethodParams): Promise<TrelloApiResponse<ReturnType>> {
    return this.makeRequest<ReturnType>(
      '/api/endpoint',
      { 
        method: 'POST',
        body: JSON.stringify(params)
      },
      'Operation description for logging'
    );
  }
}
```

### 3. Type Definition Pattern

Define comprehensive types for all entities:

```typescript
// In types/trello.ts

// Base entity interface
interface TrelloEntity {
  id: string;
  name: string;
  url: string;
}

// Specific entity extending base
export interface TrelloNewEntity extends TrelloEntity {
  // Entity-specific properties
  specificProperty: string;
  optionalProperty?: number;
  complexProperty: {
    nestedProperty: string;
    arrayProperty: string[];
  };
}

// Request/Response types
export interface CreateNewEntityRequest {
  name: string;
  requiredProperty: string;
  optionalProperty?: string;
}

export interface NewEntityApiResponse {
  data: TrelloNewEntity;
  metadata?: ResponseMetadata;
}
```

## Testing Strategy

### Unit Testing

```typescript
// Example test structure
import { describe, it, expect, vi } from 'vitest';
import { handleToolName } from '../tools/example.js';

describe('Tool Name', () => {
  it('should validate required parameters', async () => {
    const invalidArgs = { /* missing required params */ };
    
    await expect(handleToolName(invalidArgs))
      .rejects
      .toThrow('Required parameter validation error');
  });

  it('should execute successful operation', async () => {
    const validArgs = { /* valid parameters */ };
    
    const result = await handleToolName(validArgs);
    
    expect(result).toMatchObject({
      content: expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('expected content')
        })
      ])
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mock('../trello/client.js', () => ({
      TrelloClient: vi.fn().mockImplementation(() => ({
        apiMethod: vi.fn().mockRejectedValue(new Error('API Error'))
      }))
    }));

    const validArgs = { /* valid parameters */ };
    
    await expect(handleToolName(validArgs))
      .rejects
      .toThrow('API Error');
  });
});
```

### Integration Testing

```typescript
// Test with real Trello API (requires test credentials)
describe('Integration Tests', () => {
  const testCredentials = {
    apiKey: process.env.TEST_TRELLO_API_KEY,
    token: process.env.TEST_TRELLO_TOKEN
  };

  it('should interact with real Trello API', async () => {
    const result = await handleGetUserBoards(testCredentials);
    
    expect(result.content[0].text).toContain('boards found');
  });
});
```

### Claude Desktop Testing

```bash
# 1. Build the project
npm run build

# 2. Update Claude Desktop config with local build
# Point to your local dist/index.js

# 3. Test in Claude Desktop
# "Show me my Trello boards"
# "Create a test card in my test board"
```

## Code Quality Standards

### TypeScript Configuration

```json
// tsconfig.json requirements
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noImplicitAny": true,            // No implicit any types
    "noImplicitReturns": true,        // Functions must return values
    "noUnusedLocals": true,           // No unused variables
    "noUnusedParameters": true,       // No unused parameters
    "exactOptionalPropertyTypes": true // Strict optional properties
  }
}
```

### Code Style Guidelines

#### Naming Conventions

```typescript
// Tool names: snake_case for consistency with MCP
export const toolName = 'trello_get_user_boards';

// Function names: camelCase
export async function handleGetUserBoards() {}

// Type names: PascalCase  
export interface TrelloBoard {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Variables: camelCase
const userName = 'john_doe';
```

#### Error Handling

```typescript
// Always provide context in error messages
throw new Error(`Failed to update card ${cardId}: ${error.message}`);

// Use specific error types when possible
if (response.status === 404) {
  throw new Error(`Card ${cardId} not found. It may have been deleted or you may not have access.`);
}

// Provide actionable error messages
throw new Error('Invalid Trello credentials. Please update your API key and token in Claude Desktop settings.');
```

#### Documentation Standards

```typescript
/**
 * Creates a new card in the specified Trello list.
 * 
 * @param args - Card creation parameters
 * @param args.name - Card title (1-16384 characters)
 * @param args.idList - Target list ID (24-character hex string)
 * @param args.desc - Optional card description
 * @param args.due - Optional due date in ISO format
 * @returns MCP response with created card details
 * 
 * @throws {ValidationError} When parameters don't meet requirements
 * @throws {TrelloError} When Trello API operation fails
 * 
 * @example
 * ```typescript
 * const result = await handleCreateCard({
 *   apiKey: 'your-key',
 *   token: 'your-token', 
 *   name: 'New Task',
 *   idList: '507f1f77bcf86cd799439011'
 * });
 * ```
 */
export async function handleCreateCard(args: unknown) {
  // Implementation
}
```

## Contribution Workflow

### 1. Development Process

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes following coding standards
# - Add comprehensive TypeScript types
# - Include input validation with Zod
# - Add error handling with user-friendly messages
# - Include JSDoc documentation

# 3. Test your changes
npm run type-check     # Ensure TypeScript compliance
npm run build          # Verify build succeeds
# Test with Claude Desktop

# 4. Commit with conventional commit format
git commit -m "feat: add advanced card filtering options"

# 5. Push and create pull request
git push origin feature/your-feature-name
```

### 2. Pull Request Guidelines

**PR Requirements**:
- [ ] TypeScript compilation succeeds without errors
- [ ] All new code includes comprehensive type definitions
- [ ] Input validation added for all new parameters
- [ ] Error handling includes user-friendly messages
- [ ] Documentation updated for new features
- [ ] Manual testing completed with Claude Desktop

**PR Description Template**:
```markdown
## Description
Brief description of changes and motivation.

## Changes Made
- [ ] Added new tool: `tool_name`
- [ ] Updated existing functionality
- [ ] Fixed bug in component X
- [ ] Added validation for parameter Y

## Testing
- [ ] TypeScript compilation passes
- [ ] Manual testing with Claude Desktop
- [ ] Error scenarios tested
- [ ] Edge cases considered

## Documentation
- [ ] Tool documentation added/updated
- [ ] Type definitions documented
- [ ] Usage examples provided
```

### 3. Code Review Process

**Review Checklist**:
- [ ] **Type Safety**: All parameters and return types defined
- [ ] **Validation**: Comprehensive input validation with Zod
- [ ] **Error Handling**: User-friendly error messages
- [ ] **Documentation**: Clear descriptions and examples
- [ ] **Consistency**: Follows established patterns
- [ ] **Testing**: Adequate test coverage
- [ ] **Performance**: No obvious performance issues

## Advanced Development Topics

### Custom Tool Creation

```typescript
// Template for new tool creation
// 1. Define in appropriate tools/*.ts file
export const customTool = {
  name: 'trello_custom_operation',
  description: 'Performs custom Trello operation',
  inputSchema: {
    type: 'object' as const,
    properties: {
      // Define input schema
    },
    required: ['required_param']
  }
};

export async function handleCustomOperation(args: unknown) {
  // Implementation following standard pattern
}

// 2. Register in index.ts
case 'trello_custom_operation':
  result = await handleCustomOperation(argsWithCredentials);
  break;

// 3. Add to tool list in ListToolsRequestSchema handler
tools: [
  // ... existing tools
  customTool
]
```

### API Client Extension

```typescript
// Extend TrelloClient for new endpoints
export class TrelloClient {
  async customApiCall(params: CustomParams): Promise<TrelloApiResponse<CustomType>> {
    return this.makeRequest<CustomType>(
      `/custom/endpoint/${params.id}`,
      {
        method: 'POST',
        body: JSON.stringify(params.data),
        params: { additionalParam: params.additional }
      },
      `Custom operation for ${params.id}`
    );
  }
}
```

### Monitoring and Telemetry

```typescript
// Add telemetry to new tools
import { logger } from '../utils/logger.js';
import { insights } from '../utils/appInsights.js';

export async function handleNewTool(args: unknown) {
  const startTime = Date.now();
  
  try {
    // Tool implementation
    const result = await executeLogic(args);
    
    // Success telemetry
    const duration = Date.now() - startTime;
    logger.info('New tool executed successfully', { duration: `${duration}ms` });
    insights.trackEvent('NewToolSuccess', { duration: duration.toString() });
    
    return result;
  } catch (error) {
    // Error telemetry
    logger.error('New tool failed', { error: error.message });
    insights.trackException(error as Error, { tool: 'new_tool' });
    throw error;
  }
}
```

## Debugging and Troubleshooting

### Local Debugging

```typescript
// Add debug logging
import { logger } from '../utils/logger.js';

export async function handleTool(args: unknown) {
  logger.debug('Tool called with args', { args });
  
  try {
    const result = await executeLogic(args);
    logger.debug('Tool completed', { result });
    return result;
  } catch (error) {
    logger.error('Tool failed', { error: error.message, stack: error.stack });
    throw error;
  }
}
```

### Claude Desktop Debugging

```bash
# Check Claude Desktop MCP logs
# macOS: ~/Library/Logs/Claude/mcp-server-trello.log
# Windows: %APPDATA%\Claude\Logs\mcp-server-trello.log

# Enable verbose logging in your tool
process.env.LOG_LEVEL = 'debug';
```

### Common Development Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| TypeScript compilation errors | Missing type definitions | Add comprehensive types |
| Tool not appearing in Claude | Registration missing | Add to tool list and handler |
| Validation errors | Zod schema mismatch | Update schema to match inputs |
| API errors | Incorrect parameters | Check Trello API documentation |
| Build failures | Dependency issues | Run `npm install` and check versions |

---

**Next Steps**:
- Review [API Reference](API-Reference) for detailed technical specs
- Check [Best Practices](Best-Practices) for optimization tips
- Explore [Testing](Testing) for comprehensive testing strategies