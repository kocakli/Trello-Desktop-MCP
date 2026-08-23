import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TrelloClient } from './client.js';
import { insights } from '../utils/appInsights.js';

const API_KEY = 'SECRET_API_KEY_abcdef123456';
const TOKEN = 'SECRET_TOKEN_zyxwvu987654';

function withMockedFetch<T>(
  responder: (url: string, init: RequestInit) => Response,
  run: () => Promise<T>
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init: RequestInit = {}) => {
    return responder(String(url), init);
  }) as typeof fetch;

  return run().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

function withSpiedTrackDependency<T>(run: (calls: unknown[][]) => Promise<T>): Promise<T> {
  const calls: unknown[][] = [];
  const original = insights.trackDependency.bind(insights);
  insights.trackDependency = ((...args: unknown[]) => {
    calls.push(args);
    return (original as (...a: unknown[]) => void)(...args);
  }) as typeof insights.trackDependency;

  return run(calls).finally(() => {
    insights.trackDependency = original;
  });
}

test('successful requests never leak apiKey/token into telemetry dependency data', async () => {
  await withMockedFetch(
    () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
    () =>
      withSpiedTrackDependency(async calls => {
        const client = new TrelloClient({ apiKey: API_KEY, token: TOKEN });
        await client.getMyBoards();

        assert.equal(calls.length, 1);
        const data = calls[0]?.[2] as string;
        assert.ok(!data.includes(API_KEY), `dependency data leaked apiKey: ${data}`);
        assert.ok(!data.includes(TOKEN), `dependency data leaked token: ${data}`);
        assert.match(data, /\/members\/me\/boards/);
      })
  );
});

test('failed requests never leak apiKey/token into telemetry dependency data', async () => {
  await withMockedFetch(
    () => new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    () =>
      withSpiedTrackDependency(async calls => {
        const client = new TrelloClient({ apiKey: API_KEY, token: TOKEN });
        await assert.rejects(() => client.getMyBoards());

        assert.equal(calls.length, 1);
        const data = calls[0]?.[2] as string;
        assert.ok(!data.includes(API_KEY), `dependency data leaked apiKey: ${data}`);
        assert.ok(!data.includes(TOKEN), `dependency data leaked token: ${data}`);
      })
  );
});
