import { handleTrelloGetUserBoards, handleTrelloGetMember } from '../src/tools/members.js';
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

describe('Members Tool', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTrelloGetUserBoards', () => {
    test('should return user boards on success', async () => {
      const mockUser = {
        id: 'user1', fullName: 'Test User', username: 'testuser',
        boards: [
          { id: 'board1', name: 'Board One', desc: 'Desc One', shortUrl: 'url1', dateLastActivity: '2023-01-01', closed: false, prefs: { permissionLevel: 'public' } },
          { id: 'board2', name: 'Board Two', desc: 'Desc Two', shortUrl: 'url2', dateLastActivity: '2023-01-02', closed: true, prefs: { permissionLevel: 'private' } },
        ],
        organizations: [
          { id: 'org1', name: 'Org One', displayName: 'Org One Display', desc: 'Org Desc' }
        ]
      };
      (TrelloClient as jest.Mock).mock.results[0].value.getCurrentUser.mockResolvedValueOnce({ data: mockUser, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'all' };
      const result = await handleTrelloGetUserBoards(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getCurrentUser).toHaveBeenCalled();
      expect(result.content[0].text).toContain('User: Test User');
      expect(result.content[0].text).toContain('Board One');
      expect(result.content[0].text).toContain('Board Two');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing apiKey', async () => {
      const args = { token: 'testToken' };
      const result = await handleTrelloGetUserBoards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting user boards: Validation error: apiKey: Required');
    });
  });

  describe('handleTrelloGetMember', () => {
    test('should return member details on success', async () => {
      const mockMember = {
        id: 'member1', fullName: 'Member One', username: 'memberone', bio: 'Bio', url: 'url', memberType: 'normal', confirmed: true,
        avatarUrl: 'avatarurl', initials: 'MO',
        boards: [
          { id: 'board1', name: 'Member Board 1', desc: 'Desc', shortUrl: 'url', closed: false, dateLastActivity: '2023-01-01' }
        ],
        organizations: [
          { id: 'org1', name: 'Member Org 1', displayName: 'Member Org 1 Display', desc: 'Org Desc' }
        ]
      };
      (TrelloClient as jest.Mock).mock.results[0].value.getMember.mockResolvedValueOnce({ data: mockMember, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', memberId: 'member1', boards: 'all', organizations: 'all' };
      const result = await handleTrelloGetMember(args);

      expect((TrelloClient as jest.Mock).mock.results[0].value.getMember).toHaveBeenCalledWith('member1', { boards: 'all', organizations: 'all' });
      expect(result.content[0].text).toContain('Member: Member One');
      expect(result.content[0].text).toContain('Member Board 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing memberId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloGetMember(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting member: Validation error: memberId: Required');
    });
  });
});