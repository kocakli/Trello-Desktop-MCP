import { TrelloClient } from '../src/trello/client.js';
import { jest } from '@jest/globals';

describe('TrelloClient with internal mock', () => {
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const urlString = url.toString();
      if (urlString.includes('/members/me/boards')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'mockBoard1', name: 'Mock Board 1' },
            { id: 'mockBoard2', name: 'Mock Board 2' }
          ]),
          headers: new Headers()
        } as Response);
      } else if (urlString.includes('/boards/')) {
        // Extract boardId before query parameters
        const boardIdMatch = urlString.match(/\/boards\/([^\/?]+)/);
        const boardId = boardIdMatch ? boardIdMatch[1] : 'unknown_board_id';

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: boardId,
            name: `Mock Board ${boardId}`,
            desc: `Description for Mock Board ${boardId}`,
            closed: false,
            url: `http://localhost:3000/1/boards/${boardId}`
          }),
          headers: new Headers()
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' }),
        headers: new Headers()
      } as Response);
    });
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  test('should fetch boards from the mocked API', async () => {
    const client = new TrelloClient({
      apiKey: 'dummy_key',
      token: 'dummy_token',
    });

    const response = await client.getMyBoards();
    console.log('Response from mocked API (getMyBoards):', response.data);

    expect(response.data).toEqual([
      { id: 'mockBoard1', name: 'Mock Board 1' },
      { id: 'mockBoard2', name: 'Mock Board 2' }
    ]);
  });

  test('should fetch a specific board from the mocked API', async () => {
    const client = new TrelloClient({
      apiKey: 'dummy_key',
      token: 'dummy_token',
    });

    const boardId = 'testBoardId';
    const response = await client.getBoard(boardId);
    console.log(`Response from mocked API (getBoard ${boardId}):`, response.data);

    expect(response.data).toEqual({
      id: boardId,
      name: `Mock Board ${boardId}`,
      desc: `Description for Mock Board ${boardId}`,
      closed: false,
      url: `http://localhost:3000/1/boards/${boardId}`
    });
  });
});