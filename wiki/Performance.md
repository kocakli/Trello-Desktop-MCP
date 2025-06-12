# Performance Guide

This guide covers performance optimization, monitoring, and best practices for Trello Desktop MCP.

## Performance Overview

### Performance Goals

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| **API Response Time** | < 500ms | < 2s | > 5s |
| **Tool Execution Time** | < 1s | < 3s | > 10s |
| **Memory Usage** | < 100MB | < 200MB | > 500MB |
| **Rate Limit Efficiency** | > 95% | > 90% | < 85% |
| **Error Rate** | < 1% | < 5% | > 10% |

### Performance Architecture

```typescript
// Performance monitoring integration
interface PerformanceMetrics {
  requestDuration: number;
  memoryUsage: number;
  rateLimitRemaining: number;
  cacheHitRate: number;
  errorRate: number;
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics = {
    requestDuration: 0,
    memoryUsage: 0,
    rateLimitRemaining: 300,
    cacheHitRate: 0,
    errorRate: 0
  };
  
  static trackRequest(duration: number, success: boolean) {
    this.metrics.requestDuration = this.updateMovingAverage(
      this.metrics.requestDuration, 
      duration
    );
    
    if (!success) {
      this.metrics.errorRate = this.updateErrorRate(success);
    }
  }
}
```

## API Performance Optimization

### Request Optimization

#### Batch API Calls

```typescript
// Efficient: Batch related requests
export async function handleBoardOverview(args: BoardOverviewArgs) {
  const client = new TrelloClient(args);
  
  // Parallel requests for independent data
  const [boardData, members, labels] = await Promise.all([
    client.getBoard(args.boardId, true), // Include lists and cards
    client.getBoardMembers(args.boardId),
    client.getBoardLabels(args.boardId)
  ]);
  
  // Process data efficiently
  return formatBoardOverview(boardData, members, labels);
}

// Inefficient: Sequential requests
export async function handleBoardOverviewSlow(args: BoardOverviewArgs) {
  const client = new TrelloClient(args);
  
  const boardData = await client.getBoard(args.boardId);
  const lists = await client.getBoardLists(args.boardId);
  const cards = await client.getBoardCards(args.boardId);
  const members = await client.getBoardMembers(args.boardId);
  const labels = await client.getBoardLabels(args.boardId);
  
  return formatBoardOverview({ boardData, lists, cards }, members, labels);
}
```

#### Smart Data Fetching

```typescript
// Conditional data fetching based on requirements
interface SmartFetchOptions {
  includeDetails?: boolean;
  includeMembers?: boolean;
  includeAttachments?: boolean;
  maxCards?: number;
}

export async function smartBoardFetch(
  client: TrelloClient,
  boardId: string,
  options: SmartFetchOptions = {}
): Promise<ComprehensiveBoardData> {
  
  // Base board data (always needed)
  const boardPromise = client.getBoard(boardId, true);
  
  // Conditional parallel requests
  const promises: Promise<any>[] = [boardPromise];
  
  if (options.includeMembers) {
    promises.push(client.getBoardMembers(boardId));
  }
  
  if (options.includeDetails) {
    promises.push(client.getBoardLabels(boardId));
  }
  
  const results = await Promise.all(promises);
  
  // Process results efficiently
  return processSmartFetchResults(results, options);
}
```

### Caching Strategy

#### Intelligent Caching

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class SmartCache {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Cache with different TTLs based on data type
  static set<T>(key: string, data: T, type: 'static' | 'dynamic' | 'volatile'): void {
    const ttl = this.getTTLForType(type);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
    
    // Cleanup old entries periodically
    this.cleanup();
  }
  
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Track cache hits
    entry.hits++;
    
    return entry.data;
  }
  
  private static getTTLForType(type: string): number {
    switch (type) {
      case 'static':   return 30 * 60 * 1000; // 30 minutes (board structure)
      case 'dynamic':  return 5 * 60 * 1000;  // 5 minutes (card data)
      case 'volatile': return 1 * 60 * 1000;  // 1 minute (activity data)
      default:         return this.DEFAULT_TTL;
    }
  }
  
  private static cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Usage in tools
export async function handleCachedBoardDetails(args: BoardDetailsArgs) {
  const cacheKey = `board:${args.boardId}:details`;
  
  // Try cache first
  let boardData = SmartCache.get<TrelloBoard>(cacheKey);
  
  if (!boardData) {
    const client = new TrelloClient(args);
    const response = await client.getBoard(args.boardId, true);
    boardData = response.data;
    
    // Cache with appropriate TTL
    SmartCache.set(cacheKey, boardData, 'dynamic');
  }
  
  return formatBoardDetails(boardData);
}
```

### Connection Optimization

#### Connection Pooling

```typescript
// HTTP connection optimization
class OptimizedHTTPClient {
  private static agent: any;
  
  static getAgent() {
    if (!this.agent) {
      // Node.js HTTP agent with connection pooling
      this.agent = new (require('https').Agent)({
        keepAlive: true,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 30000,
        freeSocketTimeout: 15000
      });
    }
    return this.agent;
  }
  
  async makeRequest(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, {
      ...options,
      agent: OptimizedHTTPClient.getAgent()
    });
  }
}
```

#### Request Compression

```typescript
// Enable response compression
const optimizedHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};
```

## Memory Management

### Memory-Efficient Data Processing

```typescript
// Stream processing for large datasets
async function processLargeBoard(boardId: string): Promise<BoardAnalytics> {
  const client = new TrelloClient(credentials);
  
  // Process cards in chunks to avoid memory issues
  const chunkSize = 50;
  let offset = 0;
  const analytics = initializeAnalytics();
  
  while (true) {
    const cards = await client.getBoardCards(boardId, {
      limit: chunkSize,
      offset: offset
    });
    
    if (cards.data.length === 0) break;
    
    // Process chunk and update analytics
    processCardChunk(cards.data, analytics);
    
    // Clear processed data from memory
    cards.data.length = 0;
    
    offset += chunkSize;
  }
  
  return analytics;
}

// Memory-efficient card filtering
function filterCardsMemoryEfficient(
  cards: TrelloCard[], 
  predicate: (card: TrelloCard) => boolean
): TrelloCard[] {
  
  // Use generator for memory efficiency
  function* filterGenerator() {
    for (const card of cards) {
      if (predicate(card)) {
        yield card;
      }
    }
  }
  
  return Array.from(filterGenerator());
}
```

### Garbage Collection Optimization

```typescript
// Explicit memory management
class MemoryManager {
  private static readonly MAX_MEMORY_MB = 200;
  
  static checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > this.MAX_MEMORY_MB) {
      this.triggerCleanup();
    }
  }
  
  private static triggerCleanup(): void {
    // Clear caches
    SmartCache.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    logger.warn('Memory cleanup triggered', {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    });
  }
}

// Automatic memory monitoring
setInterval(() => {
  MemoryManager.checkMemoryUsage();
}, 30000); // Check every 30 seconds
```

## Rate Limit Optimization

### Intelligent Rate Limiting

```typescript
class RateLimitOptimizer {
  private static pendingRequests: Array<{
    resolve: Function;
    reject: Function;
    request: () => Promise<any>;
  }> = [];
  
  private static isProcessing = false;
  private static lastRequestTime = 0;
  private static requestCount = 0;
  
  static async optimizedRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ resolve, reject, request });
      this.processQueue();
    });
  }
  
  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.pendingRequests.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.pendingRequests.length > 0) {
      const now = Date.now();
      
      // Rate limit: 300 requests per 10 seconds
      if (this.requestCount >= 280) { // Leave buffer
        const timeToWait = 10000 - (now - this.lastRequestTime);
        if (timeToWait > 0) {
          await this.sleep(timeToWait);
          this.requestCount = 0;
          this.lastRequestTime = Date.now();
        }
      }
      
      const { resolve, reject, request } = this.pendingRequests.shift()!;
      
      try {
        const result = await request();
        this.requestCount++;
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Small delay between requests
      await this.sleep(10);
    }
    
    this.isProcessing = false;
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Predictive Rate Limiting

```typescript
// Predict and prevent rate limit issues
class PredictiveRateLimiter {
  private static requestTimes: number[] = [];
  private static readonly WINDOW_SIZE = 300; // Track last 300 requests
  
  static recordRequest(timestamp: number = Date.now()): void {
    this.requestTimes.push(timestamp);
    
    // Keep only recent requests
    if (this.requestTimes.length > this.WINDOW_SIZE) {
      this.requestTimes.shift();
    }
  }
  
  static predictRateLimit(): { willHitLimit: boolean; waitTime: number } {
    const now = Date.now();
    const tenSecondsAgo = now - 10000;
    
    // Count requests in last 10 seconds
    const recentRequests = this.requestTimes.filter(time => time > tenSecondsAgo);
    
    if (recentRequests.length >= 280) { // Conservative threshold
      const oldestRecentRequest = Math.min(...recentRequests);
      const waitTime = 10000 - (now - oldestRecentRequest);
      
      return { willHitLimit: true, waitTime: Math.max(0, waitTime) };
    }
    
    return { willHitLimit: false, waitTime: 0 };
  }
}
```

## Response Time Optimization

### Response Formatting Optimization

```typescript
// Efficient response formatting
class ResponseFormatter {
  // Pre-compile templates for common responses
  private static readonly TEMPLATES = {
    boardSummary: (data: any) => 
      `## Board: ${data.name}\n\n` +
      `**Lists (${data.lists?.length || 0}):** ${data.lists?.map(l => l.name).join(', ')}\n` +
      `**Cards:** ${data.cardCount} total\n` +
      `**Members:** ${data.memberCount}\n`,
    
    cardDetails: (data: any) =>
      `# ${data.name}\n\n` +
      `**Status:** ${data.list?.name || 'Unknown'}\n` +
      `**Due:** ${data.due ? new Date(data.due).toLocaleDateString() : 'No due date'}\n` +
      `**Members:** ${data.members?.map(m => m.fullName).join(', ') || 'None'}\n`
  };
  
  static formatBoard(board: TrelloBoard): string {
    return this.TEMPLATES.boardSummary({
      name: board.name,
      lists: board.lists,
      cardCount: board.cards?.length || 0,
      memberCount: board.members?.length || 0
    });
  }
  
  static formatCard(card: TrelloCard): string {
    return this.TEMPLATES.cardDetails(card);
  }
}

// Streaming response for large data
async function* streamBoardData(boardId: string): AsyncGenerator<string> {
  const client = new TrelloClient(credentials);
  
  // Yield header immediately
  yield `# Board Analysis for ${boardId}\n\n`;
  
  // Stream board info
  const board = await client.getBoard(boardId);
  yield `## ${board.data.name}\n${board.data.desc}\n\n`;
  
  // Stream lists progressively
  const lists = await client.getBoardLists(boardId);
  for (const list of lists.data) {
    yield `### ${list.name}\n`;
    
    const cards = await client.getListCards(list.id);
    yield `Cards: ${cards.data.length}\n\n`;
  }
}
```

### Concurrent Processing

```typescript
// Parallel processing for independent operations
export async function handleBulkCardAnalysis(args: BulkAnalysisArgs) {
  const client = new TrelloClient(args);
  
  // Process cards in parallel batches
  const batchSize = 10;
  const cardIds = args.cardIds;
  const results: CardAnalysis[] = [];
  
  for (let i = 0; i < cardIds.length; i += batchSize) {
    const batch = cardIds.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (cardId) => {
      const card = await client.getCard(cardId, true);
      return analyzeCard(card.data);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress indication
    const progress = Math.round(((i + batchSize) / cardIds.length) * 100);
    logger.info(`Bulk analysis progress: ${progress}%`);
  }
  
  return formatBulkAnalysis(results);
}
```

## Monitoring and Metrics

### Performance Monitoring

```typescript
// Comprehensive performance monitoring
interface PerformanceReport {
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  rateLimitUtilization: number;
  memoryUsage: number;
  cacheHitRate: number;
  requestsPerMinute: number;
}

class PerformanceTracker {
  private static requestTimes: number[] = [];
  private static errorCount = 0;
  private static totalRequests = 0;
  private static cacheHits = 0;
  private static cacheRequests = 0;
  
  static recordRequest(duration: number, success: boolean): void {
    this.requestTimes.push(duration);
    this.totalRequests++;
    
    if (!success) {
      this.errorCount++;
    }
    
    // Keep only last 1000 requests
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
  }
  
  static recordCacheAccess(hit: boolean): void {
    this.cacheRequests++;
    if (hit) {
      this.cacheHits++;
    }
  }
  
  static generateReport(): PerformanceReport {
    const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
    
    return {
      averageResponseTime: this.average(this.requestTimes),
      p95ResponseTime: this.percentile(sortedTimes, 95),
      errorRate: (this.errorCount / this.totalRequests) * 100,
      rateLimitUtilization: this.calculateRateLimitUtilization(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cacheHitRate: (this.cacheHits / Math.max(1, this.cacheRequests)) * 100,
      requestsPerMinute: this.calculateRequestsPerMinute()
    };
  }
  
  private static average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  private static percentile(sortedNumbers: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[index] || 0;
  }
}
```

### Real-time Performance Dashboard

```typescript
// Performance dashboard data
export async function handlePerformanceDashboard(): Promise<ToolResponse> {
  const report = PerformanceTracker.generateReport();
  
  const dashboard = `# Performance Dashboard

## Response Times
- **Average:** ${report.averageResponseTime.toFixed(0)}ms
- **95th Percentile:** ${report.p95ResponseTime.toFixed(0)}ms

## System Health
- **Error Rate:** ${report.errorRate.toFixed(2)}%
- **Memory Usage:** ${report.memoryUsage.toFixed(0)}MB
- **Requests/Minute:** ${report.requestsPerMinute}

## Efficiency
- **Cache Hit Rate:** ${report.cacheHitRate.toFixed(1)}%
- **Rate Limit Usage:** ${report.rateLimitUtilization.toFixed(1)}%

## Status: ${getHealthStatus(report)}
`;

  return {
    content: [{ type: 'text', text: dashboard }]
  };
}

function getHealthStatus(report: PerformanceReport): string {
  if (report.errorRate > 10 || report.averageResponseTime > 5000) {
    return '🔴 Critical';
  } else if (report.errorRate > 5 || report.averageResponseTime > 2000) {
    return '🟡 Warning';
  } else {
    return '🟢 Healthy';
  }
}
```

## Performance Best Practices

### Development Best Practices

1. **Batch Operations**: Group related API calls
2. **Use Parallel Processing**: Execute independent operations concurrently
3. **Implement Caching**: Cache static or slowly-changing data
4. **Monitor Memory**: Track and manage memory usage
5. **Optimize Data Structures**: Use appropriate data structures for use case
6. **Profile Performance**: Regular performance profiling and optimization

### Operational Best Practices

1. **Monitor Key Metrics**: Track response times, error rates, and resource usage
2. **Set Performance Budgets**: Define acceptable performance thresholds
3. **Implement Alerting**: Alert on performance degradation
4. **Regular Optimization**: Periodic performance reviews and optimizations
5. **Capacity Planning**: Plan for growth and scale accordingly

### User Experience Best Practices

1. **Progressive Loading**: Show partial results while loading complete data
2. **Meaningful Progress**: Provide progress indicators for long operations
3. **Graceful Degradation**: Maintain functionality during performance issues
4. **Clear Error Messages**: Provide actionable error messages
5. **Response Time Expectations**: Set appropriate user expectations

## Performance Troubleshooting

### Common Performance Issues

| Issue | Symptoms | Solutions |
|-------|----------|-----------|
| **Slow API Responses** | High response times | Optimize requests, implement caching |
| **Memory Leaks** | Increasing memory usage | Review data retention, implement cleanup |
| **Rate Limit Hits** | 429 errors | Implement queuing, reduce request frequency |
| **High Error Rates** | Frequent failures | Improve error handling, add retry logic |
| **Poor Cache Performance** | Low hit rates | Review cache strategy, adjust TTLs |

### Performance Debugging

```typescript
// Performance debugging utilities
class PerformanceDebugger {
  static async profileFunction<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;
      
      logger.debug('Function performance', {
        function: name,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${memoryDelta / 1024}KB`
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error('Function performance (error)', {
        function: name,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });
      throw error;
    }
  }
}

// Usage
export async function handleOptimizedTool(args: ToolArgs) {
  return PerformanceDebugger.profileFunction('optimized_tool', async () => {
    // Tool implementation
    return await executeToolLogic(args);
  });
}
```

---

**Next Steps**:
- Review [Monitoring](Monitoring) for comprehensive monitoring strategies
- Check [Best Practices](Best-Practices) for operational optimization
- Explore [Troubleshooting](Troubleshooting) for performance issue resolution