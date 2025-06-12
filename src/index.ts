#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  InitializeRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

// Desktop-specific: Check for local credentials
const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

// No console output in MCP mode - only JSON-RPC on stdout!
if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
  process.exit(1);
}

// Import tools with credential injection
import { 
  listBoardsTool, 
  getBoardDetailsTool,
  getListsTool,
  handleListBoards,
  handleGetBoardDetails,
  handleGetLists
} from './tools/boards.js';

import { 
  createCardTool, 
  updateCardTool,
  moveCardTool,
  getCardTool,
  handleCreateCard,
  handleUpdateCard,
  handleMoveCard,
  handleGetCard
} from './tools/cards.js';

import {
  trelloSearchTool,
  handleTrelloSearch
} from './tools/search.js';

import {
  trelloGetListCardsTool,
  handleTrelloGetListCards,
  trelloCreateListTool,
  handleTrelloCreateList,
  trelloAddCommentTool,
  handleTrelloAddComment
} from './tools/lists.js';

import {
  trelloGetUserBoardsTool,
  handleTrelloGetUserBoards,
  trelloGetMemberTool,
  handleTrelloGetMember
} from './tools/members.js';

import {
  trelloGetBoardCardsTool,
  handleTrelloGetBoardCards,
  trelloGetCardActionsTool,
  handleTrelloGetCardActions,
  trelloGetCardAttachmentsTool,
  handleTrelloGetCardAttachments,
  trelloGetCardChecklistsTool,
  handleTrelloGetCardChecklists,
  trelloGetBoardMembersTool,
  handleTrelloGetBoardMembers,
  trelloGetBoardLabelsTool,
  handleTrelloGetBoardLabels
} from './tools/advanced.js';

// Create server instance
const server = new Server(
  {
    name: 'trello-mcp-desktop',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Initialize handler
server.setRequestHandler(InitializeRequestSchema, async () => {
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    serverInfo: {
      name: 'trello-mcp-desktop',
      version: '1.0.0'
    }
  };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Phase 1: Essential tools
      trelloSearchTool,
      trelloGetUserBoardsTool,
      getBoardDetailsTool,
      getCardTool,
      createCardTool,
      // Phase 2: Core operations
      updateCardTool,
      moveCardTool,
      trelloAddCommentTool,
      trelloGetListCardsTool,
      trelloCreateListTool,
      // Original tools (maintained for compatibility)
      listBoardsTool,
      getListsTool,
      // Member management
      trelloGetMemberTool,
      // Phase 3: Advanced features
      trelloGetBoardCardsTool,
      trelloGetCardActionsTool,
      trelloGetCardAttachmentsTool,
      trelloGetCardChecklistsTool,
      trelloGetBoardMembersTool,
      trelloGetBoardLabelsTool
    ]
  };
});

// Handle tool calls with automatic credential injection
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Inject credentials into arguments
  const argsWithCredentials = {
    ...args,
    apiKey: TRELLO_API_KEY,
    token: TRELLO_TOKEN
  };
  
  try {
    let result;
    
    switch (name) {
      // Phase 1: Essential tools
      case 'trello_search':
        result = await handleTrelloSearch(argsWithCredentials);
        break;
      
      case 'trello_get_user_boards':
        result = await handleTrelloGetUserBoards(argsWithCredentials);
        break;
      
      case 'get_board_details':
        result = await handleGetBoardDetails(argsWithCredentials);
        break;
      
      case 'get_card':
        result = await handleGetCard(argsWithCredentials);
        break;
      
      case 'create_card':
        result = await handleCreateCard(argsWithCredentials);
        break;
      
      // Phase 2: Core operations
      case 'update_card':
        result = await handleUpdateCard(argsWithCredentials);
        break;
      
      case 'move_card':
        result = await handleMoveCard(argsWithCredentials);
        break;
      
      case 'trello_add_comment':
        result = await handleTrelloAddComment(argsWithCredentials);
        break;
      
      case 'trello_get_list_cards':
        result = await handleTrelloGetListCards(argsWithCredentials);
        break;
      
      case 'trello_create_list':
        result = await handleTrelloCreateList(argsWithCredentials);
        break;
      
      // Original tools (maintained for compatibility)
      case 'list_boards':
        result = await handleListBoards(argsWithCredentials);
        break;
      
      case 'get_lists':
        result = await handleGetLists(argsWithCredentials);
        break;
      
      // Member management
      case 'trello_get_member':
        result = await handleTrelloGetMember(argsWithCredentials);
        break;
      
      // Phase 3: Advanced features
      case 'trello_get_board_cards':
        result = await handleTrelloGetBoardCards(argsWithCredentials);
        break;
      
      case 'trello_get_card_actions':
        result = await handleTrelloGetCardActions(argsWithCredentials);
        break;
      
      case 'trello_get_card_attachments':
        result = await handleTrelloGetCardAttachments(argsWithCredentials);
        break;
      
      case 'trello_get_card_checklists':
        result = await handleTrelloGetCardChecklists(argsWithCredentials);
        break;
      
      case 'trello_get_board_members':
        result = await handleTrelloGetBoardMembers(argsWithCredentials);
        break;
      
      case 'trello_get_board_labels':
        result = await handleTrelloGetBoardLabels(argsWithCredentials);
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return result;
    
  } catch (error) {
    throw error;
  }
});

// List resources (empty for now)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: [] };
});

// List prompts (empty for now)
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: [] };
});

// Error handler
process.on('uncaughtException', (_error) => {
  process.exit(1);
});

process.on('unhandledRejection', (_reason) => {
  process.exit(1);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Server is running - no output needed
}

main().catch((_error) => {
  process.exit(1);
});