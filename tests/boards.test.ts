import { handleListBoards, handleGetBoardDetails, handleGetLists } from '../src/tools/boards.js';
import { jest } from '@jest/globals';
import { TrelloClient } from '../src/trello/client';

const MOCK_BOARD_ID = '1a2b3c4d5e6f7a8b9c0d1e2f';
const MOCK_LIST_ID = '5f6e7d8c9b0a1e2d3c4b5a6f';
const MOCK_CARD_ID = '64b7f2c5d9a1b3c4d5e6f7a8';

describe('Boards Tool', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleListBoards', () => {
    test('should return a list of boards on success', async () => {
      const mockBoards = [
        { id: MOCK_BOARD_ID, name: 'Board One', desc: 'Desc One', shortUrl: 'url1', dateLastActivity: '2023-01-01', closed: false },
        { id: '0f9e8d7c6b5a4321fedcba98', name: 'Board Two', desc: 'Desc Two', shortUrl: 'url2', dateLastActivity: '2023-01-02', closed: false },
      ];

      const getMyBoardsSpy = jest
        .spyOn(TrelloClient.prototype, 'getMyBoards')
        .mockResolvedValue({ data: mockBoards, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'open' };
      const result = await handleListBoards(args);

      expect(getMyBoardsSpy).toHaveBeenCalledWith('open');
      expect(result.content[0].text).toContain('Found 2 open board(s)');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid filter value', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', filter: 'invalid' };
      const result = await handleListBoards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error listing boards: Validation error: filter: Invalid enum value');
    });

    test('should handle Trello API error', async () => {
      const getMyBoardsSpy = jest
        .spyOn(TrelloClient.prototype, 'getMyBoards')
        .mockRejectedValueOnce(new Error('API Error'));

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'open' };
      const result = await handleListBoards(args);

      expect(getMyBoardsSpy).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error listing boards: API Error');
    });
  });

  describe('handleGetBoardDetails', () => {
    test('should return board details on success', async () => {
      const mockBoard = {
        id: MOCK_BOARD_ID,
        name: 'Board One',
        desc: 'Desc One',
        shortUrl: 'url1',
        dateLastActivity: '2023-01-01',
        closed: false,
        prefs: { permissionLevel: 'public' },
        lists: [{ id: MOCK_LIST_ID, name: 'List One' }],
        cards: [{ id: MOCK_CARD_ID, name: 'Card One' }]
      };

      const getBoardSpy = jest
        .spyOn(TrelloClient.prototype, 'getBoard')
        .mockResolvedValue({ data: mockBoard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: MOCK_BOARD_ID, includeDetails: true };
      const result = await handleGetBoardDetails(args);

      expect(getBoardSpy).toHaveBeenCalledWith(MOCK_BOARD_ID, true);
      expect(result.content[0].text).toContain('Board: Board One');
      expect(result.content[0].text).toContain('List One');
      expect(result.content[0].text).toContain('Card One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleGetBoardDetails(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board details: Validation error: boardId: Must be a valid 24-character Trello ID');
    });
  });

  describe('handleGetLists', () => {
    test('should return a list of lists on success', async () => {
      const mockLists = [
        { id: MOCK_LIST_ID, name: 'List One', pos: 1, closed: false, subscribed: false },
        { id: 'abcdefabcdefabcdefabcd', name: 'List Two', pos: 2, closed: false, subscribed: false }
      ];

      const getBoardListsSpy = jest
        .spyOn(TrelloClient.prototype, 'getBoardLists')
        .mockResolvedValue({ data: mockLists, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'open', boardId: MOCK_BOARD_ID };
      const result = await handleGetLists(args);

      expect(getBoardListsSpy).toHaveBeenCalledWith(MOCK_BOARD_ID, 'open');
      expect(result.content[0].text).toContain('Found 2 open list(s) in board');
      expect(result.content[0].text).toContain('List One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', filter: 'open' };
      const result = await handleGetLists(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting lists: Validation error: boardId: Required');
    });
  });
});
