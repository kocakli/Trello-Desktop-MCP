import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import { formatValidationError, extractCredentials } from '../utils/validation.js';

const validateSearch = (args: unknown) => {
  const schema = z.object({
    query: z.string().min(1, 'Search query is required'),
    modelTypes: z.array(z.enum(['boards', 'cards', 'members', 'organizations'])).optional(),
    boardIds: z.array(z.string().regex(/^[a-f0-9]{24}$/, 'Invalid board ID format')).optional(),
    boardsLimit: z.number().min(1).max(1000).optional(),
    cardsLimit: z.number().min(1).max(1000).optional(),
    membersLimit: z.number().min(1).max(1000).optional()
  });
  
  return schema.parse(args);
};

export const trelloSearchTool: Tool = {
  name: 'trello_search',
  description: 'Universal search across all Trello content (boards, cards, members). Use this to find specific items by keywords or phrases.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term or phrase to find in Trello content',
        minLength: 1
      },
      modelTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['boards', 'cards', 'members', 'organizations']
        },
        description: 'Types of content to search in. Defaults to all types if not specified',
        default: ['boards', 'cards', 'members']
      },
      boardIds: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[a-f0-9]{24}$'
        },
        description: 'Optional: limit search to specific boards by their IDs'
      },
      boardsLimit: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        description: 'Maximum number of boards to return in results',
        default: 10
      },
      cardsLimit: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        description: 'Maximum number of cards to return in results',
        default: 50
      },
      membersLimit: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        description: 'Maximum number of members to return in results',
        default: 20
      }
    },
    required: ['query']
  }
};

export async function handleTrelloSearch(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { query, modelTypes, boardIds, boardsLimit, cardsLimit, membersLimit } = validateSearch(params);
    const client = new TrelloClient(credentials);
    
    const searchOptions = {
      ...(modelTypes && { modelTypes }),
      ...(boardIds && { boardIds }),
      ...(boardsLimit !== undefined && { boardsLimit }),
      ...(cardsLimit !== undefined && { cardsLimit }),
      ...(membersLimit !== undefined && { membersLimit })
    };
    
    const response = await client.search(query, Object.keys(searchOptions).length > 0 ? searchOptions : undefined);
    const searchResults = response.data;
    
    const result = {
      summary: `Search results for: "${query}"`,
      query,
      boards: searchResults.boards?.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc || 'No description',
        url: board.shortUrl,
        closed: board.closed,
        lastActivity: board.dateLastActivity
      })) || [],
      cards: searchResults.cards?.map((card: any) => ({
        id: card.id,
        name: card.name,
        description: card.desc || 'No description',
        url: card.shortUrl,
        listId: card.idList,
        boardId: card.idBoard,
        due: card.due,
        closed: card.closed,
        labels: card.labels?.map((label: any) => ({
          id: label.id,
          name: label.name,
          color: label.color
        })) || []
      })) || [],
      members: searchResults.members?.map((member: any) => ({
        id: member.id,
        fullName: member.fullName,
        username: member.username,
        bio: member.bio,
        url: member.url
      })) || [],
      organizations: searchResults.organizations?.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName,
        description: org.desc,
        url: org.url
      })) || [],
      totalResults: {
        boards: searchResults.boards?.length || 0,
        cards: searchResults.cards?.length || 0,
        members: searchResults.members?.length || 0,
        organizations: searchResults.organizations?.length || 0
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
          text: `Error searching Trello: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
