# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trello MCP is a Model Context Protocol server providing Trello integration for any MCP-compatible client (Claude Desktop, Claude Code, Gemini CLI, etc.). It runs as a local stdio process, communicating via JSON-RPC over stdout. Credentials (`TRELLO_API_KEY`, `TRELLO_TOKEN`) are injected from environment variables at startup.

## Build & Development Commands

```bash
npm run build          # Compile TypeScript → dist/
npm run clean          # Remove dist/
npm run rebuild        # Clean + build
npm run type-check     # TypeScript check without emitting
```

There is no test runner, linter, or formatter configured. Validate changes with `npm run type-check`.

## Architecture

### Entry Point & Protocol

`src/index.ts` is the MCP server entry point. It reads credentials from env vars, registers 19 tools, and routes `CallToolRequest` to handler functions via a switch statement. Credentials are automatically injected into every tool handler call. **stdout is reserved for JSON-RPC** — use `console.error` (stderr) only for fatal startup diagnostics (e.g. missing env).

### Tool Modules

Each file in `src/tools/` exports two things per tool: a **tool definition** (schema object) and a **handler function**. Tools are organized in phases:

| Module | Tools | Domain |
|--------|-------|--------|
| `search.ts` | `trello_search` | Universal search |
| `boards.ts` | `trello_get_user_boards`, `get_board_details`, `list_boards`, `get_lists` | Board operations (last two are legacy) |
| `cards.ts` | `get_card`, `create_card`, `update_card`, `move_card` | Card CRUD |
| `lists.ts` | `trello_get_list_cards`, `trello_create_list`, `trello_add_comment` | List ops & comments |
| `members.ts` | `trello_get_member` + user boards handler | Member info |
| `advanced.ts` | Board cards, card actions/attachments/checklists, board members/labels | Extended features |

### Trello API Client

`src/trello/client.ts` wraps all Trello REST API calls with:
- Exponential backoff retry (3 attempts)
- 15-second request timeout via AbortController
- Rate limit header handling
- Typed error classification (network, auth, permissions, rate limit)

### Validation

`src/utils/validation.ts` uses Zod schemas to validate all tool inputs at runtime. Every handler validates its arguments before calling the API client.

### Type System

`src/types/trello.ts` defines all domain interfaces (`TrelloBoard`, `TrelloCard`, `TrelloList`, etc.) and request/response types (`CreateCardRequest`, `UpdateCardRequest`, `MoveCardRequest`).

## Key Conventions

- **ESM modules** — the project uses `"type": "module"` with `.js` extensions in imports (even for TypeScript sources)
- **Strict TypeScript** — `strict: true` plus `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- **Tool pattern** — when adding a new tool: define the schema object + handler in the appropriate `src/tools/` file, then register both in `src/index.ts` (add to `ListToolsRequestSchema` array and `CallToolRequestSchema` switch)
- **Credential injection** — handlers receive credentials via `argsWithCredentials`, never access env vars directly
- **No stdout logging** — use `src/utils/logger.ts` which is disabled when `MCP_DESKTOP_MODE` is set

## Adding a New Tool

1. Create or update a file in `src/tools/` with the tool definition (MCP schema) and handler function
2. Add Zod validation schema in `src/utils/validation.ts`
3. Import and register in `src/index.ts`: add to the tools array in `ListToolsRequestSchema` handler and add a case in the `CallToolRequestSchema` switch
4. Add any new types to `src/types/trello.ts`
5. Run `npm run type-check` to verify
