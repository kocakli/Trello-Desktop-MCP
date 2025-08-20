import { handleTrelloGetListCards, handleTrelloCreateList, handleTrelloAddComment } from '../src/tools/lists.js';
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

describe('Lists Tool', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTrelloGetListCards', () => {
    test('should return a list of cards on success', async () => {
      const mockCards = [
        { id: 'card1', name: 'Card One', desc: 'Desc One', shortUrl: 'url1', idList: 'list1', idBoard: 'board1', pos: 1, due: null, closed: false, dateLastActivity: '2023-01-01', dueComplete: false, labels: [], members: [] },
        { id: 'card2', name: 'Card Two', desc: 'Desc Two', shortUrl: 'url2', idList: 'list1', idBoard: 'board1', pos: 2, due: null, closed: false, dateLastActivity: '2023-01-02', dueComplete: false, labels: [], members: [] },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getListCards.mockResolvedValueOnce({ data: mockCards, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', listId: 'list1', filter: 'open' };
      const result = await handleTrelloGetListCards(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getListCards).toHaveBeenCalledWith('list1', { filter: 'open' });
      expect(result.content[0].text).toContain('Found 2 open card(s) in list');
      expect(result.content[0].text).toContain('Card One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing listId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloGetListCards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting list cards: Validation error: listId: Required');
    });
  });

  describe('handleTrelloCreateList', () => {
    test('should create a list on success', async () => {
      const mockList = { id: 'newListId', name: 'New List', idBoard: 'board1', pos: 1, closed: false, subscribed: false };
      (TrelloClient as jest.Mock).mock.results[0].value.createList.mockResolvedValueOnce({ data: mockList, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', name: 'New List', idBoard: 'board1' };
      const result = await handleTrelloCreateList(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.createList).toHaveBeenCalledWith({ name: 'New List', idBoard: 'board1' });
      expect(result.content[0].text).toContain('Created list: New List');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing name', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', idBoard: 'board1' };
      const result = await handleTrelloCreateList(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating list: Validation error: name: List name is required');
    });
  });

  describe('handleTrelloAddComment', () => {
    test('should add a comment to a card on success', async () => {
      const mockComment = { id: 'newCommentId', type: 'commentCard', date: '2023-01-01', memberCreator: null, data: { text: 'Test Comment' } };
      (TrelloClient as jest.Mock).mock.results[0].value.addCommentToCard.mockResolvedValueOnce({ data: mockComment, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', text: 'Test Comment' };
      const result = await handleTrelloAddComment(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.addCommentToCard).toHaveBeenCalledWith('card1', 'Test Comment');
      expect(result.content[0].text).toContain('Added comment to card card1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing text', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1' };
      const result = await handleTrelloAddComment(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error adding comment: Validation error: text: Comment text is required');
    });
  });
});