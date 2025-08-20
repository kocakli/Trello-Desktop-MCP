import { handleTrelloSearch } from '../src/tools/search.js';
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

describe('Search Tool', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTrelloSearch', () => {
    test('should return search results on success', async () => {
      const mockSearchResults = {
        boards: [{ id: 'board1', name: 'Search Board 1', desc: 'Desc', shortUrl: 'url', closed: false, dateLastActivity: '2023-01-01' }],
        cards: [{ id: 'card1', name: 'Search Card 1', desc: 'Desc', shortUrl: 'url', idList: 'list1', idBoard: 'board1', due: null, closed: false, labels: [] }],
        members: [{ id: 'member1', fullName: 'Search Member 1', username: 'searchmember', bio: 'Bio', url: 'url' }],
        organizations: [{ id: 'org1', name: 'Search Org 1', displayName: 'Search Org 1 Display', desc: 'Desc', url: 'url' }]
      };
      (TrelloClient as jest.Mock).mock.results[0].value.search.mockResolvedValueOnce({ data: mockSearchResults, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', query: 'test query', modelTypes: ['boards', 'cards'] };
      const result = await handleTrelloSearch(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.search).toHaveBeenCalledWith('test query', { modelTypes: ['boards', 'cards'] });
      expect(result.content[0].text).toContain('Search results for: "test query"');
      expect(result.content[0].text).toContain('Search Board 1');
      expect(result.content[0].text).toContain('Search Card 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing query', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloSearch(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching Trello: Validation error: query: Required');
    });
  });
});