# Available Tools Reference

Trello Desktop MCP provides 20 comprehensive tools organized into 6 categories for complete Trello integration.

## Tool Categories Overview

| Category | Tools | Primary Use Cases |
|----------|-------|------------------|
| [Essential Tools](#essential-tools) | 5 tools | Core functionality for basic operations |
| [Board Management](#board-management-tools) | 3 tools | Board and list operations |
| [Card Operations](#card-operations-tools) | 4 tools | Complete card lifecycle management |
| [Collaboration](#collaboration-tools) | 3 tools | Team communication and member management |
| [Search & Discovery](#search--discovery-tools) | 1 tool | Universal search across all content |
| [Advanced Features](#advanced-features-tools) | 6 tools | Detailed operations and metadata access |

---

## Essential Tools

These 5 tools provide the core functionality needed for basic Trello operations.

### `trello_search`
**Universal search across all Trello content**

```typescript
// Search for cards, boards, members, or organizations
{
  query: "project update",           // Search term
  modelTypes?: ["boards", "cards"],  // Optional: filter by type
  boardIds?: ["board1", "board2"],   // Optional: search specific boards
  cardsLimit?: 20                    // Optional: limit results
}
```

**Use Cases**:
- Find cards by title or description content
- Locate boards by name across your organization
- Search for team members across projects
- Discover related content quickly

### `trello_get_user_boards`
**Get all boards accessible to the current user**

```typescript
// Get user's boards with optional filtering
{
  filter?: "open" | "closed" | "all"  // Default: "open"
}
```

**Use Cases**:
- List all available project boards
- Get overview of user's Trello workspace
- Identify archived or closed projects
- Board discovery for new users

### `get_board_details`
**Get comprehensive board information with optional lists and cards**

```typescript
// Get detailed board information
{
  boardId: "board_id_here",     // 24-character board ID
  includeLists?: true,          // Include board lists
  includeCards?: true           // Include all cards
}
```

**Use Cases**:
- Get complete project overview
- Generate project status reports
- Analyze board structure and content
- Export board data for documentation

### `get_card`
**Get comprehensive card details including members, labels, and checklists**

```typescript
// Get detailed card information
{
  cardId: "card_id_here",       // 24-character card ID
  includeMembers?: true,        // Include assigned members
  includeLabels?: true,         // Include card labels
  includeChecklists?: true      // Include checklists
}
```

**Use Cases**:
- Review task details and progress
- Check task assignments and due dates
- Analyze card metadata and history
- Generate detailed task reports

### `create_card`
**Create new cards with full metadata support**

```typescript
// Create a comprehensive new card
{
  name: "Task Title",                    // Required: card title
  idList: "list_id_here",               // Required: destination list ID
  desc?: "Detailed description",         // Optional: card description
  pos?: "top" | "bottom" | 1234,        // Optional: position in list
  due?: "2024-12-31T23:59:59.000Z",     // Optional: due date (ISO format)
  idMembers?: ["member1", "member2"],    // Optional: assign members
  idLabels?: ["label1", "label2"]        // Optional: add labels
}
```

**Use Cases**:
- Create new project tasks with assignments
- Add tasks with detailed descriptions and due dates
- Set up recurring tasks with templates
- Batch create tasks from requirements

---

## Board Management Tools

These 3 tools handle board and list-level operations.

### `list_boards` (Legacy)
**List user's boards with basic filtering**

```typescript
// Simple board listing (legacy compatibility)
{
  filter?: "open" | "closed" | "all"
}
```

**Use Cases**:
- Quick board overview
- Legacy system compatibility
- Simple board discovery

### `get_lists`
**Get all lists in a specific board**

```typescript
// Get board lists with filtering
{
  boardId: "board_id_here",        // Required: board ID
  filter?: "open" | "closed" | "all"  // Optional: list status filter
}
```

**Use Cases**:
- Understand project workflow stages
- Analyze board organization
- Prepare for card operations
- Generate board structure reports

### `trello_create_list`
**Create new lists on boards**

```typescript
// Create a new workflow stage
{
  name: "In Review",                   // Required: list name
  idBoard: "board_id_here",           // Required: target board ID
  pos?: "top" | "bottom" | 1234       // Optional: position on board
}
```

**Use Cases**:
- Add new workflow stages
- Customize project processes
- Create temporary project phases
- Set up board templates

---

## Card Operations Tools

These 4 tools provide complete card lifecycle management.

### `update_card`
**Update existing card properties**

```typescript
// Update card with new information
{
  cardId: "card_id_here",              // Required: card to update
  name?: "New Title",                  // Optional: update title
  desc?: "Updated description",         // Optional: update description
  due?: "2024-12-31T23:59:59.000Z",   // Optional: update due date
  closed?: false,                      // Optional: archive/unarchive
  idMembers?: ["member1", "member2"],  // Optional: update assignments
  idLabels?: ["label1", "label2"]      // Optional: update labels
}
```

**Use Cases**:
- Update task progress and status
- Modify task assignments and deadlines
- Add or remove task labels
- Archive completed tasks

### `move_card`
**Move cards between lists to update workflow status**

```typescript
// Move card to different workflow stage
{
  cardId: "card_id_here",              // Required: card to move
  idList: "destination_list_id",       // Required: target list ID
  pos?: "top" | "bottom" | 1234        // Optional: position in target list
}
```

**Use Cases**:
- Progress tasks through workflow
- Reorganize task priorities
- Update project status
- Batch move related tasks

### `trello_add_comment`
**Add comments to cards for team communication**

```typescript
// Add team communication to cards
{
  cardId: "card_id_here",              // Required: target card ID
  text: "Status update or question"     // Required: comment content
}
```

**Use Cases**:
- Provide task status updates
- Ask questions about requirements
- Document decisions and changes
- Facilitate team communication

### `trello_get_list_cards`
**Get all cards from a specific list**

```typescript
// Get cards from a workflow stage
{
  listId: "list_id_here",              // Required: list ID
  filter?: "open" | "closed" | "all",  // Optional: card status filter
  includeMembers?: true,               // Optional: include member data
  includeLabels?: true                 // Optional: include label data
}
```

**Use Cases**:
- Review tasks in workflow stage
- Generate stage-specific reports
- Analyze bottlenecks and workload
- Monitor stage completion rates

---

## Collaboration Tools

These 3 tools facilitate team member management and communication.

### `trello_get_member`
**Get detailed information about team members**

```typescript
// Get member profile and activity
{
  memberId: "member_id_or_username",   // Required: member identifier
  includeBoards?: true,                // Optional: include member's boards
  includeOrganizations?: true          // Optional: include organizations
}
```

**Use Cases**:
- Review team member profiles
- Understand member project involvement
- Analyze team member workload
- Generate team directory information

### `trello_get_board_members`
**Get all members with access to a specific board**

```typescript
// Get board team members
{
  boardId: "board_id_here"             // Required: board ID
}
```

**Use Cases**:
- Review project team composition
- Understand access permissions
- Generate team contact lists
- Analyze team collaboration patterns

### `trello_get_board_labels`
**Get all available labels for a board**

```typescript
// Get board labeling system
{
  boardId: "board_id_here"             // Required: board ID
}
```

**Use Cases**:
- Understand project categorization system
- Standardize task labeling
- Generate label usage reports
- Plan label organization strategies

---

## Search & Discovery Tools

This comprehensive tool provides universal search capabilities.

### `trello_search` 
**Universal search across boards, cards, members, and organizations**

```typescript
// Comprehensive search with filtering
{
  query: "search terms",               // Required: search query
  modelTypes?: [                       // Optional: filter by content type
    "boards", "cards", "members", 
    "organizations", "actions"
  ],
  boardIds?: ["board1", "board2"],     // Optional: search specific boards
  boardsLimit?: 10,                    // Optional: limit board results
  cardsLimit?: 50,                     // Optional: limit card results
  membersLimit?: 25                    // Optional: limit member results
}
```

**Use Cases**:
- Find content across entire Trello workspace
- Locate specific tasks or projects quickly
- Search for team members and their contributions
- Discover related content and connections

---

## Advanced Features Tools

These 6 tools provide access to detailed metadata and advanced operations.

### `trello_get_board_cards`
**Get all cards from a board with attachments and member information**

```typescript
// Get comprehensive board card data
{
  boardId: "board_id_here",            // Required: board ID
  includeAttachments?: true,           // Optional: include file attachments
  includeMembers?: true,               // Optional: include member assignments
  filter?: "open"                      // Optional: card status filter
}
```

**Use Cases**:
- Generate comprehensive board reports
- Analyze project content and progress
- Export board data for documentation
- Review project attachments and files

### `trello_get_card_actions`
**Get card activity history and comments**

```typescript
// Get card activity timeline
{
  cardId: "card_id_here",              // Required: card ID
  filter?: "commentCard,updateCard",   // Optional: action type filter
  limit?: 50                           // Optional: limit number of actions
}
```

**Use Cases**:
- Review task change history
- Analyze team collaboration patterns
- Generate activity reports
- Track decision-making processes

### `trello_get_card_attachments`
**Get all attachments and files linked to a card**

```typescript
// Get card file attachments
{
  cardId: "card_id_here",              // Required: card ID
  fields?: ["name", "url", "bytes"]    // Optional: specify return fields
}
```

**Use Cases**:
- Review task-related files and documents
- Generate file inventory reports
- Access task supporting materials
- Analyze file usage patterns

### `trello_get_card_checklists`
**Get card checklists and checklist items**

```typescript
// Get card checklist data
{
  cardId: "card_id_here",              // Required: card ID
  includeCheckItems?: true,            // Optional: include individual items
  fields?: ["name", "checkItems"]      // Optional: specify return fields
}
```

**Use Cases**:
- Review task sub-items and progress
- Generate task completion reports
- Analyze task complexity and scope
- Track detailed task progress

### `trello_get_board_members`
**Get detailed information about all board members**

```typescript
// Get comprehensive board team data
{
  boardId: "board_id_here"             // Required: board ID
}
```

**Use Cases**:
- Generate team directory for projects
- Analyze team composition and roles
- Review team access and permissions
- Plan team communication strategies

### `trello_get_board_labels`
**Get all labels available on a board for categorization**

```typescript
// Get board label system
{
  boardId: "board_id_here"             // Required: board ID
}
```

**Use Cases**:
- Standardize project categorization
- Generate label usage analytics
- Plan task organization strategies
- Review project taxonomy systems

---

## Tool Usage Patterns

### Common Workflows

1. **Project Setup**:
   - `trello_get_user_boards` → `get_board_details` → `trello_create_list`

2. **Task Management**:
   - `create_card` → `update_card` → `move_card` → `trello_add_comment`

3. **Project Monitoring**:
   - `get_board_details` → `trello_get_board_cards` → `trello_get_card_actions`

4. **Team Collaboration**:
   - `trello_get_board_members` → `trello_get_member` → `trello_add_comment`

### Best Practices

- **Use Specific Tools**: Choose the most specific tool for your needs
- **Include Metadata**: Use optional parameters for richer responses
- **Batch Operations**: Group related operations together
- **Handle Errors**: Always check response status and handle errors gracefully

---

**Next**: Check out [Usage Examples](Usage-Examples) for practical implementation scenarios.