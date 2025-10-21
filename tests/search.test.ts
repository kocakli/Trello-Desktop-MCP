import { handleTrelloSearch } from '../src/tools/search.js';
import { jest } from '@jest/globals';
import { TrelloClient } from '../src/trello/client';

const MOCK_BOARD_ID = '1a2b3c4d5e6f7a8b9c0d1e2f';
const MOCK_CARD_ID = '64b7f2c5d9a1b3c4d5e6f7a8';
const MOCK_LIST_ID = '5f6e7d8c9b0a1e2d3c4b5a6f';
const MOCK_MEMBER_ID = 'abcdefabcdefabcdefabcd';
const MOCK_ORG_ID = '0f9e8d7c6b5a4321fedcba98';

describe('Search Tool', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleTrelloSearch', () => {
    test('should return search results on success', async () => {
      const mockSearchResults = {
        boards: [{ id: MOCK_BOARD_ID, name: 'Search Board 1', desc: 'Desc', shortUrl: 'url', closed: false, dateLastActivity: '2023-01-01' }],
        cards: [{ id: MOCK_CARD_ID, name: 'Search Card 1', desc: 'Desc', shortUrl: 'url', idList: MOCK_LIST_ID, idBoard: MOCK_BOARD_ID, due: null, closed: false, labels: [] }],
        members: [{ id: MOCK_MEMBER_ID, fullName: 'Search Member 1', username: 'searchmember', bio: 'Bio', url: 'url' }],
        organizations: [{ id: MOCK_ORG_ID, name: 'Search Org 1', displayName: 'Search Org 1 Display', desc: 'Desc', url: 'url' }]
      };

      const searchSpy = jest
        .spyOn(TrelloClient.prototype, 'search')
        .mockResolvedValue({ data: mockSearchResults, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', query: 'test query', modelTypes: ['boards', 'cards'] };
      const result = await handleTrelloSearch(args);

      expect(searchSpy).toHaveBeenCalledWith('test query', { modelTypes: ['boards', 'cards'] });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toBe('Search results for: "test query"');
      expect(payload.boards[0].name).toBe('Search Board 1');
      expect(payload.cards[0].name).toBe('Search Card 1');
      expect(payload.totalResults).toEqual({ boards: 1, cards: 1, members: 1, organizations: 1 });
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
