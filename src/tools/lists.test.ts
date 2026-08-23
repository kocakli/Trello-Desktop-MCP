import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleUpdateList } from './lists.js';

const LIST_ID = 'a'.repeat(24);
const BOARD_ID = 'b'.repeat(24);

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

test('handleUpdateList PUTs only the provided fields and formats the response', async () => {
  await withMockedFetch(
    () =>
      new Response(
        JSON.stringify({
          id: LIST_ID,
          name: 'Renamed list',
          idBoard: BOARD_ID,
          pos: 12345,
          closed: false,
          subscribed: false
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      ),
    async calls => {
      const result = await handleUpdateList({
        apiKey: 'key',
        token: 'tok',
        listId: LIST_ID,
        name: 'Renamed list',
        closed: false
      });

      assert.equal(calls.length, 1);
      assert.match(calls[0].url, new RegExp(`/lists/${LIST_ID}\\?`));
      assert.equal(calls[0].init.method, 'PUT');
      assert.deepEqual(JSON.parse(calls[0].init.body as string), {
        name: 'Renamed list',
        closed: false
      });

      const parsed = JSON.parse((result as any).content[0].text);
      assert.equal(parsed.summary, 'Updated list: Renamed list');
      assert.equal(parsed.list.id, LIST_ID);
      assert.equal(parsed.list.closed, false);
    }
  );
});

test('handleUpdateList rejects a malformed listId without calling the API', async () => {
  await withMockedFetch(
    () => {
      throw new Error('fetch should not be called for invalid input');
    },
    async calls => {
      const result = await handleUpdateList({
        apiKey: 'key',
        token: 'tok',
        listId: 'not-an-id',
        name: 'x'
      });

      assert.equal(calls.length, 0);
      assert.equal((result as any).isError, true);
      assert.match((result as any).content[0].text, /Invalid list ID format/);
    }
  );
});
