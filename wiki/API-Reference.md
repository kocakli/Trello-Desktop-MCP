# API Reference

This document provides comprehensive technical API documentation for Trello Desktop MCP.

## API Overview

Trello Desktop MCP implements the Model Context Protocol (MCP) to provide standardized tool discovery and execution. All communication follows MCP specification 2024-11-05.

### Protocol Structure

```typescript
// MCP Request Structure
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params: object;
}

// MCP Response Structure
interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: object;
  error?: MCPError;
}
```

## Tool Categories

### Essential Tools (Phase 1)

#### `trello_search`
**Universal search across all Trello content**

```typescript
interface SearchRequest {
  query: string;                          // Search term (required)
  modelTypes?: string[];                  // Filter by content type
  boardIds?: string[];                    // Limit to specific boards
  boardsLimit?: number;                   // Max board results (default: 10)
  cardsLimit?: number;                    // Max card results (default: 50)
  membersLimit?: number;                  // Max member results (default: 25)
}

interface SearchResponse {
  boards: TrelloBoard[];
  cards: TrelloCard[];
  members: TrelloMember[];
  organizations: TrelloOrganization[];
}
```

**Example Usage**:
```json
{
  "name": "trello_search",
  "arguments": {
    "query": "authentication bug",
    "modelTypes": ["cards", "boards"],
    "cardsLimit": 20
  }
}
```

#### `trello_get_user_boards`
**Get all boards accessible to the current user**

```typescript
interface GetUserBoardsRequest {
  filter?: "all" | "open" | "closed";     // Board status filter (default: "open")
}

interface GetUserBoardsResponse {
  boards: TrelloBoard[];
  summary: {
    totalBoards: number;
    openBoards: number;
    closedBoards: number;
  };
}
```

#### `get_board_details`
**Get comprehensive board information**

```typescript
interface GetBoardDetailsRequest {
  boardId: string;                        // 24-character board ID (required)
  includeLists?: boolean;                 // Include board lists (default: false)
  includeCards?: boolean;                 // Include all cards (default: false)
}

interface GetBoardDetailsResponse {
  board: TrelloBoard;
  lists?: TrelloList[];
  cards?: TrelloCard[];
  summary: BoardSummary;
}
```

#### `get_card`
**Get comprehensive card details**

```typescript
interface GetCardRequest {
  cardId: string;                         // 24-character card ID (required)
  includeMembers?: boolean;               // Include assigned members
  includeLabels?: boolean;                // Include card labels
  includeChecklists?: boolean;            // Include checklists
}

interface GetCardResponse {
  card: TrelloCard;
  members?: TrelloMember[];
  labels?: TrelloLabel[];
  checklists?: TrelloChecklist[];
}
```

#### `create_card`
**Create new cards with full metadata**

```typescript
interface CreateCardRequest {
  name: string;                           // Card title (1-16384 chars, required)
  idList: string;                         // Target list ID (required)
  desc?: string;                          // Card description
  pos?: string | number;                  // Position: "top", "bottom", or number
  due?: string;                           // Due date (ISO 8601 format)
  idMembers?: string[];                   // Member IDs to assign
  idLabels?: string[];                    // Label IDs to apply
}

interface CreateCardResponse {
  card: TrelloCard;
  summary: string;
}
```

### Board Management Tools

#### `list_boards` (Legacy)
**Simple board listing for compatibility**

```typescript
interface ListBoardsRequest {
  filter?: "all" | "open" | "closed";
}

interface ListBoardsResponse {
  boards: TrelloBoard[];
}
```

#### `get_lists`
**Get all lists in a board**

```typescript
interface GetListsRequest {
  boardId: string;                        // Board ID (required)
  filter?: "all" | "open" | "closed";    // List status filter
}

interface GetListsResponse {
  lists: TrelloList[];
  summary: {
    totalLists: number;
    openLists: number;
    closedLists: number;
  };
}
```

#### `trello_create_list`
**Create new lists on boards**

```typescript
interface CreateListRequest {
  name: string;                           // List name (required)
  idBoard: string;                        // Target board ID (required)
  pos?: string | number;                  // Position: "top", "bottom", or number
}

interface CreateListResponse {
  list: TrelloList;
  summary: string;
}
```

### Card Operations Tools

#### `update_card`
**Update existing card properties**

```typescript
interface UpdateCardRequest {
  cardId: string;                         // Card ID (required)
  name?: string;                          // New card title
  desc?: string;                          // New description
  due?: string | null;                    // New due date or null to remove
  closed?: boolean;                       // Archive/unarchive card
  idMembers?: string[];                   // Update member assignments
  idLabels?: string[];                    // Update label assignments
}

interface UpdateCardResponse {
  card: TrelloCard;
  changes: string[];                      // List of changes made
}
```

#### `move_card`
**Move cards between lists**

```typescript
interface MoveCardRequest {
  cardId: string;                         // Card ID (required)
  idList: string;                         // Target list ID (required)
  pos?: string | number;                  // Position in target list
}

interface MoveCardResponse {
  card: TrelloCard;
  summary: string;
}
```

#### `trello_add_comment`
**Add comments to cards**

```typescript
interface AddCommentRequest {
  cardId: string;                         // Card ID (required)
  text: string;                           // Comment text (required)
}

interface AddCommentResponse {
  comment: TrelloAction;
  summary: string;
}
```

#### `trello_get_list_cards`
**Get all cards from a specific list**

```typescript
interface GetListCardsRequest {
  listId: string;                         // List ID (required)
  filter?: "all" | "open" | "closed";    // Card status filter
  includeMembers?: boolean;               // Include member data
  includeLabels?: boolean;                // Include label data
}

interface GetListCardsResponse {
  cards: TrelloCard[];
  summary: {
    totalCards: number;
    openCards: number;
    closedCards: number;
  };
}
```

### Collaboration Tools

#### `trello_get_member`
**Get member information**

```typescript
interface GetMemberRequest {
  memberId: string;                       // Member ID or username (required)
  includeBoards?: boolean;                // Include member's boards
  includeOrganizations?: boolean;         // Include organizations
}

interface GetMemberResponse {
  member: TrelloMember;
  boards?: TrelloBoard[];
  organizations?: TrelloOrganization[];
}
```

#### `trello_get_board_members`
**Get all board members**

```typescript
interface GetBoardMembersRequest {
  boardId: string;                        // Board ID (required)
}

interface GetBoardMembersResponse {
  members: TrelloMember[];
  summary: {
    totalMembers: number;
    adminMembers: number;
    normalMembers: number;
  };
}
```

#### `trello_get_board_labels`
**Get board labels**

```typescript
interface GetBoardLabelsRequest {
  boardId: string;                        // Board ID (required)
}

interface GetBoardLabelsResponse {
  labels: TrelloLabel[];
  summary: {
    totalLabels: number;
    usedLabels: number;
  };
}
```

### Advanced Features Tools

#### `trello_get_board_cards`
**Get all cards from a board**

```typescript
interface GetBoardCardsRequest {
  boardId: string;                        // Board ID (required)
  includeAttachments?: boolean;           // Include attachments
  includeMembers?: boolean;               // Include member data
  filter?: string;                        // Card filter (default: "open")
}

interface GetBoardCardsResponse {
  cards: TrelloCard[];
  summary: BoardCardsSummary;
}
```

#### `trello_get_card_actions`
**Get card activity history**

```typescript
interface GetCardActionsRequest {
  cardId: string;                         // Card ID (required)
  filter?: string;                        // Action type filter
  limit?: number;                         // Max results (default: 50)
}

interface GetCardActionsResponse {
  actions: TrelloAction[];
  summary: {
    totalActions: number;
    actionTypes: Record<string, number>;
  };
}
```

#### `trello_get_card_attachments`
**Get card attachments**

```typescript
interface GetCardAttachmentsRequest {
  cardId: string;                         // Card ID (required)
  fields?: string[];                      // Specific fields to return
}

interface GetCardAttachmentsResponse {
  attachments: TrelloAttachment[];
  summary: {
    totalAttachments: number;
    totalSize: number;
  };
}
```

#### `trello_get_card_checklists`
**Get card checklists**

```typescript
interface GetCardChecklistsRequest {
  cardId: string;                         // Card ID (required)
  includeCheckItems?: boolean;            // Include checklist items
  fields?: string[];                      // Specific fields to return
}

interface GetCardChecklistsResponse {
  checklists: TrelloChecklist[];
  summary: ChecklistSummary;
}
```

## Data Types

### Core Entities

#### TrelloBoard
```typescript
interface TrelloBoard {
  id: string;                             // 24-character board ID
  name: string;                           // Board name
  desc: string;                           // Board description
  url: string;                            // Board URL
  closed: boolean;                        // Archive status
  starred: boolean;                       // Starred by user
  dateLastActivity: string;               // Last activity timestamp
  dateLastView: string;                   // Last viewed timestamp
  idOrganization?: string;                // Organization ID
  lists?: TrelloList[];                   // Board lists (if requested)
  cards?: TrelloCard[];                   // Board cards (if requested)
  members?: TrelloMember[];               // Board members (if requested)
  labels?: TrelloLabel[];                 // Board labels (if requested)
}
```

#### TrelloCard
```typescript
interface TrelloCard {
  id: string;                             // 24-character card ID
  name: string;                           // Card title
  desc: string;                           // Card description
  url: string;                            // Card URL
  closed: boolean;                        // Archive status
  pos: number;                            // Position in list
  due?: string;                           // Due date (ISO format)
  dueComplete: boolean;                   // Due date completion status
  dateLastActivity: string;               // Last activity timestamp
  idBoard: string;                        // Parent board ID
  idList: string;                         // Parent list ID
  idMembers: string[];                    // Assigned member IDs
  labels: TrelloLabel[];                  // Applied labels
  badges: TrelloBadges;                   // Card statistics
  members?: TrelloMember[];               // Assigned members (if requested)
  checklists?: TrelloChecklist[];         // Card checklists (if requested)
  attachments?: TrelloAttachment[];       // Card attachments (if requested)
}
```

#### TrelloList
```typescript
interface TrelloList {
  id: string;                             // 24-character list ID
  name: string;                           // List name
  closed: boolean;                        // Archive status
  pos: number;                            // Position on board
  idBoard: string;                        // Parent board ID
  cards?: TrelloCard[];                   // List cards (if requested)
}
```

#### TrelloMember
```typescript
interface TrelloMember {
  id: string;                             // 24-character member ID
  username: string;                       // Member username
  fullName: string;                       // Display name
  email?: string;                         // Email address
  avatarHash?: string;                    // Avatar hash for URL construction
  url: string;                            // Member profile URL
  memberType: "admin" | "normal" | "observer"; // Board membership type
  boards?: TrelloBoard[];                 // Member's boards (if requested)
  organizations?: TrelloOrganization[];   // Member's organizations (if requested)
}
```

#### TrelloLabel
```typescript
interface TrelloLabel {
  id: string;                             // 24-character label ID
  name: string;                           // Label name
  color: string;                          // Label color
  idBoard: string;                        // Parent board ID
  uses: number;                           // Usage count
}
```

### Metadata Types

#### TrelloBadges
```typescript
interface TrelloBadges {
  votes: number;                          // Vote count
  viewingMemberVoted: boolean;            // Current user voted
  subscribed: boolean;                    // Subscription status
  fogbugz: string;                        // FogBugz integration
  checkItems: number;                     // Total checklist items
  checkItemsChecked: number;              // Completed checklist items
  comments: number;                       // Comment count
  attachments: number;                    // Attachment count
  description: boolean;                   // Has description
  due?: string;                           // Due date
  dueComplete: boolean;                   // Due date completed
}
```

#### TrelloChecklist
```typescript
interface TrelloChecklist {
  id: string;                             // 24-character checklist ID
  name: string;                           // Checklist name
  idBoard: string;                        // Parent board ID
  idCard: string;                         // Parent card ID
  pos: number;                            // Position on card
  checkItems: TrelloCheckItem[];          // Checklist items
}

interface TrelloCheckItem {
  id: string;                             // 24-character item ID
  name: string;                           // Item text
  state: "complete" | "incomplete";      // Completion status
  pos: number;                            // Position in checklist
  due?: string;                           // Due date
  idMember?: string;                      // Assigned member
}
```

#### TrelloAttachment
```typescript
interface TrelloAttachment {
  id: string;                             // 24-character attachment ID
  name: string;                           // Attachment name
  url: string;                            // Attachment URL
  bytes?: number;                         // File size in bytes
  date: string;                           // Upload timestamp
  mimeType?: string;                      // MIME type
  previews?: TrelloAttachmentPreview[];   // Preview images
}
```

#### TrelloAction
```typescript
interface TrelloAction {
  id: string;                             // 24-character action ID
  type: string;                           // Action type
  date: string;                           // Action timestamp
  data: object;                           // Action-specific data
  memberCreator: TrelloMember;            // Action performer
  card?: TrelloCard;                      // Related card (if applicable)
  board?: TrelloBoard;                    // Related board (if applicable)
  list?: TrelloList;                      // Related list (if applicable)
}
```

## Error Handling

### Error Response Structure

```typescript
interface MCPError {
  code: number;                           // Error code
  message: string;                        // Error message
  data?: object;                          // Additional error data
}

interface TrelloError {
  message: string;                        // User-friendly error message
  error: string;                          // Technical error details
  status?: number;                        // HTTP status code
  code: string;                           // Error category code
}
```

### Error Codes

| Code | Category | Description |
|------|----------|-------------|
| `INVALID_CREDENTIALS` | Authentication | API key or token invalid |
| `INSUFFICIENT_PERMISSIONS` | Authorization | Token lacks required permissions |
| `NOT_FOUND` | Resource | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | Rate Limiting | API rate limit exceeded |
| `VALIDATION_ERROR` | Input | Invalid input parameters |
| `NETWORK_ERROR` | Network | Network connectivity issues |
| `TIMEOUT_ERROR` | Network | Request timeout |
| `SERVER_ERROR` | Server | Trello API server error |
| `UNKNOWN_ERROR` | General | Unexpected error occurred |

### Error Examples

```json
// Invalid credentials
{
  "error": {
    "code": -32000,
    "message": "Invalid or expired Trello credentials. Please update your API key and token in Claude Desktop settings.",
    "data": {
      "code": "INVALID_CREDENTIALS",
      "status": 401
    }
  }
}

// Resource not found
{
  "error": {
    "code": -32000,
    "message": "Board not found. It may have been deleted or you may not have access.",
    "data": {
      "code": "NOT_FOUND",
      "status": 404
    }
  }
}

// Rate limit exceeded
{
  "error": {
    "code": -32000,
    "message": "Rate limit exceeded. Please wait before making additional requests.",
    "data": {
      "code": "RATE_LIMIT_EXCEEDED",
      "status": 429,
      "retryAfter": 10
    }
  }
}
```

## Rate Limiting

### Trello API Limits

- **Request Limit**: 300 requests per 10 seconds per API key
- **Reset Interval**: Every 10 seconds
- **Burst Capacity**: Up to 300 requests immediately

### Rate Limit Headers

```typescript
interface RateLimitInfo {
  limit: number;                          // Total requests allowed
  remaining: number;                      // Requests remaining
  resetTime: number;                      // Reset timestamp (Unix)
}
```

### Rate Limit Handling

The MCP server automatically handles rate limiting:

1. **Detection**: Monitors rate limit headers in API responses
2. **Retry Logic**: Implements exponential backoff for retry attempts
3. **Automatic Recovery**: Waits for rate limit reset before retrying
4. **Client Notification**: Provides clear error messages for rate limit issues

## Authentication

### Credential Requirements

```typescript
interface TrelloCredentials {
  apiKey: string;                         // 32-character API key
  token: string;                          // 64+ character token
}
```

### Token Permissions

Required token permissions:
- **Read**: Access to view boards, cards, lists, members
- **Write**: Ability to create, update, and delete content
- **Account**: Access to user profile information

### Credential Validation

```bash
# Test credentials
curl "https://api.trello.com/1/members/me?key=API_KEY&token=TOKEN"

# Expected response: User profile with boards and organizations
```

## Response Formats

### Standard Response Structure

```typescript
interface ToolResponse {
  content: ContentBlock[];
}

interface ContentBlock {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
}
```

### Text Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "## Board: Project Management\n\n**Lists:**\n- To Do (5 cards)\n- In Progress (3 cards)\n- Done (12 cards)\n\n**Summary:** 20 total cards, 8 active cards"
    }
  ]
}
```

### Rich Response Format

```json
{
  "content": [
    {
      "type": "text", 
      "text": "Card created successfully!"
    },
    {
      "type": "resource",
      "resource": {
        "uri": "trello://card/card_id",
        "name": "New Task Card",
        "description": "Task created in To Do list"
      }
    }
  ]
}
```

## SDK Usage Examples

### Basic Tool Call

```typescript
// MCP client calling a tool
const response = await client.callTool({
  name: "trello_get_user_boards",
  arguments: {
    filter: "open"
  }
});
```

### Error Handling

```typescript
try {
  const response = await client.callTool({
    name: "get_board_details",
    arguments: {
      boardId: "invalid_id"
    }
  });
} catch (error) {
  if (error.code === "NOT_FOUND") {
    console.log("Board not found");
  } else if (error.code === "INVALID_CREDENTIALS") {
    console.log("Please check your API credentials");
  }
}
```

### Batch Operations

```typescript
// Multiple related operations
const boardResponse = await client.callTool({
  name: "get_board_details",
  arguments: { boardId: "board_id", includeLists: true }
});

const cardResponse = await client.callTool({
  name: "create_card",
  arguments: {
    name: "New Task",
    idList: boardResponse.result.lists[0].id
  }
});
```

---

**Next**: Review [Tool Development](Tool-Development) for creating custom tools or [Testing](Testing) for testing strategies.