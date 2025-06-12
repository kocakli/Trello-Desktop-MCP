# Architecture Overview

This document provides a comprehensive overview of the Trello Desktop MCP architecture, design decisions, and technical implementation details.

## System Architecture

### High-Level Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Claude Desktop    │    │  Trello MCP Server  │    │   Trello REST API   │
│                     │◄──►│                     │◄──►│                     │
│  - Natural Language │    │  - Tool Processing  │    │  - Board Management │
│  - User Interface   │    │  - Type Validation  │    │  - Card Operations  │
│  - MCP Client       │    │  - Error Handling   │    │  - Authentication   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Component Architecture

```
trello-desktop-mcp/
├── src/
│   ├── index.ts           # Desktop MCP Server Entry Point
│   ├── server.ts          # Generic MCP Server Factory
│   ├── tools/             # Tool Implementation Layer
│   │   ├── boards.ts      # Board Management Tools
│   │   ├── cards.ts       # Card Operation Tools
│   │   ├── lists.ts       # List Management Tools
│   │   ├── members.ts     # Member Management Tools
│   │   ├── search.ts      # Universal Search Tools
│   │   └── advanced.ts    # Advanced Feature Tools
│   ├── trello/           # API Client Layer
│   │   └── client.ts     # Trello REST API Client
│   ├── types/            # Type Definition Layer
│   │   └── trello.ts     # Trello Entity Types
│   └── utils/            # Utility Layer
│       ├── validation.ts # Input Validation
│       ├── logger.ts     # Structured Logging
│       ├── health.ts     # Health Monitoring
│       └── appInsights.ts# Telemetry Integration
```

## Design Patterns

### 1. Tool Pattern Architecture

Each tool follows a consistent pattern:

```typescript
// Tool Definition Pattern
export const toolDefinition = {
  name: 'tool_name',
  description: 'Clear, user-friendly description',
  inputSchema: {
    type: 'object',
    properties: { /* Zod-based validation schema */ },
    required: ['requiredField1', 'requiredField2']
  }
};

// Handler Implementation Pattern
export async function handleTool(args: ToolArgs): Promise<ToolResponse> {
  // 1. Input validation with Zod
  const validatedArgs = toolSchema.parse(args);
  
  // 2. Business logic execution
  const result = await businessLogic(validatedArgs);
  
  // 3. Response formatting
  return formatResponse(result);
}
```

### 2. Error Handling Strategy

**Layered Error Handling**:

```typescript
// Layer 1: API Client Level
class TrelloClient {
  private handleError(error: unknown): TrelloError {
    // Categorize and format API errors
    // Provide user-friendly error messages
    // Include troubleshooting guidance
  }
}

// Layer 2: Tool Level
export async function handleTool(args: ToolArgs) {
  try {
    return await executeToolLogic(args);
  } catch (error) {
    // Tool-specific error handling
    // Context-aware error messages
    throw new ToolError(contextualMessage, error);
  }
}

// Layer 3: Server Level
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await routeToHandler(request);
  } catch (error) {
    // Final error processing
    // MCP-compliant error responses
    return formatMCPError(error);
  }
});
```

### 3. Validation Architecture

**Multi-Layer Validation**:

```typescript
// 1. Schema Definition Layer
const createCardSchema = z.object({
  name: z.string().min(1).max(16384),
  idList: trelloIdSchema,
  desc: z.string().optional(),
  // ... comprehensive field validation
});

// 2. Business Logic Validation
function validateBusinessRules(cardData: CreateCardData) {
  // Domain-specific validation
  // Cross-field validation
  // Business constraint validation
}

// 3. API Parameter Validation
function validateAPICompatibility(params: APIParams) {
  // Ensure API compatibility
  // Format conversion if needed
  // Parameter sanitization
}
```

## Data Flow Architecture

### 1. Request Processing Flow

```
User Input (Natural Language)
           ↓
Claude Desktop (Intent Processing)
           ↓
MCP Protocol (Structured Request)
           ↓
Tool Router (Request Dispatch)
           ↓
Input Validator (Schema Validation)
           ↓
Business Logic (Tool Implementation)
           ↓
API Client (Trello REST API)
           ↓
Response Processor (Data Enrichment)
           ↓
MCP Response (Structured Response)
           ↓
Claude Desktop (Natural Language Response)
           ↓
User Interface (Formatted Output)
```

### 2. Credential Management Flow

**Desktop Mode** (Automatic Injection):
```
Environment Variables → MCP Server → Automatic Injection → API Client
```

**Server Mode** (Manual Passing):
```
Tool Arguments → Validation → API Client
```

### 3. Error Propagation Flow

```
API Error → Client Error Handler → Tool Error Handler → MCP Error Response
     ↓              ↓                    ↓                     ↓
Rate Limit    Network Error      Validation Error      User-Friendly
Handling      Retry Logic        Business Logic        Error Message
```

## Technical Implementation Details

### 1. Type System Architecture

**Hierarchical Type Organization**:

```typescript
// Base Types
interface TrelloEntity {
  id: string;
  name: string;
  url: string;
}

// Specialized Types
interface TrelloBoard extends TrelloEntity {
  desc: string;
  closed: boolean;
  lists?: TrelloList[];
  cards?: TrelloCard[];
  members?: TrelloMember[];
}

// Request/Response Types
interface CreateCardRequest {
  name: string;
  idList: string;
  desc?: string;
  // ... additional fields
}

interface TrelloApiResponse<T> {
  data: T;
  rateLimit?: RateLimitInfo;
}
```

### 2. API Client Architecture

**Feature-Rich HTTP Client**:

```typescript
class TrelloClient {
  // Configuration
  private baseURL = 'https://api.trello.com/1';
  private retryConfig: RetryConfig;
  private credentials: TrelloCredentials;

  // Core Methods
  private async makeRequest<T>(): Promise<TrelloApiResponse<T>> {
    // Retry logic with exponential backoff
    // Rate limit handling
    // Timeout management
    // Error categorization
    // Telemetry integration
  }

  // Resource Methods
  async getMyBoards(): Promise<TrelloApiResponse<TrelloBoard[]>>;
  async createCard(): Promise<TrelloApiResponse<TrelloCard>>;
  // ... 15+ API methods
}
```

### 3. Observability Architecture

**Comprehensive Monitoring Stack**:

```typescript
// Structured Logging
interface LogContext {
  operation: string;
  duration?: string;
  status?: number;
  rateLimit?: RateLimitInfo;
  error?: string;
}

// Application Insights Integration
class TelemetryClient {
  trackEvent(name: string, properties: Record<string, string>);
  trackDependency(type: string, name: string, data: string, duration: number, success: boolean);
  trackException(exception: Error, properties: Record<string, string>);
}

// Health Monitoring
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  dependencies: DependencyHealth[];
}
```

## Scalability Considerations

### 1. Performance Optimizations

**Request Optimization**:
- Connection pooling for HTTP requests
- Request timeout management
- Response compression support
- Efficient JSON parsing

**Memory Management**:
- Streaming for large responses
- Garbage collection optimization
- Memory leak prevention
- Resource cleanup

### 2. Rate Limit Management

**Proactive Rate Limiting**:
```typescript
// Rate limit detection and handling
private extractRateLimitInfo(response: Response): RateLimitInfo {
  return {
    limit: parseInt(response.headers.get('x-rate-limit-api-key-limit')),
    remaining: parseInt(response.headers.get('x-rate-limit-api-key-remaining')),
    resetTime: parseInt(response.headers.get('x-rate-limit-api-key-reset'))
  };
}

// Automatic retry with backoff
private async handleRateLimit(retryAfter: number) {
  await this.sleep(retryAfter * 1000);
  // Exponential backoff for subsequent retries
}
```

### 3. Fault Tolerance

**Multi-Layer Resilience**:
- Network error retry with exponential backoff
- Circuit breaker pattern for API failures
- Graceful degradation for non-critical features
- Comprehensive error recovery

## Security Architecture

### 1. Credential Security

**Secure Credential Management**:
- Environment variable storage (never in code)
- No credential transmission over network
- Local-only credential processing
- No credential logging or persistence

### 2. API Security

**Secure API Communication**:
- HTTPS-only communication with Trello API
- Request signing and authentication
- Input sanitization and validation
- Output sanitization

### 3. Data Privacy

**Privacy-First Design**:
- No user data storage or caching
- Minimal data retention
- Request-response only data flow
- No third-party data sharing

## Extension Points

### 1. Tool Extension Architecture

**Adding New Tools**:
```typescript
// 1. Define tool schema
export const newToolSchema = z.object({
  // Tool-specific validation
});

// 2. Implement tool handler
export async function handleNewTool(args: NewToolArgs) {
  // Tool implementation
}

// 3. Register in server
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'new_tool':
      return await handleNewTool(request.params.arguments);
    // ... existing tools
  }
});
```

### 2. API Extension Points

**Extending API Client**:
```typescript
class TrelloClient {
  // Add new API endpoints
  async newEndpoint(params: NewParams): Promise<TrelloApiResponse<NewType>> {
    return this.makeRequest<NewType>('/new-endpoint', { params }, 'New operation');
  }
}
```

### 3. Middleware Architecture

**Request/Response Middleware**:
```typescript
// Request middleware
function requestMiddleware(request: MCPRequest): MCPRequest {
  // Request transformation
  // Logging
  // Validation
  return enhancedRequest;
}

// Response middleware
function responseMiddleware(response: MCPResponse): MCPResponse {
  // Response transformation
  // Enrichment
  // Formatting
  return enhancedResponse;
}
```

## Development Architecture

### 1. Build System

**TypeScript Build Pipeline**:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

### 2. Development Workflow

**Development Process**:
1. **Type-First Development**: Define types before implementation
2. **Schema-Driven Validation**: Zod schemas for all inputs
3. **Test-Driven Development**: Comprehensive test coverage
4. **Continuous Integration**: Automated build and validation

### 3. Code Organization

**Modular Architecture**:
- Separation of concerns across layers
- Dependency injection for testability
- Interface-based abstractions
- Clean architecture principles

---

**Next**: Explore [Development Guide](Development-Guide) for contributing to the project.