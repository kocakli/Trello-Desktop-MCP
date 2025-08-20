import { handleCreateCard, handleUpdateCard, handleMoveCard, handleGetCard } from '../src/tools/cards.js';
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

describe('Cards Tool', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCreateCard', () => {
    test('should create a card on success', async () => {
      const mockCard = {
        id: 'newCardId', name: 'New Card', desc: 'New Desc', shortUrl: 'url', idList: 'list1', idBoard: 'board1',
        pos: 1, due: null, closed: false, labels: [], members: []
      };
      (TrelloClient as jest.Mock).mock.results[0].value.createCard.mockResolvedValueOnce({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', name: 'New Card', idList: 'list1' };
      const result = await handleCreateCard(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.createCard).toHaveBeenCalledWith({ name: 'New Card', idList: 'list1' });
      expect(result.content[0].text).toContain('Created card: New Card');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing name', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', idList: 'list1' };
      const result = await handleCreateCard(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card: Validation error: name: Card name is required, idList: Must be a valid 24-character Trello ID');
    });
  });

  describe('handleUpdateCard', () => {
    test('should update a card on success', async () => {
      const mockCard = {
        id: 'card1', name: 'Updated Card', desc: 'Updated Desc', shortUrl: 'url', idList: 'list1', idBoard: 'board1',
        pos: 1, due: null, closed: false, labels: [], members: [], dueComplete: false
      };
      (TrelloClient as jest.Mock).mock.results[0].value.updateCard.mockResolvedValueOnce({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', name: 'Updated Card' };
      const result = await handleUpdateCard(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.updateCard).toHaveBeenCalledWith('card1', { name: 'Updated Card' });
      expect(result.content[0].text).toContain('Updated card: Updated Card');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'invalid', name: 'Updated Card' };
      const result = await handleUpdateCard(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating card: Validation error: cardId: Must be a valid 24-character Trello ID');
    });
  });

  describe('handleMoveCard', () => {
    test('should move a card on success', async () => {
      const mockCard = {
        id: 'card1', name: 'Moved Card', shortUrl: 'url', idList: 'newList1', idBoard: 'board1', pos: 1
      };
      (TrelloClient as jest.Mock).mock.results[0].value.moveCard.mockResolvedValueOnce({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', idList: 'newList1' };
      const result = await handleMoveCard(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.moveCard).toHaveBeenCalledWith('card1', { idList: 'newList1' });
      expect(result.content[0].text).toContain('Moved card "Moved Card" to list newList1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing idList', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1' };
      const result = await handleMoveCard(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error moving card: Validation error: idList: Required');
    });
  });

  describe('handleGetCard', () => {
    test('should get card details on success', async () => {
      const mockCard = {
        id: 'card1', name: 'Test Card', desc: 'Test Desc', shortUrl: 'url', idList: 'list1', idBoard: 'board1',
        pos: 1, due: null, closed: false, dateLastActivity: '2023-01-01', dueComplete: false,
        labels: [{ id: 'label1', name: 'Label1', color: 'red' }],
        members: [{ id: 'member1', fullName: 'Member One', username: 'memberone', initials: 'MO' }],
        checklists: [{ id: 'chk1', name: 'Checklist One', checkItems: [] }],
        badges: { votes: 0, comments: 0, attachments: 0, checkItems: 0, checkItemsChecked: 0, description: false }
      };
      (TrelloClient as jest.Mock).mock.results[0].value.getCard.mockResolvedValueOnce({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'card1', includeDetails: true };
      const result = await handleGetCard(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getCard).toHaveBeenCalledWith('card1', true);
      expect(result.content[0].text).toContain('Card: Test Card');
      expect(result.content[0].text).toContain('Label1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleGetCard(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card: Validation error: cardId: Required');
    });
  });
});
