import { handleListBoards, handleGetBoardDetails, handleGetLists } from '../src/tools/boards.js';
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

describe('Boards Tool', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Clears all calls and mock implementations on the mocked TrelloClient methods
  });

  describe('handleListBoards', () => {
    test('should return a list of boards on success', async () => {
      const mockBoards = [
        { id: 'board1', name: 'Board One', desc: 'Desc One', shortUrl: 'url1', dateLastActivity: '2023-01-01', closed: false },
        { id: 'board2', name: 'Board Two', desc: 'Desc Two', shortUrl: 'url2', dateLastActivity: '2023-01-02', closed: false },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getMyBoards.mockResolvedValueOnce({ data: mockBoards, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'open' };
      const result = await handleListBoards(args);

      expect(TrelloClient).toHaveBeenCalledTimes(1);
      expect((TrelloClient as jest.Mock).mock.results[0].value.getMyBoards).toHaveBeenCalledWith('open');
      expect(result.content[0].text).toContain('Found 2 open board(s)');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing apiKey', async () => {
      const args = { token: 'testToken' };
      const result = await handleListBoards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error listing boards: Validation error: apiKey: Required');
    });

    test('should handle Trello API error', async () => {
      (TrelloClient as jest.Mock).mock.results[0].value.getMyBoards.mockRejectedValueOnce(new Error('API Error'));

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'open' };
      const result = await handleListBoards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error listing boards: API Error');
    });
  });

  describe('handleGetBoardDetails', () => {
    test('should return board details on success', async () => {
      const mockBoard = {
        id: 'board1', name: 'Board One', desc: 'Desc One', shortUrl: 'url1', dateLastActivity: '2023-01-01', closed: false,
        prefs: { permissionLevel: 'public' },
        lists: [{ id: 'list1', name: 'List One' }],
        cards: [{ id: 'card1', name: 'Card One' }]
      };
      (TrelloClient as jest.Mock).mock.results[0].value.getBoard.mockResolvedValueOnce({ data: mockBoard, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'board1', includeDetails: true };
      const result = await handleGetBoardDetails(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getBoard).toHaveBeenCalledWith('board1', true);
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
        { id: 'list1', name: 'List One', pos: 1, closed: false, subscribed: false },
        { id: 'list2', name: 'List Two', pos: 2, closed: false, subscribed: false },
      ];
      (TrelloClient as jest.Mock).mock.results[0].value.getBoardLists.mockResolvedValueOnce({ data: mockLists, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { token: 'testToken', filter: 'open', boardId: 'board1' };
      const result = await handleGetLists(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getBoardLists).toHaveBeenCalledWith('board1', 'open');
      expect(result.content[0].text).toContain('Found 2 open list(s) in board');
      expect(result.content[0].text).toContain('List One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing boardId', async () => {
      const args = { token: 'testToken', filter: 'open' };
      const result = await handleGetLists(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting lists: Validation error: boardId: Required');
    });
  });
});