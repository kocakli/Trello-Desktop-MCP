# Quick Start Guide

Get up and running with Trello Desktop MCP in 5 minutes! This guide assumes you've completed the [Installation Guide](Installation-Guide).

## 5-Minute Startup

### Step 1: Verify Connection (30 seconds)
Test your setup with Claude Desktop:

```
Show me my Trello boards
```

**Expected Result**: You should see a list of your accessible Trello boards.

### Step 2: Explore a Board (1 minute)
Get detailed information about one of your boards:

```
Show me details for my "Project Management" board including all lists and cards
```

**Expected Result**: Complete board overview with lists, cards, and basic statistics.

### Step 3: Create Your First Card (1 minute)
Add a new task to one of your boards:

```
Create a new card called "Test MCP Integration" in the "To Do" list of my Project Management board
```

**Expected Result**: New card created with confirmation and card details.

### Step 4: Search Across Content (30 seconds)
Test the universal search functionality:

```
Search for all cards containing "meeting" across my boards
```

**Expected Result**: List of cards matching your search term with context.

### Step 5: Update and Move Cards (2 minutes)
Practice basic card management:

```
Add a comment to the "Test MCP Integration" card: "Successfully integrated Trello with Claude!"
```

Then move the card:

```
Move the "Test MCP Integration" card to the "Done" list
```

**Expected Results**: Card updated with comment and moved to completion status.

## Essential Commands to Try

### Board Management
```
# Get all your boards
"List all my Trello boards"

# Get board structure
"Show me all lists in my [Board Name] board"

# Create new workflow stage
"Create a new list called 'Code Review' in my Development board"
```

### Card Operations
```
# Create cards with details
"Create a card 'Fix login bug' in the Bugs list with description 'Users cannot log in with special characters' and assign it to @username"

# Update card information
"Update the 'Fix login bug' card to add due date of next Friday"

# Move cards between stages
"Move all cards from 'In Progress' to 'Code Review' in my Development board"
```

### Search and Discovery
```
# Universal search
"Find all cards related to 'authentication' across my boards"

# Find team members
"Show me information about team member @johndoe"

# Search within specific boards
"Search for 'bug' in my Development and Testing boards only"
```

### Team Collaboration
```
# Add comments
"Add comment to card 'Deploy v2.0': 'Deployment scheduled for Monday 9 AM'"

# Get team information
"Who are all the members of my Project Management board?"

# Review activity
"Show me recent activity on the 'Deploy v2.0' card"
```

## Common Use Case Examples

### Daily Standup Preparation
```
"Show me all cards assigned to me across all boards that are due this week"
```

### Project Status Report
```
"Give me a summary of my 'Q4 Goals' board including card counts in each list and any overdue items"
```

### Team Coordination
```
"Show me all cards in 'Blocked' status across my development boards and their latest comments"
```

### Sprint Planning
```
"Create cards for these user stories in my 'Sprint Backlog' list: [list of features]"
```

## Understanding Responses

### Board Information
When you request board information, you'll get:
- Board name, description, and URL
- List of workflow stages (lists)
- Card counts and basic statistics
- Team member information
- Recent activity summary

### Card Details
Card responses include:
- Title, description, and current status
- Assigned team members
- Due dates and completion status
- Labels and categorization
- Comments and activity history
- Attachments and linked files

### Search Results
Search responses provide:
- Matching cards with context
- Board and list locations
- Relevance scoring
- Member and organization matches
- Quick action suggestions

## Tips for Effective Usage

### 1. Use Natural Language
Instead of: `trello_get_board_details boardId=123`
Try: `"Show me everything about my Project Management board"`

### 2. Be Specific When Needed
Instead of: `"Show me cards"`
Try: `"Show me all overdue cards assigned to me in my Development board"`

### 3. Combine Operations
Instead of multiple separate requests:
Try: `"Create a new card 'Review proposal' in To Do list, assign it to @sarah, set due date to Friday, and add comment 'High priority item'"`

### 4. Use Context
Claude remembers context within a conversation:
```
"Show me my Project Management board"
"Create a new card in the To Do list"  # Refers to the previously mentioned board
"Move it to In Progress"               # Refers to the just-created card
```

### 5. Ask for Summaries
Get overview information:
```
"Give me a weekly summary of activity on my Development board"
"What's the current status of all my projects?"
```

## Next Steps

### Learn More Tools
- Review [Available Tools](Available-Tools) for complete functionality
- Check [Usage Examples](Usage-Examples) for advanced scenarios

### Optimize Your Workflow
- Read [Best Practices](Best-Practices) for efficient usage
- Explore [Advanced Features](Advanced-Features) for power users

### Get Help
- Check [Troubleshooting](Troubleshooting) for common issues
- Visit [FAQ](FAQ) for frequently asked questions

## Quick Reference Card

| Task | Natural Language Command |
|------|-------------------------|
| **List boards** | "Show me all my Trello boards" |
| **Board details** | "Show me details of my [Board Name] board" |
| **Create card** | "Create card '[Title]' in '[List]' list of '[Board]' board" |
| **Search content** | "Search for '[term]' across my boards" |
| **Move card** | "Move '[Card Name]' to '[List Name]' list" |
| **Add comment** | "Add comment '[text]' to '[Card Name]' card" |
| **Get card info** | "Show me details of '[Card Name]' card" |
| **List members** | "Who are the members of '[Board Name]' board?" |

---

**Congratulations!** You're now ready to use Trello Desktop MCP effectively. Explore [Usage Examples](Usage-Examples) for more advanced scenarios.