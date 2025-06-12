# Best Practices Guide

This guide provides recommendations for optimal usage of Trello Desktop MCP in various scenarios.

## General Usage Best Practices

### 1. Efficient Command Patterns

#### Use Specific Requests
```
# ❌ Avoid vague requests
"Show me stuff about my project"

# ✅ Use specific, actionable requests
"Show me all overdue cards in my Development board"
"List cards assigned to me in the 'In Progress' status"
```

#### Leverage Context
```
# ✅ Build on previous context
"Show me my Project Management board"
"Create a new card in the To Do list"        # References previous board
"Assign it to @sarah and set due date Friday" # References created card
```

#### Batch Related Operations
```
# ✅ Combine related operations
"Create a new card 'Review API documentation' in To Do list, assign to @developer, set due date to next Tuesday, and add comment 'High priority for sprint demo'"
```

### 2. Search and Discovery Optimization

#### Use Targeted Search
```
# ❌ Overly broad search
"Search for everything"

# ✅ Targeted search with context
"Search for cards containing 'authentication' in my Development and Security boards"
"Find all cards assigned to me that are due this week"
```

#### Leverage Search Filters
```
# Search specific content types
"Search for team members working on authentication features"

# Search within specific boards
"Search for 'bug' cards in my active development boards only"
```

### 3. Card Management Best Practices

#### Descriptive Card Creation
```
# ✅ Comprehensive card creation
"Create card 'Implement OAuth 2.0 login' in Development Backlog with description 'Add OAuth login for Google and GitHub providers. Include error handling and user feedback.' and assign to @auth-team"
```

#### Strategic Card Updates
```
# ✅ Meaningful progress updates
"Update 'Database migration' card: add comment 'Migration script tested on staging. Ready for production deployment on Friday 2 PM.'"

# ✅ Status progression with context
"Move 'User dashboard redesign' from 'In Progress' to 'Code Review' and add comment 'Frontend complete, needs backend review'"
```

## Project Management Best Practices

### 1. Daily Workflow Optimization

#### Morning Standup Preparation
```
"Show me all cards assigned to me that are due today or overdue"
"Get recent activity on cards I'm watching"
"List all cards moved to 'Blocked' status in my teams' boards"
```

#### End-of-Day Summary
```
"Show me all cards I moved to 'Done' today"
"Add progress comments to my active cards"
"Review tomorrow's due dates across my boards"
```

### 2. Sprint and Iteration Management

#### Sprint Planning
```
# Review backlog systematically
"Show me all cards in 'Sprint Backlog' with effort estimates and assignments"

# Create sprint structure
"Create sprint lists: 'Sprint 15 - Planning', 'Sprint 15 - In Progress', 'Sprint 15 - Review', 'Sprint 15 - Done'"

# Batch sprint setup
"Move top 10 priority cards from Backlog to Sprint 15 Planning and assign based on team capacity"
```

#### Sprint Monitoring
```
# Track sprint progress
"Show me Sprint 15 progress: cards completed vs. remaining"
"Identify bottlenecks: cards in 'In Progress' for more than 3 days"
"Generate sprint burndown data from card completion dates"
```

### 3. Cross-functional Coordination

#### Dependency Management
```
# Track cross-team dependencies
"Search for cards containing 'depends on' or 'blocked by' across all project boards"
"Show me all cards assigned to external teams with upcoming deadlines"
```

#### Communication Patterns
```
# Effective status communication
"Add status update to 'API integration' card: 'Backend complete. Frontend team can begin integration. API docs updated in Confluence.'"

# Proactive blocker communication
"Create card 'Resolve database performance issue' in Infrastructure board and add comment 'Blocking user dashboard development. Need DBA support by Wednesday.'"
```

## Team Collaboration Best Practices

### 1. Effective Communication

#### Comment Best Practices
```
# ✅ Informative comments with context
"Add comment to 'Payment gateway integration': 'Testing complete on sandbox. Found edge case with international currencies. Fix applied. Ready for staging deployment.'"

# ✅ Action-oriented comments
"Add comment: 'Code review completed. Two minor suggestions in PR comments. Please address and re-request review.'"
```

#### Status Updates
```
# ✅ Comprehensive status updates
"Update 'Mobile app release' card: change due date to next Friday, add @qa-team as members, and comment 'Additional testing time needed for iOS compatibility'"
```

### 2. Code Review and QA Processes

#### Review Workflow
```
# Systematic review management
"Show me all cards in 'Code Review' status across development boards"
"Move reviewed cards to appropriate next status with feedback comments"
```

#### QA Coordination
```
# QA handoff process
"Move 'User authentication' from 'Development Done' to 'QA Testing' and add comment 'Test cases: login, logout, password reset, account creation. Test data available in staging.'"
```

### 3. Documentation and Knowledge Sharing

#### Documentation Tracking
```
# Documentation workflow
"Create card 'Update API documentation for v2.0' in Documentation board with checklist of all endpoints"
"Track documentation cards across all projects for quarterly review"
```

#### Knowledge Capture
```
# Lessons learned documentation
"Add retrospective comment to completed cards: 'Lessons learned: early API mocking saved 2 weeks development time'"
```

## Performance and Efficiency Best Practices

### 1. Request Optimization

#### Minimize API Calls
```
# ❌ Multiple individual requests
"Show me board 1"
"Show me board 2" 
"Show me board 3"

# ✅ Single comprehensive request
"Show me summary of my top 3 active project boards with current status"
```

#### Use Appropriate Detail Levels
```
# For overviews - minimal detail
"List my boards with card counts"

# For detailed work - full detail
"Show me complete details for 'Q4 Product Launch' board including all cards, members, and recent activity"
```

### 2. Data Organization

#### Consistent Labeling Strategy
```
# Establish label conventions
"Show me all available labels in my Development board for standardization"

# Apply labels systematically
"Add labels 'frontend', 'high-priority', 'bug' to cards matching those criteria"
```

#### Board Structure Optimization
```
# Review board organization
"Analyze workflow efficiency: show me average time cards spend in each list"

# Optimize workflow stages
"Create additional list 'Code Review - Backend' to separate frontend and backend review processes"
```

### 3. Automation and Workflows

#### Template-based Card Creation
```
# Bug report template
"Create bug report card: 'Title: [Bug Description]' with description template including steps to reproduce, expected behavior, actual behavior, and environment details"

# Feature request template
"Create feature card with standard template: user story, acceptance criteria, technical notes, and effort estimate"
```

#### Batch Operations
```
# Batch status updates
"Move all cards tagged 'release-ready' from various lists to 'Deployment Queue'"

# Batch assignments
"Assign all 'frontend' labeled cards in current sprint to @frontend-team"
```

## Security and Compliance Best Practices

### 1. Credential Management

#### Secure Configuration
```
# ✅ Environment-based credentials
"Store API credentials in Claude Desktop config only - never in code or shared documents"

# ✅ Regular credential rotation
"Update Trello API tokens quarterly and regenerate if exposed"
```

#### Access Control
```
# Review access patterns
"Show me all boards I have access to for quarterly access review"

# Principle of least privilege
"Ensure team members only have access to boards relevant to their projects"
```

### 2. Data Privacy

#### Sensitive Information Handling
```
# Avoid sensitive data in card titles or descriptions
# Use references instead: "Customer issue #12345" rather than "John Smith payment problem"

# Use private boards for sensitive discussions
"Create private board for security review process with limited team access"
```

### 3. Audit and Compliance

#### Activity Tracking
```
# Regular activity reviews
"Show me all card modifications in the past week for audit trail"

# Change documentation
"Add change reason to card comments when making significant updates"
```

## Troubleshooting Best Practices

### 1. Proactive Issue Prevention

#### Regular Health Checks
```
# Weekly system check
"Test basic functionality: show me my boards and create a test card"

# Credential validation
"Verify API access: show me current user information"
```

#### Configuration Backup
```
# Backup Claude Desktop configuration before changes
# Document configuration changes with dates and reasons
```

### 2. Systematic Issue Resolution

#### Error Information Collection
```
# When encountering errors, gather:
# - Exact error message
# - Command that caused the error  
# - Recent configuration changes
# - System environment details
```

#### Incremental Troubleshooting
```
# Test basic functionality first
"Show me my Trello boards"  # Basic connectivity

# Then test specific features
"Create a test card"         # Write operations

# Finally test complex operations
"Search across all boards"   # Complex queries
```

## Scalability Best Practices

### 1. Large Team Management

#### Board Organization
```
# Separate concerns by board
# - Development work: "Project X - Development"
# - Planning and coordination: "Project X - Planning"  
# - Operations and maintenance: "Project X - Operations"
```

#### Role-based Access
```
# Organize team access by role
"Review board membership to ensure appropriate access levels"
"Create role-specific boards for different team functions"
```

### 2. High-Volume Usage

#### Request Pacing
```
# Spread out bulk operations
"Process large updates in batches with delays between requests"

# Use specific rather than broad queries
"Focus queries on specific boards or time periods rather than organization-wide searches"
```

#### Data Archival
```
# Regular cleanup
"Archive completed projects to maintain system performance"
"Review and close outdated cards quarterly"
```

## Measurement and Improvement

### 1. Usage Analytics

#### Track Productivity Metrics
```
# Measure team velocity
"Analyze cards completed per sprint over time"

# Identify bottlenecks
"Track average time in each workflow stage"
```

#### Process Optimization
```
# Regular process review
"Monthly review of workflow efficiency and tool usage patterns"

# Continuous improvement
"Gather team feedback on tool effectiveness and process pain points"
```

### 2. Best Practice Evolution

#### Regular Review
```
# Quarterly best practice review
# - What's working well?
# - What processes need improvement?
# - What new features can enhance productivity?
```

#### Knowledge Sharing
```
# Document successful patterns
# Share effective command patterns across team
# Create team-specific usage guides
```

## Quick Reference: Command Patterns

### Daily Operations
```bash
# Morning routine
"Show me today's priorities across all my boards"
"Check for any urgent items or blockers"

# Work session
"Update progress on active cards"
"Move completed items to done"

# End of day
"Review tomorrow's commitments"
"Add status updates to active work"
```

### Weekly Planning
```bash
# Week start
"Review sprint progress and upcoming deadlines"
"Plan week's priorities based on board status"

# Week end
"Summarize week's accomplishments"
"Identify next week's focus areas"
```

### Project Management
```bash
# Project initiation
"Set up project board structure with appropriate workflow stages"
"Create initial project cards with assignments and timelines"

# Project monitoring
"Track project progress across all workstreams"
"Identify risks and dependencies requiring attention"

# Project completion
"Archive completed project materials"
"Document lessons learned and best practices"
```

---

**Remember**: The key to effective usage is consistency, clear communication, and leveraging the tool's strengths for team coordination and project visibility.