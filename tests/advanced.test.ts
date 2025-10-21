import {
  handleTrelloGetBoardCards,
  handleTrelloGetCardActions,
  handleTrelloGetCardAttachments,
  handleTrelloGetCardChecklists,
  handleTrelloGetBoardMembers,
  handleTrelloGetBoardLabels
} from '../src/tools/advanced.js';
import { jest } from '@jest/globals';
import { TrelloClient } from '../src/trello/client';

const MOCK_BOARD_ID = '1a2b3c4d5e6f7a8b9c0d1e2f';
const MOCK_CARD_ID = '64b7f2c5d9a1b3c4d5e6f7a8';
const MOCK_CARD_ID_TWO = '0f9e8d7c6b5a4321fedcba98';
const MOCK_LIST_ID = '5f6e7d8c9b0a1e2d3c4b5a6f';

describe('Advanced Tools', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleTrelloGetBoardCards', () => {
    test('should return board cards on success', async () => {
      const mockCards = [
        {
          id: MOCK_CARD_ID,
          name: 'Board Card 1',
          desc: 'Desc',
          shortUrl: 'url',
          idList: MOCK_LIST_ID,
          idBoard: MOCK_BOARD_ID,
          pos: 1,
          due: null,
          closed: false,
          dateLastActivity: '2023-01-01',
          dueComplete: false,
          labels: [],
          members: [],
          attachments: []
        }
      ];

      const getBoardCardsSpy = jest
        .spyOn(TrelloClient.prototype, 'getBoardCards')
        .mockResolvedValue({ data: mockCards, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: MOCK_BOARD_ID, attachments: 'true', members: 'true', filter: 'open' };
      const result = await handleTrelloGetBoardCards(args);

      expect(getBoardCardsSpy).toHaveBeenCalledWith(MOCK_BOARD_ID, { attachments: 'true', members: 'true', filter: 'open' });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.summary).toContain('Found 1');
      expect(payload.cards[0].name).toBe('Board Card 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleTrelloGetBoardCards(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board cards: Validation error: boardId: Invalid board ID format');
    });
  });

  describe('handleTrelloGetCardActions', () => {
    test('should return card actions on success', async () => {
      const mockActions = [
        { id: MOCK_CARD_ID, type: 'commentCard', date: '2023-01-01', memberCreator: null, data: { text: 'Comment' } }
      ];

      const getCardActionsSpy = jest
        .spyOn(TrelloClient.prototype, 'getCardActions')
        .mockResolvedValue({ data: mockActions, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, filter: 'commentCard', limit: 10 };
      const result = await handleTrelloGetCardActions(args);

      expect(getCardActionsSpy).toHaveBeenCalledWith(MOCK_CARD_ID, { filter: 'commentCard', limit: 10 });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.actions).toHaveLength(1);
      expect(payload.actions[0].type).toBe('commentCard');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloGetCardActions(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card actions: Validation error: cardId: Required');
    });
  });

  describe('handleTrelloGetCardAttachments', () => {
    test('should return card attachments on success', async () => {
      const mockAttachments = [
        { id: 'attach1', name: 'Attachment 1', url: 'url', mimeType: 'image/png', date: '2023-01-01', bytes: 100, isUpload: true, previews: [] }
      ];

      const getCardAttachmentsSpy = jest
        .spyOn(TrelloClient.prototype, 'getCardAttachments')
        .mockResolvedValue({ data: mockAttachments, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, fields: ['name', 'url'] };
      const result = await handleTrelloGetCardAttachments(args);

      expect(getCardAttachmentsSpy).toHaveBeenCalledWith(MOCK_CARD_ID, { fields: ['name', 'url'] });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments[0].name).toBe('Attachment 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', cardId: 'invalid' };
      const result = await handleTrelloGetCardAttachments(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card attachments: Validation error: cardId: Invalid card ID format');
    });
  });

  describe('handleTrelloGetCardChecklists', () => {
    test('should return card checklists on success', async () => {
      const mockChecklists = [
        { id: 'chk1', name: 'Checklist 1', pos: 1, checkItems: [] }
      ];

      const getCardChecklistsSpy = jest
        .spyOn(TrelloClient.prototype, 'getCardChecklists')
        .mockResolvedValue({ data: mockChecklists, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', cardId: MOCK_CARD_ID, checkItems: 'all', fields: ['name'] };
      const result = await handleTrelloGetCardChecklists(args);

      expect(getCardChecklistsSpy).toHaveBeenCalledWith(MOCK_CARD_ID, { checkItems: 'all', fields: ['name'] });

      const payload = JSON.parse(result.content[0].text);

      expect(payload.checklists).toHaveLength(1);
      expect(payload.checklists[0].name).toBe('Checklist 1');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for missing cardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken' };
      const result = await handleTrelloGetCardChecklists(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card checklists: Validation error: cardId: Required');
    });
  });

  describe('handleTrelloGetBoardMembers', () => {
    test('should return board members on success', async () => {
      const mockMembers = [
        { id: 'member1', fullName: 'Member One', username: 'memberone', memberType: 'normal', confirmed: true, avatarUrl: 'url', initials: 'MO' }
      ];

      const getBoardMembersSpy = jest
        .spyOn(TrelloClient.prototype, 'getBoardMembers')
        .mockResolvedValue({ data: mockMembers, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: MOCK_BOARD_ID };
      const result = await handleTrelloGetBoardMembers(args);

      expect(getBoardMembersSpy).toHaveBeenCalledWith(MOCK_BOARD_ID);

      const payload = JSON.parse(result.content[0].text);

      expect(payload.members).toHaveLength(1);
      expect(payload.members[0].fullName).toBe('Member One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleTrelloGetBoardMembers(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board members: Validation error: boardId: Invalid board ID format');
    });
  });

  describe('handleTrelloGetBoardLabels', () => {
    test('should return board labels on success', async () => {
      const mockLabels = [
        { id: 'label1', name: 'Label One', color: 'red', uses: 5 }
      ];

      const getBoardLabelsSpy = jest
        .spyOn(TrelloClient.prototype, 'getBoardLabels')
        .mockResolvedValue({ data: mockLabels, rateLimit: { limit: 100, remaining: 99, resetTime: 123 } });

      const args = { apiKey: 'testKey', token: 'testToken', boardId: MOCK_BOARD_ID };
      const result = await handleTrelloGetBoardLabels(args);

      expect(getBoardLabelsSpy).toHaveBeenCalledWith(MOCK_BOARD_ID);

      const payload = JSON.parse(result.content[0].text);

      expect(payload.labels).toHaveLength(1);
      expect(payload.labels[0].name).toBe('Label One');
      expect(result.isError).toBeUndefined();
    });

    test('should handle validation error for invalid boardId', async () => {
      const args = { apiKey: 'testKey', token: 'testToken', boardId: 'invalid' };
      const result = await handleTrelloGetBoardLabels(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting board labels: Validation error: boardId: Invalid board ID format');
    });
  });
});
