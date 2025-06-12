# Testing Guide

This comprehensive guide covers testing strategies, methodologies, and best practices for Trello Desktop MCP.

## Testing Philosophy

### Testing Pyramid

```
     /\
    /  \     E2E Tests (Claude Desktop Integration)
   /____\    
  /      \   Integration Tests (Real API)
 /________\  
/          \ Unit Tests (Individual Components)
\__________/
```

### Testing Levels

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API client and tool interactions
3. **End-to-End Tests**: Complete Claude Desktop workflows
4. **Manual Tests**: User experience validation

## Unit Testing

### Test Framework Setup

```bash
# Install testing dependencies
npm install --save-dev vitest @vitest/ui @types/node
npm install --save-dev @testing-library/jest-dom

# Add test scripts to package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/test/**', 'src/**/*.test.ts', 'src/**/*.spec.ts']
    }
  }
});
```

### Testing Tools and Utilities

#### Tool Validation Testing

```typescript
// src/test/tools/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateArgs } from '../utils/validation.js';
import { createCardSchema } from '../tools/cards.js';

describe('Card Tool Validation', () => {
  describe('createCard validation', () => {
    it('should accept valid card creation parameters', () => {
      const validArgs = {
        apiKey: 'test-api-key',
        token: 'test-token',
        name: 'Test Card',
        idList: '507f1f77bcf86cd799439011'
      };

      expect(() => validateArgs(createCardSchema, validArgs)).not.toThrow();
    });

    it('should reject invalid board ID format', () => {
      const invalidArgs = {
        apiKey: 'test-api-key',
        token: 'test-token',
        name: 'Test Card',
        idList: 'invalid-id'
      };

      expect(() => validateArgs(createCardSchema, invalidArgs))
        .toThrow('Invalid Trello ID format');
    });

    it('should reject empty card name', () => {
      const invalidArgs = {
        apiKey: 'test-api-key',
        token: 'test-token',
        name: '',
        idList: '507f1f77bcf86cd799439011'
      };

      expect(() => validateArgs(createCardSchema, invalidArgs))
        .toThrow('Card name must be at least 1 character');
    });

    it('should apply default values correctly', () => {
      const args = {
        apiKey: 'test-api-key',
        token: 'test-token',
        name: 'Test Card',
        idList: '507f1f77bcf86cd799439011'
      };

      const result = validateArgs(createCardSchema, args);
      expect(result.pos).toBe('bottom'); // default value
    });
  });
});
```

#### Tool Handler Testing

```typescript
// src/test/tools/cards.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleCreateCard } from '../tools/cards.js';
import { TrelloClient } from '../trello/client.js';

// Mock the TrelloClient
vi.mock('../trello/client.js');

describe('Card Tool Handlers', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      createCard: vi.fn(),
    };
    
    // Mock TrelloClient constructor
    (TrelloClient as any).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCreateCard', () => {
    it('should create card successfully', async () => {
      const mockCard = {
        id: '507f1f77bcf86cd799439011',
        name: 'Test Card',
        desc: 'Test Description',
        idList: '507f1f77bcf86cd799439012',
        url: 'https://trello.com/c/test'
      };

      mockClient.createCard.mockResolvedValue({
        data: mockCard,
        rateLimit: { remaining: 299, limit: 300, resetTime: Date.now() + 10000 }
      });

      const args = {
        apiKey: 'test-key',
        token: 'test-token',
        name: 'Test Card',
        idList: '507f1f77bcf86cd799439012',
        desc: 'Test Description'
      };

      const result = await handleCreateCard(args);

      expect(mockClient.createCard).toHaveBeenCalledWith({
        name: 'Test Card',
        idList: '507f1f77bcf86cd799439012',
        desc: 'Test Description'
      });

      expect(result.content[0].text).toContain('Card created successfully');
      expect(result.content[0].text).toContain('Test Card');
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('List not found');
      apiError.status = 404;
      apiError.code = 'NOT_FOUND';

      mockClient.createCard.mockRejectedValue(apiError);

      const args = {
        apiKey: 'test-key',
        token: 'test-token',
        name: 'Test Card',
        idList: 'invalid-list-id'
      };

      await expect(handleCreateCard(args)).rejects.toThrow('List not found');
    });

    it('should validate required parameters', async () => {
      const invalidArgs = {
        apiKey: 'test-key',
        // Missing token
        name: 'Test Card',
        idList: '507f1f77bcf86cd799439012'
      };

      await expect(handleCreateCard(invalidArgs))
        .rejects.toThrow('Token is required');
    });
  });
});
```

### API Client Testing

#### HTTP Client Testing

```typescript
// src/test/trello/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrelloClient } from '../trello/client.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('TrelloClient', () => {
  let client: TrelloClient;
  const mockCredentials = {
    apiKey: 'test-api-key',
    token: 'test-token'
  };

  beforeEach(() => {
    client = new TrelloClient(mockCredentials);
    vi.clearAllMocks();
  });

  describe('API Request Handling', () => {
    it('should make successful API requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['x-rate-limit-api-key-remaining', '299'],
          ['x-rate-limit-api-key-limit', '300']
        ]),
        json: vi.fn().mockResolvedValue({ id: 'board-123', name: 'Test Board' })
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const result = await client.getMyBoards();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.trello.com/1/members/me/boards'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': expect.stringContaining('TrelloMCPServer')
          })
        })
      );

      expect(result.data).toEqual({ id: 'board-123', name: 'Test Board' });
      expect(result.rateLimit?.remaining).toBe(299);
    });

    it('should handle rate limiting with retry', async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        headers: new Map([
          ['retry-after', '2'],
          ['x-rate-limit-api-key-remaining', '0']
        ])
      };

      const successResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['x-rate-limit-api-key-remaining', '299']
        ]),
        json: vi.fn().mockResolvedValue({ id: 'board-123' })
      };

      // First call returns rate limit, second succeeds
      (fetch as any)
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse);

      // Mock sleep function to avoid actual delays in tests
      vi.spyOn(client as any, 'sleep').mockResolvedValue(undefined);

      const result = await client.getMyBoards();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ id: 'board-123' });
    });

    it('should handle network errors with retry', async () => {
      const networkError = new TypeError('fetch failed');
      const successResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ id: 'board-123' })
      };

      (fetch as any)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      vi.spyOn(client as any, 'sleep').mockResolvedValue(undefined);

      const result = await client.getMyBoards();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ id: 'board-123' });
    });

    it('should format authentication errors clearly', async () => {
      const authErrorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };

      (fetch as any).mockResolvedValue(authErrorResponse);

      await expect(client.getMyBoards()).rejects.toThrow(
        'Invalid or expired Trello credentials'
      );
    });
  });
});
```

### Utility Function Testing

```typescript
// src/test/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { trelloIdSchema, validateArgs } from '../utils/validation.js';
import { z } from 'zod';

describe('Validation Utilities', () => {
  describe('trelloIdSchema', () => {
    it('should validate correct Trello IDs', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        'abcdef1234567890abcdef12',
        '1234567890abcdef12345678'
      ];

      validIds.forEach(id => {
        expect(() => trelloIdSchema.parse(id)).not.toThrow();
      });
    });

    it('should reject invalid Trello IDs', () => {
      const invalidIds = [
        'short',                    // Too short
        'toolong1234567890abcdef123', // Too long
        '507f1f77bcf86cd79943901g',   // Invalid character
        '',                         // Empty
        '507f1f77-bcf8-6cd7-9943-9011' // Hyphens
      ];

      invalidIds.forEach(id => {
        expect(() => trelloIdSchema.parse(id)).toThrow();
      });
    });
  });

  describe('validateArgs', () => {
    const testSchema = z.object({
      required: z.string().min(1),
      optional: z.string().optional(),
      number: z.number().default(42)
    });

    it('should validate correct arguments', () => {
      const validArgs = {
        required: 'test-value',
        optional: 'optional-value'
      };

      const result = validateArgs(testSchema, validArgs);
      expect(result.required).toBe('test-value');
      expect(result.optional).toBe('optional-value');
      expect(result.number).toBe(42); // default value
    });

    it('should reject missing required fields', () => {
      const invalidArgs = {
        optional: 'optional-value'
      };

      expect(() => validateArgs(testSchema, invalidArgs))
        .toThrow('Required');
    });

    it('should provide helpful error messages', () => {
      const invalidArgs = {
        required: '',  // Empty string
        number: 'not-a-number'
      };

      expect(() => validateArgs(testSchema, invalidArgs))
        .toThrow(); // Should contain validation error details
    });
  });
});
```

## Integration Testing

### Real API Testing

```typescript
// src/test/integration/api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { TrelloClient } from '../trello/client.js';

describe('Trello API Integration', () => {
  let client: TrelloClient;
  let testBoardId: string;

  beforeAll(() => {
    // Skip integration tests if credentials not provided
    if (!process.env.TEST_TRELLO_API_KEY || !process.env.TEST_TRELLO_TOKEN) {
      console.log('Skipping integration tests - no test credentials provided');
      return;
    }

    client = new TrelloClient({
      apiKey: process.env.TEST_TRELLO_API_KEY!,
      token: process.env.TEST_TRELLO_TOKEN!
    });

    testBoardId = process.env.TEST_BOARD_ID!;
  });

  it('should authenticate and get user boards', async () => {
    if (!client) return;

    const result = await client.getMyBoards();
    
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('name');
  });

  it('should get board details with lists and cards', async () => {
    if (!client || !testBoardId) return;

    const result = await client.getBoard(testBoardId, true);
    
    expect(result.data).toHaveProperty('id', testBoardId);
    expect(result.data).toHaveProperty('lists');
    expect(result.data).toHaveProperty('cards');
  });

  it('should create and delete a test card', async () => {
    if (!client || !testBoardId) return;

    // Get a list to create card in
    const boardResult = await client.getBoard(testBoardId, true);
    const firstList = boardResult.data.lists?.[0];
    expect(firstList).toBeDefined();

    // Create test card
    const createResult = await client.createCard({
      name: 'Test Card - Integration Test',
      idList: firstList!.id,
      desc: 'This is a test card created by integration tests'
    });

    expect(createResult.data).toHaveProperty('id');
    expect(createResult.data.name).toBe('Test Card - Integration Test');

    // Clean up - delete the test card
    await client.deleteCard(createResult.data.id);
  });

  it('should handle rate limits gracefully', async () => {
    if (!client) return;

    // Make multiple rapid requests to trigger rate limiting
    const promises = Array(10).fill(null).map(() => client.getMyBoards());
    
    const results = await Promise.allSettled(promises);
    
    // All requests should eventually succeed (with retries)
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
    });
  });
});
```

### Tool Integration Testing

```typescript
// src/test/integration/tools.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { handleGetUserBoards, handleCreateCard } from '../tools/index.js';

describe('Tool Integration Tests', () => {
  let testCredentials: any;
  let testBoardId: string;

  beforeAll(() => {
    if (!process.env.TEST_TRELLO_API_KEY) return;

    testCredentials = {
      apiKey: process.env.TEST_TRELLO_API_KEY,
      token: process.env.TEST_TRELLO_TOKEN
    };
    testBoardId = process.env.TEST_BOARD_ID!;
  });

  it('should get user boards through tool interface', async () => {
    if (!testCredentials) return;

    const result = await handleGetUserBoards({
      ...testCredentials,
      filter: 'open'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('boards found');
  });

  it('should create card through tool interface', async () => {
    if (!testCredentials || !testBoardId) return;

    // First get board details to find a list
    const boardResult = await handleGetBoardDetails({
      ...testCredentials,
      boardId: testBoardId,
      includeLists: true
    });

    // Extract list ID from response (this would be more robust in real implementation)
    const listIdMatch = boardResult.content[0].text.match(/List ID: (\w+)/);
    expect(listIdMatch).toBeTruthy();
    
    const listId = listIdMatch![1];

    // Create test card
    const createResult = await handleCreateCard({
      ...testCredentials,
      name: 'Integration Test Card',
      idList: listId,
      desc: 'Created by integration test'
    });

    expect(createResult.content[0].text).toContain('Card created successfully');
    expect(createResult.content[0].text).toContain('Integration Test Card');
  });
});
```

## End-to-End Testing

### Claude Desktop Testing

```typescript
// src/test/e2e/claude-desktop.test.ts
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

describe('Claude Desktop Integration', () => {
  it('should start MCP server without errors', async () => {
    // Verify dist build exists
    await expect(fs.access('./dist/index.js')).resolves.not.toThrow();
    
    // Start the MCP server
    const serverProcess = spawn('node', ['./dist/index.js'], {
      env: {
        ...process.env,
        TRELLO_API_KEY: 'test-key',
        TRELLO_TOKEN: 'test-token'
      }
    });

    let output = '';
    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    let errorOutput = '';
    serverProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Server should start without critical errors
    expect(errorOutput).not.toContain('Error:');
    expect(errorOutput).not.toContain('FATAL');

    // Clean up
    serverProcess.kill();
  });

  it('should respond to MCP initialization', async () => {
    // This would require more sophisticated MCP client simulation
    // For now, we verify the server structure is correct
    
    const indexContent = await fs.readFile('./dist/index.js', 'utf-8');
    
    // Verify key MCP components are present
    expect(indexContent).toContain('ListToolsRequestSchema');
    expect(indexContent).toContain('CallToolRequestSchema');
    expect(indexContent).toContain('InitializeRequestSchema');
  });
});
```

### Manual Testing Scenarios

```typescript
// Manual test scenarios for Claude Desktop
const manualTestScenarios = [
  {
    name: 'Basic Connectivity',
    steps: [
      'Ask Claude: "Show me my Trello boards"',
      'Verify: Response contains board list',
      'Verify: No error messages'
    ],
    expectedOutcome: 'List of user boards with names and basic info'
  },
  {
    name: 'Card Creation',
    steps: [
      'Ask Claude: "Create a new card called \'Test Card\' in my To Do list"',
      'Verify: Card creation confirmation',
      'Check Trello web interface: Card appears in correct list'
    ],
    expectedOutcome: 'Card created successfully with confirmation message'
  },
  {
    name: 'Search Functionality',
    steps: [
      'Ask Claude: "Search for cards containing \'bug\' in my boards"',
      'Verify: Search results returned',
      'Verify: Results contain relevant cards'
    ],
    expectedOutcome: 'Relevant search results with card details'
  },
  {
    name: 'Error Handling',
    steps: [
      'Ask Claude: "Get details for board with ID \'invalid-id\'"',
      'Verify: Clear error message',
      'Verify: Helpful troubleshooting suggestions'
    ],
    expectedOutcome: 'User-friendly error message with guidance'
  }
];
```

## Performance Testing

### Load Testing

```typescript
// src/test/performance/load.test.ts
import { describe, it, expect } from 'vitest';
import { TrelloClient } from '../trello/client.js';

describe('Performance Tests', () => {
  it('should handle concurrent requests efficiently', async () => {
    const client = new TrelloClient({
      apiKey: process.env.TEST_TRELLO_API_KEY!,
      token: process.env.TEST_TRELLO_TOKEN!
    });

    const startTime = Date.now();
    
    // Make 10 concurrent requests
    const promises = Array(10).fill(null).map(() => client.getMyBoards());
    const results = await Promise.all(promises);
    
    const duration = Date.now() - startTime;

    // All requests should succeed
    results.forEach(result => {
      expect(result.data).toBeInstanceOf(Array);
    });

    // Should complete within reasonable time (accounting for rate limits)
    expect(duration).toBeLessThan(30000); // 30 seconds
  });

  it('should maintain performance with large datasets', async () => {
    const client = new TrelloClient({
      apiKey: process.env.TEST_TRELLO_API_KEY!,
      token: process.env.TEST_TRELLO_TOKEN!
    });

    const startTime = Date.now();
    
    // Get board with many cards
    const result = await client.getBoardCards(process.env.TEST_LARGE_BOARD_ID!, {
      attachments: 'true',
      members: 'true'
    });
    
    const duration = Date.now() - startTime;

    expect(result.data.length).toBeGreaterThan(100);
    expect(duration).toBeLessThan(10000); // 10 seconds
  });
});
```

## Test Data Management

### Test Data Setup

```typescript
// src/test/fixtures/test-data.ts
export const testBoards = [
  {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Project Board',
    desc: 'A test board for development',
    closed: false,
    lists: [
      {
        id: '507f1f77bcf86cd799439012',
        name: 'To Do',
        closed: false
      },
      {
        id: '507f1f77bcf86cd799439013', 
        name: 'In Progress',
        closed: false
      }
    ]
  }
];

export const testCards = [
  {
    id: '507f1f77bcf86cd799439014',
    name: 'Test Card 1',
    desc: 'Test card description',
    idList: '507f1f77bcf86cd799439012',
    idBoard: '507f1f77bcf86cd799439011',
    closed: false,
    due: null,
    labels: [],
    members: []
  }
];

export const mockApiResponses = {
  getUserBoards: {
    data: testBoards,
    rateLimit: { remaining: 299, limit: 300, resetTime: Date.now() + 10000 }
  },
  
  createCard: (cardData: any) => ({
    data: {
      ...testCards[0],
      ...cardData,
      id: '507f1f77bcf86cd799439999'
    },
    rateLimit: { remaining: 298, limit: 300, resetTime: Date.now() + 10000 }
  })
};
```

### Environment Setup

```bash
# .env.test file for test configuration
TEST_TRELLO_API_KEY=your-test-api-key
TEST_TRELLO_TOKEN=your-test-token
TEST_BOARD_ID=your-test-board-id
TEST_LARGE_BOARD_ID=board-with-many-cards
LOG_LEVEL=error
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    
    - run: npm run type-check
    
    - run: npm run build
    
    - run: npm test
      env:
        TEST_TRELLO_API_KEY: ${{ secrets.TEST_TRELLO_API_KEY }}
        TEST_TRELLO_TOKEN: ${{ secrets.TEST_TRELLO_TOKEN }}
        TEST_BOARD_ID: ${{ secrets.TEST_BOARD_ID }}
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## Testing Best Practices

### 1. Test Organization

```typescript
// Group related tests logically
describe('Card Management', () => {
  describe('Card Creation', () => {
    it('should create card with required fields');
    it('should create card with optional fields');
    it('should reject invalid input');
  });
  
  describe('Card Updates', () => {
    it('should update card name');
    it('should update card description');
    it('should move card between lists');
  });
});
```

### 2. Test Data Isolation

```typescript
// Use beforeEach for test isolation
describe('Database operations', () => {
  beforeEach(async () => {
    // Reset test data
    await setupTestData();
  });
  
  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });
});
```

### 3. Meaningful Test Names

```typescript
// Good: Descriptive test names
it('should return 404 error when board does not exist');
it('should create card with due date when date is provided');
it('should retry request 3 times on network failure');

// Bad: Vague test names
it('should work');
it('should handle errors');
it('should create card');
```

### 4. Test Coverage Goals

- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover primary user workflows
- **Error Handling**: Test all error scenarios

---

**Next Steps**:
- Review [Development Guide](Development-Guide) for implementation details
- Check [API Reference](API-Reference) for technical specifications  
- Explore [Best Practices](Best-Practices) for optimal usage patterns