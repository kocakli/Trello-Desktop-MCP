import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import { 
  validateCreateCard, 
  validateUpdateCard, 
  validateMoveCard, 
  validateGetCard,
  formatValidationError,
  extractCredentials
} from '../utils/validation.js';

export const createCardTool: Tool = {
  name: 'create_card',
  description: 'Create a new card in a Trello list. Use this to add tasks, ideas, or items to your workflow.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name/title of the card (what the task or item is about)'
      },
      desc: {
        type: 'string',
        description: 'Optional detailed description of the card'
      },
      idList: {
        type: 'string',
        description: 'ID of the list where the card will be created (you can get this from get_lists)',
        pattern: '^[a-f0-9]{24}$'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'Position in the list: "top", "bottom", or specific number'
      },
      due: {
        type: 'string',
        format: 'date-time',
        description: 'Optional due date for the card (ISO 8601 format, e.g., "2024-12-31T23:59:59Z")'
      },
      idMembers: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[a-f0-9]{24}$'
        },
        description: 'Optional array of member IDs to assign to the card'
      },
      idLabels: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[a-f0-9]{24}$'
        },
        description: 'Optional array of label IDs to categorize the card'
      }
    },
    required: ['name', 'idList']
  }
};

export async function handleCreateCard(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const cardData = validateCreateCard(params);
    const client = new TrelloClient(credentials);
    const response = await client.createCard(cardData);
    const card = response.data;
    
    const result = {
      summary: `Created card: ${card.name}`,
      card: {
        id: card.id,
        name: card.name,
        description: card.desc || 'No description',
        url: card.shortUrl,
        listId: card.idList,
        boardId: card.idBoard,
        position: card.pos,
        due: card.due,
        closed: card.closed,
        labels: card.labels?.map(label => ({
          id: label.id,
          name: label.name,
          color: label.color
        })) || [],
        members: card.members?.map(member => ({
          id: member.id,
          fullName: member.fullName,
          username: member.username
        })) || []
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
          text: `Error creating card: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const updateCardTool: Tool = {
  name: 'update_card',
  description: 'Update properties of an existing Trello card. Use this to change card details like name, description, due date, or status.',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to update (you can get this from board details or card searches)',
        pattern: '^[a-f0-9]{24}$'
      },
      name: {
        type: 'string',
        description: 'New name/title for the card'
      },
      desc: {
        type: 'string',
        description: 'New description for the card'
      },
      closed: {
        type: 'boolean',
        description: 'Set to true to archive the card, false to unarchive'
      },
      due: {
        type: ['string', 'null'],
        format: 'date-time',
        description: 'Set due date (ISO 8601 format) or null to remove due date'
      },
      dueComplete: {
        type: 'boolean',
        description: 'Mark the due date as complete (true) or incomplete (false)'
      },
      idList: {
        type: 'string',
        description: 'Move card to a different list by providing the list ID',
        pattern: '^[a-f0-9]{24}$'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'Change position in the list: "top", "bottom", or specific number'
      }
    },
    required: ['cardId']
  }
};

export async function handleUpdateCard(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, ...updates } = validateUpdateCard(params);
    const client = new TrelloClient(credentials);
    const response = await client.updateCard(cardId, updates);
    const card = response.data;
    
    const result = {
      summary: `Updated card: ${card.name}`,
      card: {
        id: card.id,
        name: card.name,
        description: card.desc || 'No description',
        url: card.shortUrl,
        listId: card.idList,
        boardId: card.idBoard,
        position: card.pos,
        due: card.due,
        dueComplete: card.dueComplete,
        closed: card.closed,
        labels: card.labels?.map(label => ({
          id: label.id,
          name: label.name,
          color: label.color
        })) || []
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
          text: `Error updating card: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const moveCardTool: Tool = {
  name: 'move_card',
  description: 'Move a card to a different list. Use this to change a card\'s workflow status (e.g., from "To Do" to "In Progress").',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to move (you can get this from board details or card searches)',
        pattern: '^[a-f0-9]{24}$'
      },
      idList: {
        type: 'string',
        description: 'ID of the destination list (you can get this from get_lists)',
        pattern: '^[a-f0-9]{24}$'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'Position in the destination list: "top", "bottom", or specific number'
      }
    },
    required: ['cardId', 'idList']
  }
};

export async function handleMoveCard(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, ...moveParams } = validateMoveCard(params);
    const client = new TrelloClient(credentials);
    const response = await client.moveCard(cardId, moveParams);
    const card = response.data;
    
    const result = {
      summary: `Moved card "${card.name}" to list ${card.idList}`,
      card: {
        id: card.id,
        name: card.name,
        url: card.shortUrl,
        listId: card.idList,
        boardId: card.idBoard,
        position: card.pos
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
          text: `Error moving card: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const getCardTool: Tool = {
  name: 'get_card',
  description: 'Get detailed information about a specific Trello card, including its content, status, members, and attachments.',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to retrieve (you can get this from board details or searches)',
        pattern: '^[a-f0-9]{24}$'
      },
      includeDetails: {
        type: 'boolean',
        description: 'Include additional details like members, labels, checklists, and activity badges',
        default: false
      }
    },
    required: ['cardId']
  }
};

export async function handleGetCard(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, includeDetails } = validateGetCard(params);
    const client = new TrelloClient(credentials);
    const response = await client.getCard(cardId, includeDetails);
    const card = response.data;
    
    const result = {
      summary: `Card: ${card.name}`,
      card: {
        id: card.id,
        name: card.name,
        description: card.desc || 'No description',
        url: card.shortUrl,
        listId: card.idList,
        boardId: card.idBoard,
        position: card.pos,
        due: card.due,
        dueComplete: card.dueComplete,
        closed: card.closed,
        lastActivity: card.dateLastActivity,
        ...(includeDetails && {
          labels: card.labels?.map(label => ({
            id: label.id,
            name: label.name,
            color: label.color
          })) || [],
          members: card.members?.map(member => ({
            id: member.id,
            fullName: member.fullName,
            username: member.username,
            initials: member.initials
          })) || [],
          checklists: card.checklists?.map(checklist => ({
            id: checklist.id,
            name: checklist.name,
            checkItems: checklist.checkItems?.map(item => ({
              id: item.id,
              name: item.name,
              state: item.state,
              due: item.due
            })) || []
          })) || [],
          badges: card.badges ? {
            votes: card.badges.votes,
            comments: card.badges.comments,
            attachments: card.badges.attachments,
            checkItems: card.badges.checkItems,
            checkItemsChecked: card.badges.checkItemsChecked,
            description: card.badges.description
          } : undefined
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
          text: `Error getting card: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
