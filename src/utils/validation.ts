import { z } from 'zod';

const trelloIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Must be a valid 24-character Trello ID');
const trelloIdOptionalSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Must be a valid 24-character Trello ID').optional();

export const credentialsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required')
});

export const listBoardsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  filter: z.enum(['all', 'open', 'closed']).optional().default('open')
});

export const getBoardSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  boardId: trelloIdSchema,
  includeDetails: z.boolean().optional().default(false)
});

export const getBoardListsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  boardId: trelloIdSchema,
  filter: z.enum(['all', 'open', 'closed']).optional().default('open')
});

export const createCardSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  name: z.string().min(1, 'Card name is required').max(16384, 'Card name too long'),
  desc: z.string().max(16384, 'Description too long').optional(),
  idList: trelloIdSchema,
  pos: z.union([z.number().min(0), z.enum(['top', 'bottom'])]).optional(),
  due: z.string().datetime().optional(),
  idMembers: z.array(trelloIdSchema).optional(),
  idLabels: z.array(trelloIdSchema).optional()
});

export const updateCardSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  cardId: trelloIdSchema,
  name: z.string().min(1).max(16384).optional(),
  desc: z.string().max(16384).optional(),
  closed: z.boolean().optional(),
  due: z.string().datetime().nullable().optional(),
  dueComplete: z.boolean().optional(),
  idList: trelloIdOptionalSchema,
  pos: z.union([z.number().min(0), z.enum(['top', 'bottom'])]).optional(),
  idMembers: z.array(trelloIdSchema).optional(),
  idLabels: z.array(trelloIdSchema).optional()
});

export const moveCardSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  cardId: trelloIdSchema,
  idList: trelloIdSchema,
  pos: z.union([z.number().min(0), z.enum(['top', 'bottom'])]).optional()
});

export const getCardSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  cardId: trelloIdSchema,
  includeDetails: z.boolean().optional().default(false)
});

export const deleteCardSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  token: z.string().min(1, 'Token is required'),
  cardId: trelloIdSchema
});

export function validateCredentials(data: unknown) {
  return credentialsSchema.parse(data);
}

export function validateListBoards(data: unknown) {
  return listBoardsSchema.parse(data);
}

export function validateGetBoard(data: unknown) {
  return getBoardSchema.parse(data);
}

export function validateGetBoardLists(data: unknown) {
  return getBoardListsSchema.parse(data);
}

export function validateCreateCard(data: unknown) {
  return createCardSchema.parse(data);
}

export function validateUpdateCard(data: unknown) {
  return updateCardSchema.parse(data);
}

export function validateMoveCard(data: unknown) {
  return moveCardSchema.parse(data);
}

export function validateGetCard(data: unknown) {
  return getCardSchema.parse(data);
}

export function validateDeleteCard(data: unknown) {
  return deleteCardSchema.parse(data);
}

export function formatValidationError(error: z.ZodError): string {
  const issues = error.issues.map(issue => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
  return `Validation error: ${issues.join(', ')}`;
}