import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import { formatValidationError, extractCredentials } from '../utils/validation.js';

const validateGetUserBoards = (args: unknown) => {
  const schema = z.object({
    filter: z.enum(['all', 'open', 'closed']).optional()
  });
  
  return schema.parse(args);
};

const validateGetMember = (args: unknown) => {
  const schema = z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    fields: z.array(z.string()).optional(),
    boards: z.string().optional(),
    organizations: z.string().optional()
  });
  
  return schema.parse(args);
};

export const trelloGetUserBoardsTool: Tool = {
  name: 'trello_get_user_boards',
  description: 'Get all boards accessible to the current user. This is the starting point for exploring your Trello workspace.',
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

export async function handleTrelloGetUserBoards(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { filter } = validateGetUserBoards(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getCurrentUser();
    const user = response.data;
    
    const result = {
      summary: `User: ${user.fullName || user.username}`,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        bio: user.bio,
        url: user.url,
        memberType: user.memberType,
        confirmed: user.confirmed
      },
      boards: user.boards?.filter((board: any) => {
        if (filter === 'all') return true;
        if (filter === 'closed') return board.closed;
        return !board.closed; // 'open' or default
      }).map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc || 'No description',
        url: board.shortUrl,
        closed: board.closed,
        lastActivity: board.dateLastActivity,
        permissions: board.prefs?.permissionLevel || 'unknown'
      })) || [],
      organizations: user.organizations?.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName,
        description: org.desc
      })) || [],
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
          text: `Error getting user boards: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

export const trelloGetMemberTool: Tool = {
  name: 'trello_get_member',
  description: 'Get details about a specific Trello member/user, including their boards and profile information.',
  inputSchema: {
    type: 'object',
    properties: {
      memberId: {
        type: 'string',
        description: 'ID or username of the member to retrieve (use "me" for current user)',
        minLength: 1
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: specific fields to include (e.g., ["fullName", "username", "bio", "url"])'
      },
      boards: {
        type: 'string',
        enum: ['all', 'open', 'closed', 'none'],
        description: 'Include member\'s boards in response',
        default: 'open'
      },
      organizations: {
        type: 'string',
        enum: ['all', 'none'],
        description: 'Include member\'s organizations in response',
        default: 'all'
      }
    },
    required: ['memberId']
  }
};

export async function handleTrelloGetMember(args: unknown) {
  try {
    const { credentials, params } = extractCredentials(args);
    const { memberId, fields, boards, organizations } = validateGetMember(params);
    const client = new TrelloClient(credentials);
    
    const response = await client.getMember(memberId, {
      ...(fields && { fields }),
      ...(boards && { boards }),
      ...(organizations && { organizations })
    });
    const member = response.data;
    
    const result = {
      summary: `Member: ${member.fullName || member.username}`,
      member: {
        id: member.id,
        fullName: member.fullName,
        username: member.username,
        bio: member.bio,
        url: member.url,
        memberType: member.memberType,
        confirmed: member.confirmed,
        avatarUrl: member.avatarUrl,
        initials: member.initials
      },
      boards: member.boards?.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc || 'No description',
        url: board.shortUrl,
        closed: board.closed,
        lastActivity: board.dateLastActivity
      })) || [],
      organizations: member.organizations?.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName,
        description: org.desc
      })) || [],
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
          text: `Error getting member: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
