import { handleTrelloGetListCards, handleTrelloCreateList, handleTrelloAddComment } from '../src/tools/lists.js';
import { jest } from '@jest/globals';
import { TrelloClient } from '../src/trello/client';

const MOCK_BOARD_ID = '1a2b3c4d5e6f7a8b9c0d1e2f';
const MOCK_LIST_ID = '5f6e7d8c9b0a1e2d3c4b5a6f';
const MOCK_LIST_ID_TWO = '0f9e8d7c6b5a4321fedcba98';
const MOCK_CARD_ID = '64b7f2c5d9a1b3c4d5e6f7a8';
const MOCK_CARD_ID_TWO = 'abcdef1234567890abcdef12';

describe('Lists Tool', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleTrelloGetListCards', () => {
    test('should return a list of cards on success', async () => {
      const mockCards = [
        {
          id: MOCK_CARD_ID,
          name: 'Card One',
          desc: 'Desc One',
          shortUrl: 'url1',
          idList: MOCK_LIST_ID,
          idBoard: MOCK_BOARD_ID,
          pos: 1,
          due: null,
          closed: false,
          dateLastActivity: '2023-01-01',
          dueComplete: false,
          labels: [],
          members: []
        },
        {
          id: MOCK_CARD_ID_TWO,
          name: 'Card Two',
          desc: 'Desc Two',
          shortUrl: 'url2',
          idList: MOCK_LIST_ID,
          idBoard: MOCK_BOARD_ID,
          pos: 2,
          due: null,
          closed: false,
          dateLastActivity: '2023-01-02',
          dueComplete: false,
          labels: [],
          members: []
        }
      ];

      const getListCardsSpy = jest
        .spyOn(TrelloClient.prototype, 'getListCards')
        .mockResolvedValue({ data: mockCards, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', listId: MOCK_LIST_ID, filter: 'open' };
      const result = await handleTrelloGetListCards(args);

      expect(getListCardsSpy).toHaveBeenCalledWith(MOCK_LIST_ID, { filter: 'open' });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toContain('Found 2');
      expect(payload.listId).toBe(MOCK_LIST_ID);
      expect(payload.cards[0].name).toBe('Card One');
      expect(payload.cards).toHaveLength(2);
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
      const mockList = {
        id: MOCK_LIST_ID_TWO,
        name: 'New List',
        idBoard: MOCK_BOARD_ID,
        pos: 1,
        closed: false,
        subscribed: false
      };

      const createListSpy = jest
        .spyOn(TrelloClient.prototype, 'createList')
        .mockResolvedValue({ data: mockList, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', name: 'New List', idBoard: MOCK_BOARD_ID };
      const result = await handleTrelloCreateList(args);

      expect(createListSpy).toHaveBeenCalledWith({ name: 'New List', idBoard: MOCK_BOARD_ID });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toContain('Created list: New List');
      expect(payload.list.id).toBe(MOCK_LIST_ID_TWO);
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing name', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', idBoard: MOCK_BOARD_ID };
      const result = await handleTrelloCreateList(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating list: Validation error: name: Required');
    });
  });

  describe('handleTrelloAddComment', () => {
    test('should add a comment to a card on success', async () => {
      const mockComment = {
        id: 'newCommentId',
        type: 'commentCard',
        date: '2023-01-01',
        memberCreator: null,
        data: { text: 'Test Comment', card: { id: MOCK_CARD_ID, name: 'Card One' } }
      };

      const addCommentSpy = jest
        .spyOn(TrelloClient.prototype, 'addCommentToCard')
        .mockResolvedValue({ data: mockComment, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, text: 'Test Comment' };
      const result = await handleTrelloAddComment(args);

      expect(addCommentSpy).toHaveBeenCalledWith(MOCK_CARD_ID, 'Test Comment');

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toBe(`Added comment to card ${MOCK_CARD_ID}`);
      expect(payload.comment.data.text).toBe('Test Comment');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing text', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID };
      const result = await handleTrelloAddComment(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error adding comment: Validation error: text: Required');
    });
  });
});
