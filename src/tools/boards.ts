import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import { 
  validateListBoards, 
  validateGetBoard, 
  validateGetBoardLists, 
  formatValidationError,
  extractCredentials
} from '../utils/validation.js';

export const listBoardsTool: Tool = {
  name: 'list_boards',
  description: 'List all Trello boards accessible to the user. Use this to see all boards you have access to, or filter by status.',
  inputSchema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['all', 'open', 'closed'],
        description: 'Filter boards by status: "open" for active boards, "closed" for archived boards, "all" for both',
        default: 'open'
      }
    }
  }
};

export async function handleListBoards(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { filter } = validateListBoards(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getMyBoards(filter);
    const boards = response.data;
    
    const summary = `Found ${boards.length} ${filter} board(s)`;
    const boardList = boards.map(board => ({
      id: board.id,
      name: board.name,
      description: board.desc || 'No description',
      url: board.shortUrl,
      lastActivity: board.dateLastActivity,
      closed: board.closed
    }));
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            summary,
            boards: boardList,
            rateLimit: response.rateLimit
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof z.ZodError 
      ? formatValidationError(error)
      : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error listing boards: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const getBoardDetailsTool: Tool = {
  name: 'get_board_details',
  description: 'Get detailed information about a specific Trello board, including its lists and cards. Useful for understanding board structure and content.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'The ID of the board to retrieve (you can get this from list_boards)',
        pattern: '^[a-f0-9]{24}$'
      },
      includeDetails: {
        type: 'boolean',
        description: 'Include lists and cards in the response for complete board overview',
        default: false
      }
    },
    required: ['boardId']
  }
};

export async function handleGetBoardDetails(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { boardId, includeDetails } = validateGetBoard(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getBoard(boardId, includeDetails);
    const board = response.data;
    
    const result = {
      summary: `Board: ${board.name}`,
      board: {
        id: board.id,
        name: board.name,
        description: board.desc || 'No description',
        url: board.shortUrl,
        lastActivity: board.dateLastActivity,
        closed: board.closed,
        permissions: board.prefs?.permissionLevel || 'unknown',
        ...(includeDetails && {
          lists: board.lists?.map(list => ({
            id: list.id,
            name: list.name,
            position: list.pos,
            closed: list.closed
          })) || [],
          cards: board.cards?.map(card => ({
            id: card.id,
            name: card.name,
            description: card.desc,
            url: card.shortUrl,
            listId: card.idList,
            position: card.pos,
            due: card.due,
            closed: card.closed,
            labels: card.labels?.map(label => ({
              id: label.id,
              name: label.name,
              color: label.color
            })) || []
          })) || []
        })
      },
      rateLimit: response.rateLimit
    };
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof z.ZodError 
      ? formatValidationError(error)
      : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting board details: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const getListsTool: Tool = {
  name: 'get_lists',
  description: 'Get all lists in a specific Trello board. Use this to see the workflow columns (like "To Do", "In Progress", "Done") in a board.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'The ID of the board to get lists from (you can get this from list_boards)',
        pattern: '^[a-f0-9]{24}$'
      },
      filter: {
        type: 'string',
        enum: ['all', 'open', 'closed'],
        description: 'Filter lists by status: "open" for active lists, "closed" for archived lists, "all" for both',
        default: 'open'
      }
    },
    required: ['boardId']
  }
};

export async function handleGetLists(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { boardId, filter } = validateGetBoardLists(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getBoardLists(boardId, filter);
    const lists = response.data;
    
    const result = {
      summary: `Found ${lists.length} ${filter} list(s) in board`,
      boardId,
      lists: lists.map(list => ({
        id: list.id,
        name: list.name,
        position: list.pos,
        closed: list.closed,
        subscribed: list.subscribed
      })),
      rateLimit: response.rateLimit
    };
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof z.ZodError 
      ? formatValidationError(error)
      : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting lists: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
