import {
  handleTrelloGetBoardCards,
  handleTrelloGetCardActions,
  handleTrelloGetCardAttachments,
  handleTrelloGetCardChecklists,
  handleTrelloGetBoardMembers,
  handleTrelloGetBoardLabels
} from '../src/tools/advanced.js';
import { jest } from '@jest/globals';

// Mock the TrelloClient module
jest.mock('../src/trello/client.js', () => {
  const actualTrelloClient = jest.requireActual('../src/trello/client.js');

  return {
    ...actualTrelloClient, // Use actual exports for everything else
    TrelloClient: jest.fn().mockImplementation(() => {
      return {
        // Mock all methods of TrelloClient here
        getMyBoards: jest.fn(),
        getBoard: jest.fn(),
        getBoardLists: jest.fn(),
        createCard: jest.fn(),
        updateCard: jest.fn(),
        moveCard: jest.fn(),
        getCard: jest.fn(),
        deleteCard: jest.fn(),
        getBoardMembers: jest.fn(),
        getBoardLabels: jest.fn(),
        search: jest.fn(),
        getListCards: jest.fn(),
        addCommentToCard: jest.fn(),
        createList: jest.fn(),
        getMember: jest.fn(),
        getCurrentUser: jest.fn(),
        getBoardCards: jest.fn(),
        getCardActions: jest.fn(),
        getCardAttachments: jest.fn(),
        getCardChecklists: jest.fn(),
      };
    }),
  };
});

// Import TrelloClient after jest.mock
import { TrelloClient } from '../src/trello/client.js';

describe('Advanced Tools', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTrelloGetBoardCards', () => {
    test('should return board cards on success', async () => {
      const mockCards = [
        { id: 'card1', name: 'Board Card 1', desc: 'Desc', shortUrl: 'url', idList: 'list1', pos: 1, due: null, closed: false, dateLastActivity: '2023-01-01', dueComplete: false, labels: [], members: [], attachments: [] },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getBoardCards.mockResolvedValueOnce({ data: mockCards, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'board1', attachments: 'true', members: 'true', filter: 'open' };
      const result = await handleTrelloGetBoardCards(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getBoardCards).toHaveBeenCalledWith('board1', { attachments: 'true', members: 'true', filter: 'open' });
      expect(result.content[0].text).toContain('Found 1 card(s) in board');
      expect(result.content[0].text).toContain('Board Card 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleTrelloGetBoardCards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board cards: Validation error: boardId: Must be a valid 24-character Trello ID');
    });
  });

  describe('handleTrelloGetCardActions', () => {
    test('should return card actions on success', async () => {
      const mockActions = [
        { id: 'action1', type: 'commentCard', date: '2023-01-01', memberCreator: null, data: { text: 'Comment' } },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getCardActions.mockResolvedValueOnce({ data: mockActions, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', filter: 'commentCard', limit: 10 };
      const result = await handleTrelloGetCardActions(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getCardActions).toHaveBeenCalledWith('card1', { filter: 'commentCard', limit: 10 });
      expect(result.content[0].text).toContain('Found 1 action(s) for card');
      expect(result.content[0].text).toContain('commentCard');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloGetCardActions(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card actions: Validation error: cardId: Required');
    });
  });

  describe('handleTrelloGetCardAttachments', () => {
    test('should return card attachments on success', async () => {
      const mockAttachments = [
        { id: 'attach1', name: 'Attachment 1', url: 'url', mimeType: 'image/png', date: '2023-01-01', bytes: 100, isUpload: true, previews: [] },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getCardAttachments.mockResolvedValueOnce({ data: mockAttachments, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', fields: ['name', 'url'] };
      const result = await handleTrelloGetCardAttachments(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getCardAttachments).toHaveBeenCalledWith('card1', { fields: ['name', 'url'] });
      expect(result.content[0].text).toContain('Found 1 attachment(s) for card');
      expect(result.content[0].text).toContain('Attachment 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'invalid' };
      const result = await handleTrelloGetCardAttachments(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card attachments: Validation error: cardId: Must be a valid 24-character Trello ID');
    });
  });

  describe('handleTrelloGetCardChecklists', () => {
    test('should return card checklists on success', async () => {
      const mockChecklists = [
        { id: 'chk1', name: 'Checklist 1', pos: 1, checkItems: [] },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getCardChecklists.mockResolvedValueOnce({ data: mockChecklists, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', checkItems: 'all', fields: ['name'] };
      const result = await handleTrelloGetCardChecklists(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getCardChecklists).toHaveBeenCalledWith('card1', { checkItems: 'all', fields: ['name'] });
      expect(result.content[0].text).toContain('Found 1 checklist(s) for card');
      expect(result.content[0].text).toContain('Checklist 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloGetCardChecklists(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card checklists: Validation error: cardId: Required');
    });
  });

  describe('handleTrelloGetBoardMembers', () => {
    test('should return board members on success', async () => {
      const mockMembers = [
        { id: 'member1', fullName: 'Member One', username: 'memberone', memberType: 'normal', confirmed: true, avatarUrl: 'url', initials: 'MO' },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getBoardMembers.mockResolvedValueOnce({ data: mockMembers, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'board1' };
      const result = await handleTrelloGetBoardMembers(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getBoardMembers).toHaveBeenCalledWith('board1');
      expect(result.content[0].text).toContain('Found 1 member(s) on board');
      expect(result.content[0].text).toContain('Member One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleTrelloGetBoardMembers(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board members: Validation error: boardId: Must be a valid 24-character Trello ID');
    });
  });

  describe('handleTrelloGetBoardLabels', () => {
    test('should return board labels on success', async () => {
      const mockLabels = [
        { id: 'label1', name: 'Label One', color: 'red', uses: 5 },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getBoardLabels.mockResolvedValueOnce({ data: mockLabels, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'board1' };
      const result = await handleTrelloGetBoardLabels(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getBoardLabels).toHaveBeenCalledWith('board1');
      expect(result.content[0].text).toContain('Found 1 label(s) on board');
      expect(result.content[0].text).toContain('Label One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleTrelloGetBoardLabels(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board labels: Validation error: boardId: Must be a valid 24-character Trello ID');
    });
  });
});