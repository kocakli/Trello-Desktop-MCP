import { handleTrelloGetUserBoards, handleTrelloGetMember } from '../src/tools/members.js';
import { jest } from '@jest/globals';
import { TrelloClient } from '../src/trello/client';

const MOCK_BOARD_ID = '1a2b3c4d5e6f7a8b9c0d1e2f';
const MOCK_BOARD_ID_TWO = '0f9e8d7c6b5a4321fedcba98';
const MOCK_MEMBER_ID = 'abcdefabcdefabcdefabcd';
const MOCK_ORG_ID = '5f6e7d8c9b0a1e2d3c4b5a6';

describe('Members Tool', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleTrelloGetUserBoards', () => {
    test('should return user boards on success', async () => {
      const mockUser = {
        id: MOCK_MEMBER_ID,
        fullName: 'Test User',
        username: 'testuser',
        boards: [
          { id: MOCK_BOARD_ID, name: 'Board One', desc: 'Desc One', shortUrl: 'url1', dateLastActivity: '2023-01-01', closed: false, prefs: { permissionLevel: 'public' } },
          { id: MOCK_BOARD_ID_TWO, name: 'Board Two', desc: 'Desc Two', shortUrl: 'url2', dateLastActivity: '2023-01-02', closed: true, prefs: { permissionLevel: 'private' } }
        ],
        organizations: [
          { id: MOCK_ORG_ID, name: 'Org One', displayName: 'Org One Display', desc: 'Org Desc' }
        ]
      };

      const getCurrentUserSpy = jest
        .spyOn(TrelloClient.prototype, 'getCurrentUser')
        .mockResolvedValue({ data: mockUser, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', filter: 'all' };
      const result = await handleTrelloGetUserBoards(args);

      expect(getCurrentUserSpy).toHaveBeenCalled();
      expect(result.content[0].text).toContain('User: Test User');
      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toContain('Test User');
      expect(payload.boards).toHaveLength(2);
      expect(payload.boards[0].name).toBe('Board One');
      expect(payload.boards[1].name).toBe('Board Two');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid filter', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', filter: 'invalid' };
      const result = await handleTrelloGetUserBoards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting user boards: Validation error: filter: Invalid enum value');
    });
  });

  describe('handleTrelloGetMember', () => {
    test('should return member details on success', async () => {
      const mockMember = {
        id: MOCK_MEMBER_ID,
        fullName: 'Member One',
        username: 'memberone',
        bio: 'Bio',
        url: 'url',
        memberType: 'normal',
        confirmed: true,
        avatarUrl: 'avatarurl',
        initials: 'MO',
        boards: [
          { id: MOCK_BOARD_ID, name: 'Member Board 1', desc: 'Desc', shortUrl: 'url', closed: false, dateLastActivity: '2023-01-01' }
        ],
        organizations: [
          { id: MOCK_ORG_ID, name: 'Member Org 1', displayName: 'Member Org 1 Display', desc: 'Org Desc' }
        ]
      };

      const getMemberSpy = jest
        .spyOn(TrelloClient.prototype, 'getMember')
        .mockResolvedValue({ data: mockMember, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', memberId: MOCK_MEMBER_ID, boards: 'all', organizations: 'all' };
      const result = await handleTrelloGetMember(args);

      expect(getMemberSpy).toHaveBeenCalledWith(MOCK_MEMBER_ID, { boards: 'all', organizations: 'all' });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toContain('Member One');
      expect(payload.boards[0].name).toBe('Member Board 1');
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
