import { TrelloClient } from '../src/trello/client';
import { jest } from '@jest/globals';

describe('TrelloClient with internal mock', () => {
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlString = url.toString();
      const urlObj = new URL(urlString);
      const urlPath = urlObj.pathname;
      const method = init?.method || 'GET';

      switch (`${method} ${urlPath}`) {
        case 'GET /1/members/me/boards':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'mockBoard1', name: 'Mock Board 1' },
              { id: 'mockBoard2', name: 'Mock Board 2' }
            ]),
            headers: new Headers()
          } as Response);

        case 'GET /1/boards/testBoardId':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'testBoardId',
              name: `Mock Board testBoardId`,
              desc: `Description for Mock Board testBoardId`,
              closed: false,
              url: `http://localhost:3000/1/boards/testBoardId`,
              lists: [{ id: 'list1', name: 'List 1' }],
              cards: [{ id: 'card1', name: 'Card 1' }]
            }),
            headers: new Headers()
          } as Response);

        case 'GET /1/boards/testBoardId/lists':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'mockList1', name: 'Mock List 1', idBoard: 'testBoardId' },
              { id: 'mockList2', name: 'Mock List 2', idBoard: 'testBoardId' }
            ]),
            headers: new Headers()
          } as Response);

        case 'POST /1/cards':
          const createCardBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'newCardId',
              name: createCardBody.name,
              desc: createCardBody.desc,
              idList: createCardBody.idList,
              shortUrl: 'http://mock.url/newCard'
            }),
            headers: new Headers()
          } as Response);

        case 'PUT /1/cards/cardToUpdate':
        case 'PUT /1/cards/cardToMove':
          const updateCardBody = JSON.parse(init?.body as string);
          const cardIdFromUrl = urlPath.split('/').pop();
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: cardIdFromUrl,
              name: updateCardBody.name || `Updated Card ${cardIdFromUrl}`,
              desc: updateCardBody.desc || `Updated Description for Card ${cardIdFromUrl}`,
              idList: updateCardBody.idList || 'mockListId',
              shortUrl: `http://mock.url/${cardIdFromUrl}`
            }),
            headers: new Headers()
          } as Response);

        case 'GET /1/cards/testCardId':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'testCardId',
              name: `Mock Card testCardId`,
              desc: `Description for Mock Card testCardId`,
              shortUrl: `http://mock.url/testCardId`,
              labels: [{ id: 'label1', name: 'Label 1' }],
              members: [{ id: 'member1', fullName: 'Member 1' }],
              checklists: [{ id: 'checklist1', name: 'Checklist 1' }],
              badges: { votes: 1, comments: 2 }
            }),
            headers: new Headers()
          } as Response);

        case 'DELETE /1/cards/cardToDelete':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
            headers: new Headers()
          } as Response);

        case 'GET /1/boards/testBoardId/members':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'member1', fullName: 'Board Member 1' },
              { id: 'member2', fullName: 'Board Member 2' }
            ]),
            headers: new Headers()
          } as Response);

        case 'GET /1/boards/testBoardId/labels':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'label1', name: 'Label 1', color: 'green' },
              { id: 'label2', name: 'Label 2', color: 'blue' }
            ]),
            headers: new Headers()
          } as Response);

        case 'GET /1/search':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              boards: [{ id: 'searchBoard1', name: 'Search Board 1' }],
              cards: [{ id: 'searchCard1', name: 'Search Card 1' }],
              members: [{ id: 'searchMember1', fullName: 'Search Member 1' }]
            }),
            headers: new Headers()
          } as Response);

        case 'GET /1/lists/testListId/cards':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'listCard1', name: 'List Card 1' },
              { id: 'listCard2', name: 'List Card 2' }
            ]),
            headers: new Headers()
          } as Response);

        case 'POST /1/cards/testCardId/actions/comments':
          const commentBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'newCommentId',
              data: { text: commentBody.text },
              type: 'commentCard',
              date: new Date().toISOString(),
              memberCreator: { id: 'memberCreatorId', fullName: 'Test User', username: 'testuser' }
            }),
            headers: new Headers()
          } as Response);

        case 'POST /1/lists':
          const createListBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'newListId',
              name: createListBody.name,
              idBoard: createListBody.idBoard,
              pos: createListBody.pos || 1,
              closed: false,
              subscribed: false
            }),
            headers: new Headers()
          } as Response);

        case 'GET /1/members/testMemberId':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'testMemberId',
              fullName: `Mock Member testMemberId`,
              username: `mockmembertestMemberId`,
              bio: 'Mock bio',
              url: 'mockurl',
              memberType: 'normal',
              confirmed: true,
              avatarUrl: 'mockavatarurl',
              initials: 'MM',
              boards: [], // Populate if needed for specific tests
              organizations: [] // Populate if needed for specific tests
            }),
            headers: new Headers()
          } as Response);

        case 'GET /1/members/me':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              id: 'me',
              fullName: `Mock Member me`,
              username: `mockmemberme`,
              bio: 'Mock bio',
              url: 'mockurl',
              memberType: 'normal',
              confirmed: true,
              avatarUrl: 'mockavatarurl',
              initials: 'MM',
              boards: [],
              organizations: []
            }),
            headers: new Headers()
          } as Response);

        case 'GET /1/boards/testBoardId/cards':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'boardCard1', name: 'Board Card 1' },
              { id: 'boardCard2', name: 'Board Card 2' }
            ]),
            headers: new Headers()
          } as Response);

        case 'GET /1/cards/testCardId/actions':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'action1', type: 'commentCard', date: new Date().toISOString(), memberCreator: { id: 'mc1', fullName: 'MC1', username: 'mc1' }, data: { text: 'Action Comment' } },
              { id: 'action2', type: 'updateCard', date: new Date().toISOString(), memberCreator: { id: 'mc2', fullName: 'MC2', username: 'mc2' }, data: { old: { name: 'old name' }, card: { id: 'card1', name: 'card name' } } }
            ]),
            headers: new Headers()
          } as Response);

        case 'GET /1/cards/testCardId/attachments':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'attach1', name: 'Attachment 1', url: 'http://attach1.url', mimeType: 'image/png', date: new Date().toISOString(), bytes: 100, isUpload: true, previews: [] },
              { id: 'attach2', name: 'Attachment 2', url: 'http://attach2.url', mimeType: 'application/pdf', date: new Date().toISOString(), bytes: 200, isUpload: false, previews: [] }
            ]),
            headers: new Headers()
          } as Response);

        case 'GET /1/cards/testCardId/checklists':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              { id: 'checklistA', name: 'Checklist A', pos: 1, checkItems: [{ id: 'item1', name: 'Item 1', state: 'complete', pos: 1, nameData: {} }] },
              { id: 'checklistB', name: 'Checklist B', pos: 2, checkItems: [{ id: 'item2', name: 'Item 2', state: 'incomplete', pos: 1, nameData: {} }] }
            ]),
            headers: new Headers()
          } as Response);

        default:
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ message: 'Not Found' }),
            headers: new Headers()
          } as Response);
      }
    });
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  const client = new TrelloClient({
    apiKey: 'dummy_key',
    token: 'dummy_token',
  });

  test('should fetch boards from the mocked API', async () => {
    const response = await client.getMyBoards();
    expect(response.data).toEqual([
      { id: 'mockBoard1', name: 'Mock Board 1' },
      { id: 'mockBoard2', name: 'Mock Board 2' }
    ]);
  });

  test('should fetch a specific board from the mocked API', async () => {
    const boardId = 'testBoardId';
    const response = await client.getBoard(boardId);
    expect(response.data.id).toBe(boardId);
    expect(response.data.name).toBe(`Mock Board ${boardId}`);
  });

  test('should fetch board lists from the mocked API', async () => {
    const boardId = 'testBoardId';
    const response = await client.getBoardLists(boardId);
    expect(response.data).toEqual([
      { id: 'mockList1', name: 'Mock List 1', idBoard: boardId },
      { id: 'mockList2', name: 'Mock List 2', idBoard: boardId }
    ]);
  });

  test('should create a card via the mocked API', async () => {
    const cardData = { name: 'New Test Card', idList: 'testListId' };
    const response = await client.createCard(cardData);
    expect(response.data.name).toBe(cardData.name);
    expect(response.data.idList).toBe(cardData.idList);
    expect(response.data.id).toBe('newCardId');
  });

  test('should update a card via the mocked API', async () => {
    const cardId = 'cardToUpdate';
    const updates = { name: 'Updated Card Name', desc: 'New Description' };
    const response = await client.updateCard(cardId, updates);
    expect(response.data.id).toBe(cardId);
    expect(response.data.name).toBe(updates.name);
    expect(response.data.desc).toBe(updates.desc);
  });

  test('should move a card via the mocked API', async () => {
    const cardId = 'cardToMove';
    const moveData = { idList: 'newListId' };
    const response = await client.moveCard(cardId, moveData);
    expect(response.data.id).toBe(cardId);
    expect(response.data.idList).toBe(moveData.idList);
  });

  test('should fetch a specific card from the mocked API', async () => {
    const cardId = 'testCardId';
    const response = await client.getCard(cardId);
    expect(response.data.id).toBe(cardId);
    expect(response.data.name).toBe(`Mock Card ${cardId}`);
  });

  test('should delete a card via the mocked API', async () => {
    const cardId = 'cardToDelete';
    const response = await client.deleteCard(cardId);
    expect(response.data).toEqual({});
  });

  test('should fetch board members from the mocked API', async () => {
    const boardId = 'testBoardId';
    const response = await client.getBoardMembers(boardId);
    expect(response.data).toEqual([
      { id: 'member1', fullName: 'Board Member 1' },
      { id: 'member2', fullName: 'Board Member 2' }
    ]);
  });

  test('should fetch board labels from the mocked API', async () => {
    const boardId = 'testBoardId';
    const response = await client.getBoardLabels(boardId);
    expect(response.data).toEqual([
      { id: 'label1', name: 'Label 1', color: 'green' },
      { id: 'label2', name: 'Label 2', color: 'blue' }
    ]);
  });

  test('should perform a search via the mocked API', async () => {
    const query = 'test query';
    const response = await client.search(query);
    expect(response.data.boards).toEqual([{ id: 'searchBoard1', name: 'Search Board 1' }]);
    expect(response.data.cards).toEqual([{ id: 'searchCard1', name: 'Search Card 1' }]);
    expect(response.data.members).toEqual([{ id: 'searchMember1', fullName: 'Search Member 1' }]);
  });

  test('should fetch list cards from the mocked API', async () => {
    const listId = 'testListId';
    const response = await client.getListCards(listId);
    expect(response.data).toEqual([
      { id: 'listCard1', name: 'List Card 1' },
      { id: 'listCard2', name: 'List Card 2' }
    ]);
  });

  test('should add a comment to a card via the mocked API', async () => {
    const cardId = 'testCardId';
    const commentText = 'This is a test comment.';
    const response = await client.addCommentToCard(cardId, commentText);
    expect(response.data.data.text).toBe(commentText);
  });

  test('should create a list via the mocked API', async () => {
    const listData = { name: 'New Test List', idBoard: 'testBoardId' };
    const response = await client.createList(listData);
    expect(response.data.name).toBe(listData.name);
    expect(response.data.idBoard).toBe(listData.idBoard);
    expect(response.data.id).toBe('newListId');
  });

  test('should fetch a specific member from the mocked API', async () => {
    const memberId = 'testMemberId';
    const response = await client.getMember(memberId);
    expect(response.data.id).toBe(memberId);
    expect(response.data.fullName).toBe(`Mock Member ${memberId}`);
  });

  test('should fetch the current user from the mocked API', async () => {
    const response = await client.getCurrentUser();
    expect(response.data.id).toBe('me');
    expect(response.data.fullName).toBe(`Mock Member me`);
  });

  test('should fetch board cards from the mocked API', async () => {
    const boardId = 'testBoardId';
    const response = await client.getBoardCards(boardId);
    expect(response.data).toEqual([
      { id: 'boardCard1', name: 'Board Card 1' },
      { id: 'boardCard2', name: 'Board Card 2' }
    ]);
  });

  test('should fetch card actions from the mocked API', async () => {
    const cardId = 'testCardId';
    const response = await client.getCardActions(cardId);
    expect(response.data[0].type).toBe('commentCard');
    expect(response.data[1].type).toBe('updateCard');
  });

  test('should fetch card attachments from the mocked API', async () => {
    const cardId = 'testCardId';
    const response = await client.getCardAttachments(cardId);
    expect(response.data[0].name).toBe('Attachment 1');
    expect(response.data[1].name).toBe('Attachment 2');
  });

  test('should fetch card checklists from the mocked API', async () => {
    const cardId = 'testCardId';
    const response = await client.getCardChecklists(cardId);
    expect(response.data[0].name).toBe('Checklist A');
    expect(response.data[1].name).toBe('Checklist B');
  });
});
