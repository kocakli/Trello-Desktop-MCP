# Tool Development Guide

This guide covers creating custom tools for Trello Desktop MCP, extending functionality, and contributing new features.

## Tool Development Overview

### What is a Tool?

In MCP, a tool is a discrete unit of functionality that:
- Accepts structured input parameters
- Performs a specific operation
- Returns structured output
- Includes comprehensive error handling
- Provides user-friendly descriptions

### Tool Architecture

```typescript
// Tool structure consists of three main components:

// 1. Tool Definition (Schema + Metadata)
export const toolDefinition = {
  name: 'tool_name',
  description: 'User-friendly description',
  inputSchema: { /* JSON Schema */ }
};

// 2. Input Validation (Zod Schema)
const toolSchema = z.object({
  // Parameter definitions with validation
});

// 3. Handler Implementation (Business Logic)
export async function handleTool(args: unknown) {
  // Implementation
}
```

## Creating Your First Tool

### Step 1: Define Tool Requirements

Before coding, define:
- **Purpose**: What specific problem does this tool solve?
- **Input**: What parameters does it need?
- **Output**: What information should it return?
- **Error Cases**: What can go wrong and how to handle it?

### Step 2: Create Tool Schema

```typescript
// Example: Custom board analytics tool
import { z } from 'zod';
import { trelloIdSchema } from '../utils/validation.js';

const boardAnalyticsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  boardId: trelloIdSchema,
  timeframe: z.enum(['week', 'month', 'quarter']).default('month'),
  includeArchived: z.boolean().default(false)
});

type BoardAnalyticsArgs = z.infer<typeof boardAnalyticsSchema>;
```

### Step 3: Define Tool Metadata

```typescript
export const boardAnalyticsTool = {
  name: 'trello_board_analytics',
  description: 'Generate comprehensive analytics for a Trello board including card velocity, member activity, and workflow efficiency',
  inputSchema: {
    type: 'object' as const,
    properties: {
      boardId: {
        type: 'string',
        description: 'The ID of the board to analyze (24-character hex string)'
      },
      timeframe: {
        type: 'string',
        enum: ['week', 'month', 'quarter'],
        description: 'Time period for analysis (default: month)'
      },
      includeArchived: {
        type: 'boolean',
        description: 'Whether to include archived cards in analysis (default: false)'
      }
    },
    required: ['boardId']
  }
};
```

### Step 4: Implement Tool Handler

```typescript
import { TrelloClient } from '../trello/client.js';
import { validateArgs } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export async function handleBoardAnalytics(args: unknown) {
  // Validate input
  const { apiKey, token, boardId, timeframe, includeArchived } = 
    validateArgs(boardAnalyticsSchema, args);
  
  // Create API client
  const client = new TrelloClient({ apiKey, token });
  
  try {
    // Gather data
    const boardData = await client.getBoard(boardId, true);
    const cardActions = await client.getBoardCards(boardId, {
      filter: includeArchived ? 'all' : 'open'
    });
    
    // Perform analysis
    const analytics = analyzeBoard(boardData.data, cardActions.data, timeframe);
    
    // Format response
    const summary = formatAnalytics(analytics);
    
    logger.info('Board analytics generated', { 
      boardId, 
      timeframe, 
      cardCount: cardActions.data.length 
    });
    
    return {
      content: [
        {
          type: 'text',
          text: summary
        }
      ]
    };
    
  } catch (error) {
    logger.error('Board analytics failed', { boardId, error: error.message });
    throw error;
  }
}

// Helper function for analysis logic
function analyzeBoard(board: TrelloBoard, cards: TrelloCard[], timeframe: string) {
  // Implementation of analytics logic
  return {
    cardVelocity: calculateVelocity(cards, timeframe),
    memberActivity: analyzeMemberActivity(cards),
    workflowEfficiency: analyzeWorkflow(board.lists, cards),
    timeframe: timeframe
  };
}

function formatAnalytics(analytics: BoardAnalytics): string {
  return `# Board Analytics Report

## Card Velocity
- Cards completed this ${analytics.timeframe}: ${analytics.cardVelocity.completed}
- Average completion time: ${analytics.cardVelocity.averageTime} days
- Velocity trend: ${analytics.cardVelocity.trend}

## Member Activity
${analytics.memberActivity.map(member => 
  `- ${member.name}: ${member.cardsCompleted} cards, ${member.commentsAdded} comments`
).join('\n')}

## Workflow Efficiency
- Bottleneck stage: ${analytics.workflowEfficiency.bottleneck}
- Average cycle time: ${analytics.workflowEfficiency.cycleTime} days
- Work in progress: ${analytics.workflowEfficiency.wipCount} cards
`;
}
```

### Step 5: Register Tool in Server

```typescript
// In index.ts - Add to tool list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      boardAnalyticsTool,
    ]
  };
});

// In index.ts - Add to handler switch
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    // ... existing cases
    case 'trello_board_analytics':
      result = await handleBoardAnalytics(argsWithCredentials);
      break;
    // ...
  }
});
```

## Advanced Tool Development

### 1. Complex Data Processing Tools

```typescript
// Example: Advanced card filtering and sorting
const advancedFilterSchema = z.object({
  apiKey: z.string().min(1),
  token: z.string().min(1),
  boardId: trelloIdSchema,
  filters: z.object({
    members: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    hasAttachments: z.boolean().optional(),
    hasComments: z.boolean().optional()
  }),
  sortBy: z.enum(['name', 'due', 'created', 'activity']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(50)
});

export async function handleAdvancedCardFilter(args: unknown) {
  const { apiKey, token, boardId, filters, sortBy, sortOrder, limit } = 
    validateArgs(advancedFilterSchema, args);
  
  const client = new TrelloClient({ apiKey, token });
  
  // Get all cards with detailed information
  const cardsResponse = await client.getBoardCards(boardId, {
    attachments: 'true',
    members: 'true'
  });
  
  // Apply complex filtering logic
  let filteredCards = applyFilters(cardsResponse.data, filters);
  
  // Apply sorting
  filteredCards = applySorting(filteredCards, sortBy, sortOrder);
  
  // Apply limit
  filteredCards = filteredCards.slice(0, limit);
  
  // Format results
  const summary = formatFilteredCards(filteredCards, filters);
  
  return {
    content: [
      {
        type: 'text',
        text: summary
      }
    ]
  };
}
```

### 2. Bulk Operation Tools

```typescript
// Example: Bulk card operations
const bulkCardUpdateSchema = z.object({
  apiKey: z.string().min(1),
  token: z.string().min(1),
  operations: z.array(z.object({
    cardId: trelloIdSchema,
    operation: z.enum(['move', 'update', 'archive', 'assign']),
    parameters: z.record(z.any())
  })),
  batchSize: z.number().min(1).max(10).default(5),
  delayBetweenBatches: z.number().min(100).max(5000).default(1000)
});

export async function handleBulkCardUpdate(args: unknown) {
  const { apiKey, token, operations, batchSize, delayBetweenBatches } = 
    validateArgs(bulkCardUpdateSchema, args);
  
  const client = new TrelloClient({ apiKey, token });
  const results: BulkOperationResult[] = [];
  
  // Process operations in batches to respect rate limits
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(op => executeCardOperation(client, op))
    );
    
    // Process batch results
    batchResults.forEach((result, index) => {
      const operation = batch[index];
      if (result.status === 'fulfilled') {
        results.push({
          cardId: operation.cardId,
          operation: operation.operation,
          success: true,
          result: result.value
        });
      } else {
        results.push({
          cardId: operation.cardId,
          operation: operation.operation,
          success: false,
          error: result.reason.message
        });
      }
    });
    
    // Delay between batches if not the last batch
    if (i + batchSize < operations.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  // Format summary
  const summary = formatBulkResults(results);
  
  return {
    content: [
      {
        type: 'text',
        text: summary
      }
    ]
  };
}
```

### 3. Integration Tools

```typescript
// Example: External system integration
const exportBoardSchema = z.object({
  apiKey: z.string().min(1),
  token: z.string().min(1),
  boardId: trelloIdSchema,
  format: z.enum(['json', 'csv', 'markdown']),
  includeAttachments: z.boolean().default(false),
  includeComments: z.boolean().default(false)
});

export async function handleBoardExport(args: unknown) {
  const { apiKey, token, boardId, format, includeAttachments, includeComments } = 
    validateArgs(exportBoardSchema, args);
  
  const client = new TrelloClient({ apiKey, token });
  
  // Gather comprehensive board data
  const boardData = await gatherBoardData(client, boardId, {
    includeAttachments,
    includeComments
  });
  
  // Export in requested format
  const exportedData = await exportToFormat(boardData, format);
  
  return {
    content: [
      {
        type: 'text',
        text: `Board exported successfully in ${format.toUpperCase()} format`
      },
      {
        type: 'resource',
        resource: {
          uri: `data:application/${format};base64,${btoa(exportedData)}`,
          name: `board-${boardId}.${format}`,
          description: `Exported board data in ${format} format`
        }
      }
    ]
  };
}
```

## Tool Development Best Practices

### 1. Input Validation

```typescript
// Comprehensive validation with clear error messages
const toolSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  boardId: trelloIdSchema,
  options: z.object({
    includeArchived: z.boolean().default(false),
    maxResults: z.number()
      .min(1, 'Maximum results must be at least 1')
      .max(1000, 'Maximum results cannot exceed 1000')
      .default(100),
    sortBy: z.enum(['name', 'date', 'activity'], {
      errorMap: () => ({ message: 'Sort field must be name, date, or activity' })
    })
  }).default({})
});
```

### 2. Error Handling

```typescript
export async function handleTool(args: unknown) {
  try {
    // Tool implementation
    return result;
  } catch (error) {
    // Categorize and format errors appropriately
    if (error instanceof TrelloError) {
      // Re-throw Trello API errors as-is (already formatted)
      throw error;
    } else if (error instanceof z.ZodError) {
      // Format validation errors
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network errors
      throw new Error('Network error: Unable to connect to Trello API. Please check your internet connection.');
    } else {
      // Unknown errors
      logger.error('Unexpected error in tool', { error: error.message, stack: error.stack });
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
}
```

### 3. Response Formatting

```typescript
function formatToolResponse(data: any): string {
  // Consistent, user-friendly formatting
  return `# Tool Results

## Summary
${generateSummary(data)}

## Details
${formatDetails(data)}

## Next Steps
${suggestNextActions(data)}
`;
}

function generateSummary(data: any): string {
  // Create concise summary of results
  return `Operation completed successfully. Processed ${data.length} items.`;
}

function formatDetails(data: any): string {
  // Format detailed information in readable format
  return data.map((item, index) => 
    `${index + 1}. ${item.name} - ${item.status}`
  ).join('\n');
}

function suggestNextActions(data: any): string {
  // Provide helpful suggestions for follow-up actions
  return `You can now:
- Review the processed items
- Create follow-up tasks
- Generate reports`;
}
```

### 4. Performance Optimization

```typescript
export async function handlePerformantTool(args: unknown) {
  const validatedArgs = validateArgs(toolSchema, args);
  const client = new TrelloClient(validatedArgs);
  
  // Use Promise.all for parallel operations
  const [boardData, memberData, labelData] = await Promise.all([
    client.getBoard(validatedArgs.boardId),
    client.getBoardMembers(validatedArgs.boardId),
    client.getBoardLabels(validatedArgs.boardId)
  ]);
  
  // Implement caching for repeated operations
  const cachedData = await getCachedData(validatedArgs.boardId);
  if (cachedData && !cachedData.expired) {
    return formatCachedResponse(cachedData);
  }
  
  // Process data efficiently
  const processedData = processDataEfficiently(boardData, memberData, labelData);
  
  // Cache results for future use
  await setCachedData(validatedArgs.boardId, processedData);
  
  return formatResponse(processedData);
}
```

## Testing Custom Tools

### 1. Unit Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleCustomTool } from '../tools/custom.js';

describe('Custom Tool', () => {
  it('should validate required parameters', async () => {
    const invalidArgs = { boardId: 'invalid-id' };
    
    await expect(handleCustomTool(invalidArgs))
      .rejects
      .toThrow('API key is required');
  });

  it('should process valid input correctly', async () => {
    const validArgs = {
      apiKey: 'test-key',
      token: 'test-token',
      boardId: '507f1f77bcf86cd799439011'
    };
    
    // Mock API client
    vi.mock('../trello/client.js', () => ({
      TrelloClient: vi.fn().mockImplementation(() => ({
        getBoard: vi.fn().mockResolvedValue({
          data: { id: 'board-id', name: 'Test Board' }
        })
      }))
    }));
    
    const result = await handleCustomTool(validArgs);
    
    expect(result.content[0].text).toContain('Test Board');
  });

  it('should handle API errors gracefully', async () => {
    const validArgs = {
      apiKey: 'test-key',
      token: 'test-token',
      boardId: '507f1f77bcf86cd799439011'
    };
    
    // Mock API error
    vi.mock('../trello/client.js', () => ({
      TrelloClient: vi.fn().mockImplementation(() => ({
        getBoard: vi.fn().mockRejectedValue(new Error('Board not found'))
      }))
    }));
    
    await expect(handleCustomTool(validArgs))
      .rejects
      .toThrow('Board not found');
  });
});
```

### 2. Integration Testing

```typescript
describe('Integration Tests', () => {
  const testCredentials = {
    apiKey: process.env.TEST_TRELLO_API_KEY,
    token: process.env.TEST_TRELLO_TOKEN
  };

  it('should work with real Trello API', async () => {
    // Use test board ID
    const testBoardId = process.env.TEST_BOARD_ID;
    
    const result = await handleCustomTool({
      ...testCredentials,
      boardId: testBoardId
    });
    
    expect(result.content[0].text).toContain('board');
  });
});
```

### 3. Manual Testing

```bash
# Build and test locally
npm run build

# Update Claude Desktop config to point to local build
# Test tool in Claude Desktop:
# "Use my custom tool with board ID abc123"
```

## Contributing Tools

### 1. Contribution Guidelines

Before contributing a new tool:

- [ ] **Unique Value**: Ensures the tool provides functionality not available in existing tools
- [ ] **User Need**: Addresses a real user need or workflow gap
- [ ] **Quality Standards**: Follows coding standards and includes comprehensive tests
- [ ] **Documentation**: Includes clear documentation and usage examples

### 2. Pull Request Process

```bash
# 1. Create feature branch
git checkout -b feature/custom-analytics-tool

# 2. Implement tool following patterns
# - Add to appropriate tools/*.ts file
# - Include comprehensive validation
# - Add error handling
# - Include tests

# 3. Update documentation
# - Add tool to Available-Tools.md
# - Include usage examples
# - Update API reference if needed

# 4. Test thoroughly
npm run type-check
npm run build
# Test with Claude Desktop

# 5. Submit pull request
git push origin feature/custom-analytics-tool
```

### 3. Code Review Checklist

- [ ] **Type Safety**: All parameters and return types defined
- [ ] **Validation**: Comprehensive input validation with Zod
- [ ] **Error Handling**: User-friendly error messages
- [ ] **Documentation**: Clear descriptions and examples
- [ ] **Testing**: Unit and integration tests included
- [ ] **Performance**: No obvious performance issues
- [ ] **Consistency**: Follows established patterns

## Tool Categories and Organization

### Organizing New Tools

When creating tools, consider these categories:

1. **Essential Tools**: Core functionality needed by most users
2. **Board Management**: Board-level operations and organization
3. **Card Operations**: Individual card manipulation and workflow
4. **Collaboration**: Team communication and member management
5. **Analytics**: Data analysis and reporting
6. **Integration**: External system connectivity
7. **Automation**: Bulk operations and workflow automation

### Naming Conventions

- **Prefix**: Use `trello_` prefix for new tools
- **Action**: Start with action verb (get, create, update, delete, analyze)
- **Subject**: Follow with the subject (board, card, member, etc.)
- **Modifier**: Add descriptive modifier if needed (advanced, bulk, etc.)

Examples:
- `trello_analyze_board_velocity`
- `trello_bulk_update_cards`
- `trello_export_board_data`
- `trello_generate_report`

---

**Next Steps**:
- Review [Testing](Testing) for comprehensive testing strategies
- Check [API Reference](API-Reference) for technical implementation details
- Explore [Best Practices](Best-Practices) for optimization techniques