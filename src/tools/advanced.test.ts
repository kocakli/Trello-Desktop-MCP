import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleTrelloCreateChecklist, handleTrelloAddChecklistItem } from './advanced.js';

const CARD_ID = 'c'.repeat(24);
const CHECKLIST_ID = 'd'.repeat(24);

function withMockedFetch<T>(
  responder: (url: string, init: RequestInit) => Response,
  run: (calls: { url: string; init: RequestInit }[]) => Promise<T>
): Promise<T> {
  const calls: { url: string; init: RequestInit }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    return responder(String(url), init);
  }) as typeof fetch;

  return run(calls).finally(() => {
    globalThis.fetch = originalFetch;
  });
}

test('handleTrelloCreateChecklist POSTs idCard/name and formats the response', async () => {
  await withMockedFetch(
    () =>
      new Response(
        JSON.stringify({
          id: CHECKLIST_ID,
          name: 'Launch steps',
          idBoard: 'b'.repeat(24),
          idCard: CARD_ID,
          pos: 16384,
          checkItems: []
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      ),
    async calls => {
      const result = await handleTrelloCreateChecklist({
        apiKey: 'key',
        token: 'tok',
        idCard: CARD_ID,
        name: 'Launch steps'
      });

      assert.equal(calls.length, 1);
      assert.match(calls[0]!.url, /\/checklists\?/);
      assert.equal(calls[0]!.init.method, 'POST');
      assert.deepEqual(JSON.parse(calls[0]!.init.body as string), {
        idCard: CARD_ID,
        name: 'Launch steps'
      });

      const parsed = JSON.parse((result as any).content[0].text);
      assert.equal(parsed.summary, 'Created checklist: Launch steps');
      assert.equal(parsed.checklist.id, CHECKLIST_ID);
      assert.equal(parsed.checklist.cardId, CARD_ID);
    }
  );
});

test('handleTrelloCreateChecklist rejects a malformed idCard without calling the API', async () => {
  await withMockedFetch(
    () => {
      throw new Error('fetch should not be called for invalid input');
    },
    async calls => {
      const result = await handleTrelloCreateChecklist({
        apiKey: 'key',
        token: 'tok',
        idCard: 'not-an-id',
        name: 'Launch steps'
      });

      assert.equal(calls.length, 0);
      assert.equal((result as any).isError, true);
      assert.match((result as any).content[0].text, /Invalid card ID format/);
    }
  );
});

test('handleTrelloAddChecklistItem POSTs name/checked and formats the response', async () => {
  await withMockedFetch(
    () =>
      new Response(
        JSON.stringify({
          id: 'e'.repeat(24),
          name: 'Ship it',
          state: 'incomplete',
          pos: 16384,
          due: null,
          idMember: null
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      ),
    async calls => {
      const result = await handleTrelloAddChecklistItem({
        apiKey: 'key',
        token: 'tok',
        idChecklist: CHECKLIST_ID,
        name: 'Ship it',
        checked: false
      });

      assert.equal(calls.length, 1);
      assert.match(calls[0]!.url, new RegExp(`/checklists/${CHECKLIST_ID}/checkItems\\?`));
      assert.equal(calls[0]!.init.method, 'POST');
      assert.deepEqual(JSON.parse(calls[0]!.init.body as string), {
        name: 'Ship it',
        checked: false
      });

      const parsed = JSON.parse((result as any).content[0].text);
      assert.equal(parsed.summary, 'Added check item: Ship it');
      assert.equal(parsed.checkItem.state, 'incomplete');
    }
  );
});

test('handleTrelloAddChecklistItem rejects a malformed idChecklist without calling the API', async () => {
  await withMockedFetch(
    () => {
      throw new Error('fetch should not be called for invalid input');
    },
    async calls => {
      const result = await handleTrelloAddChecklistItem({
        apiKey: 'key',
        token: 'tok',
        idChecklist: 'not-an-id',
        name: 'Ship it'
      });

      assert.equal(calls.length, 0);
      assert.equal((result as any).isError, true);
      assert.match((result as any).content[0].text, /Invalid checklist ID format/);
    }
  );
});
