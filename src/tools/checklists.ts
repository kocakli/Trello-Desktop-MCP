import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello/client.js';
import {
  validateCreateChecklist,
  validateAddChecklistItem,
  validateUpdateChecklistItem,
  validateDeleteChecklistItem,
  validateDeleteChecklist,
  validateUpdateChecklist,
  formatValidationError
} from '../utils/validation.js';

// Create Checklist Tool
export const createChecklistTool: Tool = {
  name: 'trello_create_checklist',
  description: 'Create a new checklist on a Trello card. Use this to add a list of tasks or items that can be checked off.',
  inputSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'Trello API key (automatically provided by Claude.app from your stored credentials)'
      },
      token: {
        type: 'string',
        description: 'Trello API token (automatically provided by Claude.app from your stored credentials)'
      },
      cardId: {
        type: 'string',
        description: 'ID of the card to add the checklist to',
        pattern: '^[a-f0-9]{24}$'
      },
      name: {
        type: 'string',
        description: 'Name of the checklist (e.g., "Action Items", "Requirements")'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'Position of the checklist: "top", "bottom", or specific number'
      }
    },
    required: ['apiKey', 'token', 'cardId', 'name']
  }
};

export async function handleCreateChecklist(args: unknown) {
  try {
    const { apiKey, token, cardId, name, pos } = validateCreateChecklist(args);

    const client = new TrelloClient({ apiKey, token });
    const response = await client.createChecklist(cardId, name, pos);
    const checklist = response.data;

    const result = {
      summary: `Created checklist: ${checklist.name}`,
      checklist: {
        id: checklist.id,
        name: checklist.name,
        cardId: checklist.idCard,
        boardId: checklist.idBoard,
        position: checklist.pos
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
          text: `Error creating checklist: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Add Checklist Item Tool
export const addChecklistItemTool: Tool = {
  name: 'trello_add_checklist_item',
  description: 'Add an item to an existing checklist. Use this to add tasks or steps that can be checked off.',
  inputSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'Trello API key (automatically provided by Claude.app from your stored credentials)'
      },
      token: {
        type: 'string',
        description: 'Trello API token (automatically provided by Claude.app from your stored credentials)'
      },
      checklistId: {
        type: 'string',
        description: 'ID of the checklist to add the item to',
        pattern: '^[a-f0-9]{24}$'
      },
      name: {
        type: 'string',
        description: 'Name/text of the checklist item'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'Position in the checklist: "top", "bottom", or specific number'
      },
      checked: {
        type: 'boolean',
        description: 'Whether the item should be checked (completed) by default'
      },
      due: {
        type: 'string',
        format: 'date-time',
        description: 'Optional due date for the checklist item (ISO 8601 format)'
      }
    },
    required: ['apiKey', 'token', 'checklistId', 'name']
  }
};

export async function handleAddChecklistItem(args: unknown) {
  try {
    const { apiKey, token, checklistId, name, pos, checked, due } = validateAddChecklistItem(args);

    const client = new TrelloClient({ apiKey, token });
    const response = await client.addChecklistItem(checklistId, name, { pos, checked, due });
    const item = response.data;

    const result = {
      summary: `Added checklist item: ${item.name}`,
      item: {
        id: item.id,
        name: item.name,
        checklistId: item.idChecklist,
        state: item.state,
        position: item.pos,
        due: item.due
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
          text: `Error adding checklist item: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Update Checklist Item Tool
export const updateChecklistItemTool: Tool = {
  name: 'trello_update_checklist_item',
  description: 'Update a checklist item. Use this to mark items as complete/incomplete, rename them, or change their due date.',
  inputSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'Trello API key (automatically provided by Claude.app from your stored credentials)'
      },
      token: {
        type: 'string',
        description: 'Trello API token (automatically provided by Claude.app from your stored credentials)'
      },
      cardId: {
        type: 'string',
        description: 'ID of the card containing the checklist item',
        pattern: '^[a-f0-9]{24}$'
      },
      checkItemId: {
        type: 'string',
        description: 'ID of the checklist item to update',
        pattern: '^[a-f0-9]{24}$'
      },
      name: {
        type: 'string',
        description: 'New name/text for the checklist item'
      },
      state: {
        type: 'string',
        enum: ['complete', 'incomplete'],
        description: 'Set the item as complete or incomplete'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'New position in the checklist'
      },
      due: {
        type: ['string', 'null'],
        format: 'date-time',
        description: 'Set due date (ISO 8601) or null to remove it'
      }
    },
    required: ['apiKey', 'token', 'cardId', 'checkItemId']
  }
};

export async function handleUpdateChecklistItem(args: unknown) {
  try {
    const { apiKey, token, cardId, checkItemId, ...updates } = validateUpdateChecklistItem(args);

    const client = new TrelloClient({ apiKey, token });
    const response = await client.updateChecklistItem(cardId, checkItemId, updates);
    const item = response.data;

    const result = {
      summary: `Updated checklist item: ${item.name}`,
      item: {
        id: item.id,
        name: item.name,
        state: item.state,
        position: item.pos,
        due: item.due
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
          text: `Error updating checklist item: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Delete Checklist Item Tool
export const deleteChecklistItemTool: Tool = {
  name: 'trello_delete_checklist_item',
  description: 'Delete an item from a checklist.',
  inputSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'Trello API key (automatically provided by Claude.app from your stored credentials)'
      },
      token: {
        type: 'string',
        description: 'Trello API token (automatically provided by Claude.app from your stored credentials)'
      },
      checklistId: {
        type: 'string',
        description: 'ID of the checklist containing the item',
        pattern: '^[a-f0-9]{24}$'
      },
      checkItemId: {
        type: 'string',
        description: 'ID of the checklist item to delete',
        pattern: '^[a-f0-9]{24}$'
      }
    },
    required: ['apiKey', 'token', 'checklistId', 'checkItemId']
  }
};

export async function handleDeleteChecklistItem(args: unknown) {
  try {
    const { apiKey, token, checklistId, checkItemId } = validateDeleteChecklistItem(args);

    const client = new TrelloClient({ apiKey, token });
    await client.deleteChecklistItem(checklistId, checkItemId);

    const result = {
      summary: `Deleted checklist item ${checkItemId}`,
      deleted: true
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
          text: `Error deleting checklist item: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Delete Checklist Tool
export const deleteChecklistTool: Tool = {
  name: 'trello_delete_checklist',
  description: 'Delete an entire checklist from a card.',
  inputSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'Trello API key (automatically provided by Claude.app from your stored credentials)'
      },
      token: {
        type: 'string',
        description: 'Trello API token (automatically provided by Claude.app from your stored credentials)'
      },
      checklistId: {
        type: 'string',
        description: 'ID of the checklist to delete',
        pattern: '^[a-f0-9]{24}$'
      }
    },
    required: ['apiKey', 'token', 'checklistId']
  }
};

export async function handleDeleteChecklist(args: unknown) {
  try {
    const { apiKey, token, checklistId } = validateDeleteChecklist(args);

    const client = new TrelloClient({ apiKey, token });
    await client.deleteChecklist(checklistId);

    const result = {
      summary: `Deleted checklist ${checklistId}`,
      deleted: true
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
          text: `Error deleting checklist: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Update Checklist Tool
export const updateChecklistTool: Tool = {
  name: 'trello_update_checklist',
  description: 'Update a checklist name or position.',
  inputSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'Trello API key (automatically provided by Claude.app from your stored credentials)'
      },
      token: {
        type: 'string',
        description: 'Trello API token (automatically provided by Claude.app from your stored credentials)'
      },
      checklistId: {
        type: 'string',
        description: 'ID of the checklist to update',
        pattern: '^[a-f0-9]{24}$'
      },
      name: {
        type: 'string',
        description: 'New name for the checklist'
      },
      pos: {
        oneOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', enum: ['top', 'bottom'] }
        ],
        description: 'New position for the checklist'
      }
    },
    required: ['apiKey', 'token', 'checklistId']
  }
};

export async function handleUpdateChecklist(args: unknown) {
  try {
    const { apiKey, token, checklistId, ...updates } = validateUpdateChecklist(args);

    const client = new TrelloClient({ apiKey, token });
    const response = await client.updateChecklist(checklistId, updates);
    const checklist = response.data;

    const result = {
      summary: `Updated checklist: ${checklist.name}`,
      checklist: {
        id: checklist.id,
        name: checklist.name,
        position: checklist.pos
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
          text: `Error updating checklist: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}
