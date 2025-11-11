import {
  credentialsSchema,
  validateCredentials,
  formatValidationError,
  listBoardsSchema,
  validateListBoards,
  getBoardSchema,
  validateGetBoard,
  getBoardListsSchema,
  validateGetBoardLists,
  createCardSchema,
  validateCreateCard,
  updateCardSchema,
  validateUpdateCard,
  moveCardSchema,
  validateMoveCard,
  getCardSchema,
  validateGetCard,
  deleteCardSchema,
  validateDeleteCard,
} from '../../src/utils/validation';
import { ZodError } from 'zod';

describe('validation utilities', () => {

  describe('credentialsSchema and validateCredentials', () => {
    it('should validate correct credentials', () => {
      const validCredentials = { apiKey: 'someApiKey', token: 'someToken' };
      expect(() => credentialsSchema.parse(validCredentials)).not.toThrow();
      expect(validateCredentials(validCredentials)).toEqual(validCredentials);
    });

    it('should reject credentials with missing apiKey', () => {
      const invalidCredentials = { token: 'someToken' };
      expect(() => credentialsSchema.parse(invalidCredentials)).toThrow(ZodError);
      expect(() => validateCredentials(invalidCredentials)).toThrow(ZodError);
    });

    it('should reject credentials with missing token', () => {
      const invalidCredentials = { apiKey: 'someApiKey' };
      expect(() => credentialsSchema.parse(invalidCredentials)).toThrow(ZodError);
      expect(() => validateCredentials(invalidCredentials)).toThrow(ZodError);
    });
  });

  describe('listBoardsSchema and validateListBoards', () => {
    it('should validate correct list boards parameters', () => {
      const validParams = { filter: 'all' };
      expect(() => listBoardsSchema.parse(validParams)).not.toThrow();
      expect(validateListBoards(validParams)).toEqual(validParams);
    });

    it('should validate list boards parameters with default filter', () => {
      const validParams = {};
      expect(() => listBoardsSchema.parse(validParams)).not.toThrow();
      expect(validateListBoards(validParams)).toEqual({ filter: 'open' });
    });

    it('should reject list boards parameters with invalid filter', () => {
      const invalidParams = { filter: 'invalid' };
      expect(() => listBoardsSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateListBoards(invalidParams)).toThrow(ZodError);
    });
  });

  describe('getBoardSchema and validateGetBoard', () => {
    it('should validate correct get board parameters', () => {
      const validParams = { boardId: '6512e4a208a3061f8a9e5a6a', includeDetails: true };
      expect(() => getBoardSchema.parse(validParams)).not.toThrow();
      expect(validateGetBoard(validParams)).toEqual(validParams);
    });

    it('should validate get board parameters with default includeDetails', () => {
      const validParams = { boardId: '6512e4a208a3061f8a9e5a6a' };
      expect(() => getBoardSchema.parse(validParams)).not.toThrow();
      expect(validateGetBoard(validParams)).toEqual({ ...validParams, includeDetails: false });
    });

    it('should reject get board parameters with invalid boardId', () => {
      const invalidParams = { boardId: 'invalid' };
      expect(() => getBoardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateGetBoard(invalidParams)).toThrow(ZodError);
    });
  });

  describe('getBoardListsSchema and validateGetBoardLists', () => {
    it('should validate correct get board lists parameters', () => {
      const validParams = { boardId: '6512e4a208a3061f8a9e5a6a', filter: 'closed' };
      expect(() => getBoardListsSchema.parse(validParams)).not.toThrow();
      expect(validateGetBoardLists(validParams)).toEqual(validParams);
    });

    it('should validate get board lists parameters with default filter', () => {
      const validParams = { boardId: '6512e4a208a3061f8a9e5a6a' };
      expect(() => getBoardListsSchema.parse(validParams)).not.toThrow();
      expect(validateGetBoardLists(validParams)).toEqual({ ...validParams, filter: 'open' });
    });

    it('should reject get board lists parameters with invalid boardId', () => {
      const invalidParams = { boardId: 'invalid' };
      expect(() => getBoardListsSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateGetBoardLists(invalidParams)).toThrow(ZodError);
    });
  });

  describe('createCardSchema and validateCreateCard', () => {
    it('should validate correct create card parameters', () => {
      const validParams = { name: 'New Card', idList: '6512e4a208a3061f8a9e5a6a' };
      expect(() => createCardSchema.parse(validParams)).not.toThrow();
      expect(validateCreateCard(validParams)).toEqual(validParams);
    });

    it('should reject create card parameters with missing name', () => {
      const invalidParams = { idList: '6512e4a208a3061f8a9e5a6a' };
      expect(() => createCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateCreateCard(invalidParams)).toThrow(ZodError);
    });

    it('should reject create card parameters with invalid idList', () => {
      const invalidParams = { name: 'New Card', idList: 'invalid' };
      expect(() => createCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateCreateCard(invalidParams)).toThrow(ZodError);
    });

    it('should validate create card parameters with optional fields', () => {
      const validParams = {
        name: 'New Card',
        desc: 'Description',
        idList: '6512e4a208a3061f8a9e5a6a',
        pos: 'top',
        due: '2025-01-01T10:00:00Z',
        idMembers: ['6512e4a208a3061f8a9e5a6b'],
        idLabels: ['6512e4a208a3061f8a9e5a6c'],
      };
      expect(() => createCardSchema.parse(validParams)).not.toThrow();
      expect(validateCreateCard(validParams)).toEqual(validParams);
    });
  });

  describe('updateCardSchema and validateUpdateCard', () => {
    it('should validate correct update card parameters', () => {
      const validParams = { cardId: '6512e4a208a3061f8a9e5a6a', name: 'Updated Card' };
      expect(() => updateCardSchema.parse(validParams)).not.toThrow();
      expect(validateUpdateCard(validParams)).toEqual(validParams);
    });

    it('should reject update card parameters with invalid cardId', () => {
      const invalidParams = { cardId: 'invalid' };
      expect(() => updateCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateUpdateCard(invalidParams)).toThrow(ZodError);
    });

    it('should validate update card parameters with optional fields', () => {
      const validParams = {
        cardId: '6512e4a208a3061f8a9e5a6a',
        desc: 'Updated Description',
        closed: true,
        due: '2025-01-02T10:00:00Z',
        dueComplete: true,
        idList: '6512e4a208a3061f8a9e5a6b',
        pos: 1,
        idMembers: ['6512e4a208a3061f8a9e5a6c'],
        idLabels: ['6512e4a208a3061f8a9e5a6d'],
      };
      expect(() => updateCardSchema.parse(validParams)).not.toThrow();
      expect(validateUpdateCard(validParams)).toEqual(validParams);
    });
  });

  describe('moveCardSchema and validateMoveCard', () => {
    it('should validate correct move card parameters', () => {
      const validParams = { cardId: '6512e4a208a3061f8a9e5a6a', idList: '6512e4a208a3061f8a9e5a6b' };
      expect(() => moveCardSchema.parse(validParams)).not.toThrow();
      expect(validateMoveCard(validParams)).toEqual(validParams);
    });

    it('should reject move card parameters with invalid cardId', () => {
      const invalidParams = { cardId: 'invalid', idList: '6512e4a208a3061f8a9e5a6b' };
      expect(() => moveCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateMoveCard(invalidParams)).toThrow(ZodError);
    });

    it('should reject move card parameters with invalid idList', () => {
      const invalidParams = { cardId: '6512e4a208a3061f8a9e5a6a', idList: 'invalid' };
      expect(() => moveCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateMoveCard(invalidParams)).toThrow(ZodError);
    });
  });

  describe('getCardSchema and validateGetCard', () => {
    it('should validate correct get card parameters', () => {
      const validParams = { cardId: '6512e4a208a3061f8a9e5a6a', includeDetails: true };
      expect(() => getCardSchema.parse(validParams)).not.toThrow();
      expect(validateGetCard(validParams)).toEqual(validParams);
    });

    it('should validate get card parameters with default includeDetails', () => {
      const validParams = { cardId: '6512e4a208a3061f8a9e5a6a' };
      expect(() => getCardSchema.parse(validParams)).not.toThrow();
      expect(validateGetCard(validParams)).toEqual({ ...validParams, includeDetails: false });
    });

    it('should reject get card parameters with invalid cardId', () => {
      const invalidParams = { cardId: 'invalid' };
      expect(() => getCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateGetCard(invalidParams)).toThrow(ZodError);
    });
  });

  describe('deleteCardSchema and validateDeleteCard', () => {
    it('should validate correct delete card parameters', () => {
      const validParams = { cardId: '6512e4a208a3061f8a9e5a6a' };
      expect(() => deleteCardSchema.parse(validParams)).not.toThrow();
      expect(validateDeleteCard(validParams)).toEqual(validParams);
    });

    it('should reject delete card parameters with invalid cardId', () => {
      const invalidParams = { cardId: 'invalid' };
      expect(() => deleteCardSchema.parse(invalidParams)).toThrow(ZodError);
      expect(() => validateDeleteCard(invalidParams)).toThrow(ZodError);
    });
  });

  describe('formatValidationError', () => {
    it('should format a single validation error correctly', () => {
      const error = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['apiKey'],
          message: 'API key is required',
        },
      ]);
      expect(formatValidationError(error)).toBe('Validation error: apiKey: API key is required');
    });

    it('should format multiple validation errors correctly', () => {
      const error = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['apiKey'],
          message: 'API key is required',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['token'],
          message: 'Token is required',
        },
      ]);
      expect(formatValidationError(error)).toBe('Validation error: apiKey: API key is required, token: Token is required');
    });

    it('should format validation error without path correctly', () => {
      const error = new ZodError([
        {
          code: 'invalid_enum_value',
          options: ['all', 'open', 'closed'],
          received: 'invalid',
          path: [],
          message: "Invalid enum value. Expected 'all' | 'open' | 'closed', received 'invalid'",
        },
      ]);
      expect(formatValidationError(error)).toBe("Validation error: Invalid enum value. Expected 'all' | 'open' | 'closed', received 'invalid'");
    });
  });
});
