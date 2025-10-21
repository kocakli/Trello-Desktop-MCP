import { handleCreateCard, handleUpdateCard, handleMoveCard, handleGetCard } from '../src/tools/cards.js';
import { jest } from '@jest/globals';
import { TrelloClient } from '../src/trello/client';

const MOCK_CARD_ID = '64b7f2c5d9a1b3c4d5e6f7a8';
const MOCK_BOARD_ID = '1a2b3c4d5e6f7a8b9c0d1e2f';
const MOCK_LIST_ID = '5f6e7d8c9b0a1e2d3c4b5a6f';

describe('Cards Tool', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleCreateCard', () => {
    test('should create a card on success', async () => {
      const mockCard = {
        id: MOCK_CARD_ID,
        name: 'New Card',
        desc: 'New Desc',
        shortUrl: 'url',
        idList: MOCK_LIST_ID,
        idBoard: MOCK_BOARD_ID,
        pos: 1,
        due: null,
        closed: false,
        labels: [],
        members: []
      };

      const createCardSpy = jest
        .spyOn(TrelloClient.prototype, 'createCard')
        .mockResolvedValue({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', name: 'New Card', idList: MOCK_LIST_ID };
      const result = await handleCreateCard(args);

      expect(createCardSpy).toHaveBeenCalledWith({ name: 'New Card', idList: MOCK_LIST_ID });
      expect(result.content[0].text).toContain('Created card: New Card');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing name', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', idList: MOCK_LIST_ID };
      const result = await handleCreateCard(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card: Validation error: name: Required');
    });
  });

  describe('handleUpdateCard', () => {
    test('should update a card on success', async () => {
      const mockCard = {
        id: MOCK_CARD_ID,
        name: 'Updated Card',
        desc: 'Updated Desc',
        shortUrl: 'url',
        idList: MOCK_LIST_ID,
        idBoard: MOCK_BOARD_ID,
        pos: 1,
        due: null,
        closed: false,
        labels: [],
        members: [],
        dueComplete: false
      };

      const updateCardSpy = jest
        .spyOn(TrelloClient.prototype, 'updateCard')
        .mockResolvedValue({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, name: 'Updated Card' };
      const result = await handleUpdateCard(args);

      expect(updateCardSpy).toHaveBeenCalledWith(MOCK_CARD_ID, { name: 'Updated Card' });
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
        id: MOCK_CARD_ID,
        name: 'Moved Card',
        shortUrl: 'url',
        idList: MOCK_LIST_ID,
        idBoard: MOCK_BOARD_ID,
        pos: 1
      };

      const moveCardSpy = jest
        .spyOn(TrelloClient.prototype, 'moveCard')
        .mockResolvedValue({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, idList: MOCK_LIST_ID };
      const result = await handleMoveCard(args);

      expect(moveCardSpy).toHaveBeenCalledWith(MOCK_CARD_ID, { idList: MOCK_LIST_ID });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toContain('Moved card "Moved Card"');
      expect(payload.card.id).toBe(MOCK_CARD_ID);
      expect(payload.card.listId).toBe(MOCK_LIST_ID);
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing idList', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID };
      const result = await handleMoveCard(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error moving card: Validation error: idList: Required');
    });
  });

  describe('handleGetCard', () => {
    test('should get card details on success', async () => {
      const mockCard = {
        id: MOCK_CARD_ID,
        name: 'Test Card',
        desc: 'Test Desc',
        shortUrl: 'url',
        idList: MOCK_LIST_ID,
        idBoard: MOCK_BOARD_ID,
        pos: 1,
        due: null,
        closed: false,
        dateLastActivity: '2023-01-01',
        dueComplete: false,
        labels: [{ id: 'label1', name: 'Label1', color: 'red' }],
        members: [{ id: 'member1', fullName: 'Member One', username: 'memberone', initials: 'MO' }],
        checklists: [{ id: 'chk1', name: 'Checklist One', checkItems: [] }],
        badges: { votes: 0, comments: 0, attachments: 0, checkItems: 0, checkItemsChecked: 0, description: false }
      };

      const getCardSpy = jest
        .spyOn(TrelloClient.prototype, 'getCard')
        .mockResolvedValue({ data: mockCard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, includeDetails: true };
      const result = await handleGetCard(args);

      expect(getCardSpy).toHaveBeenCalledWith(MOCK_CARD_ID, true);
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
