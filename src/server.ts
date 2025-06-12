import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { 
  listBoardsTool, 
  handleListBoards,
  getBoardDetailsTool,
  handleGetBoardDetails,
  getListsTool,
  handleGetLists
} from './tools/boards.js';
import { 
  createCardTool, 
  handleCreateCard,
  updateCardTool,
  handleUpdateCard,
  moveCardTool,
  handleMoveCard,
  getCardTool,
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

export function createMCPServer() {
  const server = new Server(
    {
      name: 'trello-mcp-server',
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

  // Handle MCP initialization
  server.setRequestHandler(InitializeRequestSchema, async (_request) => {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      serverInfo: {
        name: 'trello-mcp-server',
        version: '1.0.0',
      },
    };
  });

  // Handle list tools request
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
      ],
    };
  });

  // Handle list resources request (required by MCP spec)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [],
    };
  });

  // Handle list prompts request (required by MCP spec)
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      // Phase 1: Essential tools
      case 'trello_search':
        return await handleTrelloSearch(args);
      
      case 'trello_get_user_boards':
        return await handleTrelloGetUserBoards(args);
      
      case 'get_board_details':
        return await handleGetBoardDetails(args);
      
      case 'get_card':
        return await handleGetCard(args);
      
      case 'create_card':
        return await handleCreateCard(args);
      
      // Phase 2: Core operations
      case 'update_card':
        return await handleUpdateCard(args);
      
      case 'move_card':
        return await handleMoveCard(args);
      
      case 'trello_add_comment':
        return await handleTrelloAddComment(args);
      
      case 'trello_get_list_cards':
        return await handleTrelloGetListCards(args);
      
      case 'trello_create_list':
        return await handleTrelloCreateList(args);
      
      // Original tools (maintained for compatibility)
      case 'list_boards':
        return await handleListBoards(args);
      
      case 'get_lists':
        return await handleGetLists(args);
      
      // Member management
      case 'trello_get_member':
        return await handleTrelloGetMember(args);
      
      // Phase 3: Advanced features
      case 'trello_get_board_cards':
        return await handleTrelloGetBoardCards(args);
      
      case 'trello_get_card_actions':
        return await handleTrelloGetCardActions(args);
      
      case 'trello_get_card_attachments':
        return await handleTrelloGetCardAttachments(args);
      
      case 'trello_get_card_checklists':
        return await handleTrelloGetCardChecklists(args);
      
      case 'trello_get_board_members':
        return await handleTrelloGetBoardMembers(args);
      
      case 'trello_get_board_labels':
        return await handleTrelloGetBoardLabels(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}