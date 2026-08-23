import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleTrelloGetMember } from './members.js';

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

test('handleTrelloGetMember rejects a memberId that would inject extra path/query segments', async () => {
  await withMockedFetch(
    () => {
      throw new Error('fetch should not be called for invalid input');
    },
    async calls => {
      const result = await handleTrelloGetMember({
        apiKey: 'key',
        token: 'tok',
        memberId: 'me/tokens?fields=all'
      });

      assert.equal(calls.length, 0);
      assert.equal((result as any).isError, true);
      assert.match((result as any).content[0].text, /Invalid member ID format/);
    }
  );
});

test('handleTrelloGetMember accepts "me" and calls the API', async () => {
  await withMockedFetch(
    () =>
      new Response(JSON.stringify({ id: 'abc', username: 'me', fullName: 'Me' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }),
    async calls => {
      const result = await handleTrelloGetMember({
        apiKey: 'key',
        token: 'tok',
        memberId: 'me'
      });

      assert.equal(calls.length, 1);
      assert.match(calls[0]!.url, /\/members\/me\?/);
      assert.equal((result as any).isError, undefined);
    }
  );
});

test('handleTrelloGetMember accepts a valid 24-char Trello ID', async () => {
  const MEMBER_ID = 'a'.repeat(24);
  await withMockedFetch(
    () =>
      new Response(JSON.stringify({ id: MEMBER_ID, username: 'someone' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }),
    async calls => {
      const result = await handleTrelloGetMember({
        apiKey: 'key',
        token: 'tok',
        memberId: MEMBER_ID
      });

      assert.equal(calls.length, 1);
      assert.match(calls[0]!.url, new RegExp(`/members/${MEMBER_ID}\\?`));
      assert.equal((result as any).isError, undefined);
    }
  );
});
