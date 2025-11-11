import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import { formatValidationError, extractCredentials } from '../utils/validation.js';

const validateGetListCards = (args: unknown) => {
  const schema = z.object({
    listId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid list ID format'),
    filter: z.enum(['all', 'open', 'closed']).optional(),
    fields: z.array(z.string()).optional()
  });
  
  return schema.parse(args);
};

const validateCreateList = (args: unknown) => {
  const schema = z.object({
    name: z.string().min(1, 'List name is required'),
    idBoard: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid board ID format'),
    pos: z.union([z.number().min(0), z.enum(['top', 'bottom'])]).optional()
  });
  
  return schema.parse(args);
};

const validateAddComment = (args: unknown) => {
  const schema = z.object({
    cardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid card ID format'),
    text: z.string().min(1, 'Comment text is required')
  });
  
  return schema.parse(args);
};

export const trelloGetListCardsTool: Tool = {
  name: 'trello_get_list_cards',
  description: 'Get all cards in a specific Trello list. Use this to see all tasks/items in a workflow column.',
  inputSchema: {
    type: 'object',
    properties: {
      listId: {
        type: 'string',
        description: 'ID of the list to get cards from (you can get this from get_lists)',
        pattern: '^[a-f0-9]{24}$'
      },
      filter: {
        type: 'string',
        enum: ['all', 'open', 'closed'],
        description: 'Filter cards by status: "open" for active cards, "closed" for archived cards, "all" for both',
        default: 'open'
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: specific fields to include (e.g., ["name", "desc", "due", "labels", "members"])'
      }
    },
    required: ['listId']
  }
};

export async function handleTrelloGetListCards(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { listId, filter, fields } = validateGetListCards(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getListCards(listId, { 
      ...(filter && { filter }),
      ...(fields && { fields })
    });
    const cards = response.data;
    
    const result = {
      summary: `Found ${cards.length} ${filter || 'open'} card(s) in list`,
      listId,
      cards: cards.map(card => ({
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
          text: `Error getting list cards: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloCreateListTool: Tool = {
  name: 'trello_create_list',
  description: 'Create a new list in a Trello board. Use this to add workflow columns like "To Do", "In Progress", or "Done".',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the new list (e.g., "To Do", "In Progress", "Done")',
        minLength: 1
      },
      idBoard: {
        type: 'string',
        description: 'ID of the board where the list will be created (you can get this from list_boards)',
        pattern: '^[a-f0-9]{24}$'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'Position of the list in the board: "top", "bottom", or specific number',
        default: 'bottom'
      }
    },
    required: ['name', 'idBoard']
  }
};

export async function handleTrelloCreateList(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const createData = validateCreateList(params);
    const client = new TrelloClient(credentials);
    const response = await client.createList({
      name: createData.name,
      idBoard: createData.idBoard,
      ...(createData.pos !== undefined && { pos: createData.pos })
    });
    const list = response.data;
    
    const result = {
      summary: `Created list: ${list.name}`,
      list: {
        id: list.id,
        name: list.name,
        boardId: list.idBoard,
        position: list.pos,
        closed: list.closed,
        subscribed: list.subscribed
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
          text: `Error creating list: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloAddCommentTool: Tool = {
  name: 'trello_add_comment',
  description: 'Add a comment to a Trello card. Use this to add notes, updates, or discussions to cards.',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to add comment to (you can get this from board details or searches)',
        pattern: '^[a-f0-9]{24}$'
      },
      text: {
        type: 'string',
        description: 'Text content of the comment',
        minLength: 1
      }
    },
    required: ['cardId', 'text']
  }
};

export async function handleTrelloAddComment(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, text } = validateAddComment(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.addCommentToCard(cardId, text);
    const comment = response.data;
    
    const result = {
      summary: `Added comment to card ${cardId}`,
      comment: {
        id: comment.id,
        type: comment.type,
        date: comment.date,
        memberCreator: comment.memberCreator ? {
          id: comment.memberCreator.id,
          fullName: comment.memberCreator.fullName,
          username: comment.memberCreator.username
        } : null,
        data: {
          text: comment.data?.text,
          card: comment.data?.card ? {
            id: comment.data.card.id,
            name: comment.data.card.name
          } : null
        }
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
          text: `Error adding comment: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
