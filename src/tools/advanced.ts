import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import { formatValidationError, extractCredentials } from '../utils/validation.js';

const validateGetBoardCards = (args: unknown) => {
  const schema = z.object({
    boardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid board ID format'),
    attachments: z.string().optional(),
    members: z.string().optional(),
    filter: z.string().optional()
  });
  
  return schema.parse(args);
};

const validateGetCardActions = (args: unknown) => {
  const schema = z.object({
    cardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid card ID format'),
    filter: z.string().optional(),
    limit: z.number().min(1).max(1000).optional()
  });
  
  return schema.parse(args);
};

const validateGetCardAttachments = (args: unknown) => {
  const schema = z.object({
    cardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid card ID format'),
    fields: z.array(z.string()).optional()
  });
  
  return schema.parse(args);
};

const validateGetCardChecklists = (args: unknown) => {
  const schema = z.object({
    cardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid card ID format'),
    checkItems: z.string().optional(),
    fields: z.array(z.string()).optional()
  });
  
  return schema.parse(args);
};

const validateGetBoardMembers = (args: unknown) => {
  const schema = z.object({
    boardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid board ID format')
  });
  
  return schema.parse(args);
};

const validateGetBoardLabels = (args: unknown) => {
  const schema = z.object({
    boardId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid board ID format')
  });
  
  return schema.parse(args);
};

export const trelloGetBoardCardsTool: Tool = {
  name: 'trello_get_board_cards',
  description: 'Get all cards from a Trello board with optional filtering and detailed information like attachments and members.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'ID of the board to get cards from (you can get this from list_boards)',
        pattern: '^[a-f0-9]{24}$'
      },
      attachments: {
        type: 'string',
        enum: ['cover', 'true', 'false'],
        description: 'Include attachment information: "cover" for cover images, "true" for all attachments',
        default: 'false'
      },
      members: {
        type: 'string',
        enum: ['true', 'false'],
        description: 'Include member information for each card',
        default: 'true'
      },
      filter: {
        type: 'string',
        enum: ['all', 'open', 'closed'],
        description: 'Filter cards by status',
        default: 'open'
      }
    },
    required: ['boardId']
  }
};

export async function handleTrelloGetBoardCards(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { boardId, attachments, members, filter } = validateGetBoardCards(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getBoardCards(boardId, {
      ...(attachments && { attachments }),
      ...(members && { members }),
      ...(filter && { filter })
    });
    const cards = response.data;
    
    const result = {
      summary: `Found ${cards.length} card(s) in board`,
      boardId,
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        description: card.desc || 'No description',
        url: card.shortUrl,
        listId: card.idList,
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
        })) || [],
        attachments: card.attachments?.map((attachment: any) => ({
          id: attachment.id,
          name: attachment.name,
          url: attachment.url,
          mimeType: attachment.mimeType,
          date: attachment.date
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
          text: `Error getting board cards: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloGetCardActionsTool: Tool = {
  name: 'trello_get_card_actions',
  description: 'Get activity history and comments for a specific Trello card. Useful for tracking changes and discussions.',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to get actions for',
        pattern: '^[a-f0-9]{24}$'
      },
      filter: {
        type: 'string',
        enum: ['all', 'commentCard', 'updateCard', 'createCard'],
        description: 'Filter actions by type: "commentCard" for comments only, "updateCard" for updates',
        default: 'commentCard'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        description: 'Maximum number of actions to return',
        default: 50
      }
    },
    required: ['cardId']
  }
};

export async function handleTrelloGetCardActions(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, filter, limit } = validateGetCardActions(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getCardActions(cardId, {
      ...(filter && { filter }),
      ...(limit !== undefined && { limit })
    });
    const actions = response.data;
    
    const result = {
      summary: `Found ${actions.length} action(s) for card`,
      cardId,
      actions: actions.map(action => ({
        id: action.id,
        type: action.type,
        date: action.date,
        memberCreator: action.memberCreator ? {
          id: action.memberCreator.id,
          fullName: action.memberCreator.fullName,
          username: action.memberCreator.username
        } : null,
        data: {
          text: action.data?.text,
          old: action.data?.old,
          card: action.data?.card ? {
            id: action.data.card.id,
            name: action.data.card.name
          } : null,
          list: action.data?.list ? {
            id: action.data.list.id,
            name: action.data.list.name
          } : null
        }
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
          text: `Error getting card actions: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloGetCardAttachmentsTool: Tool = {
  name: 'trello_get_card_attachments',
  description: 'Get all attachments (files, links) for a specific Trello card.',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to get attachments for',
        pattern: '^[a-f0-9]{24}$'
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: specific fields to include (e.g., ["name", "url", "mimeType", "date"])'
      }
    },
    required: ['cardId']
  }
};

export async function handleTrelloGetCardAttachments(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, fields } = validateGetCardAttachments(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getCardAttachments(cardId, {
      ...(fields && { fields })
    });
    const attachments = response.data;
    
    const result = {
      summary: `Found ${attachments.length} attachment(s) for card`,
      cardId,
      attachments: attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        mimeType: attachment.mimeType,
        date: attachment.date,
        bytes: attachment.bytes,
        isUpload: attachment.isUpload,
        previews: attachment.previews?.map((preview: any) => ({
          id: preview.id,
          width: preview.width,
          height: preview.height,
          url: preview.url
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
          text: `Error getting card attachments: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloGetCardChecklistsTool: Tool = {
  name: 'trello_get_card_checklists',
  description: 'Get all checklists and their items for a specific Trello card.',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card to get checklists for',
        pattern: '^[a-f0-9]{24}$'
      },
      checkItems: {
        type: 'string',
        enum: ['all', 'none'],
        description: 'Include checklist items in response',
        default: 'all'
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: specific fields to include (e.g., ["name", "pos"])'
      }
    },
    required: ['cardId']
  }
};

export async function handleTrelloGetCardChecklists(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { cardId, checkItems, fields } = validateGetCardChecklists(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getCardChecklists(cardId, {
      ...(checkItems && { checkItems }),
      ...(fields && { fields })
    });
    const checklists = response.data;
    
    const result = {
      summary: `Found ${checklists.length} checklist(s) for card`,
      cardId,
      checklists: checklists.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        position: checklist.pos,
        checkItems: checklist.checkItems?.map((item: any) => ({
          id: item.id,
          name: item.name,
          state: item.state,
          position: item.pos,
          due: item.due,
          nameData: item.nameData
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
          text: `Error getting card checklists: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloGetBoardMembersTool: Tool = {
  name: 'trello_get_board_members',
  description: 'Get all members who have access to a specific Trello board.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'ID of the board to get members for',
        pattern: '^[a-f0-9]{24}$'
      }
    },
    required: ['boardId']
  }
};

export async function handleTrelloGetBoardMembers(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { boardId } = validateGetBoardMembers(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getBoardMembers(boardId);
    const members = response.data;
    
    const result = {
      summary: `Found ${members.length} member(s) on board`,
      boardId,
      members: members.map(member => ({
        id: member.id,
        fullName: member.fullName,
        username: member.username,
        memberType: member.memberType,
        confirmed: member.confirmed,
        avatarUrl: member.avatarUrl,
        initials: member.initials
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
          text: `Error getting board members: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloGetBoardLabelsTool: Tool = {
  name: 'trello_get_board_labels',
  description: 'Get all labels available on a specific Trello board for categorizing cards.',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: {
        type: 'string',
        description: 'ID of the board to get labels for',
        pattern: '^[a-f0-9]{24}$'
      }
    },
    required: ['boardId']
  }
};

export async function handleTrelloGetBoardLabels(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { boardId } = validateGetBoardLabels(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getBoardLabels(boardId);
    const labels = response.data;
    
    const result = {
      summary: `Found ${labels.length} label(s) on board`,
      boardId,
      labels: labels.map(label => ({
        id: label.id,
        name: label.name,
        color: label.color,
        uses: label.uses
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
          text: `Error getting board labels: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
