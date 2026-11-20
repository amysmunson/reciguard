// Static checks over the app source that ships in the bundle.
const { appSourceFiles, read } = require('../helpers/repoFiles');

const filesMatching = (re) => appSourceFiles().filter((f) => re.test(read(f)));

test('no eval or dynamic code construction', () => {
  expect(filesMatching(/\beval\s*\(|new Function\s*\(/)).toEqual([]);
});

test('no console logging in app code (could leak tokens, profiles, or dietary data)', () => {
  // The single allowed warning is the missing-config notice in lib/server/supabase.js.
  const offenders = appSourceFiles().filter((f) => {
    const hits = read(f).match(/console\.(log|info|debug|warn|error|trace)\s*\(/g) ?? [];
    return f === 'lib/server/supabase.js' ? hits.length > 1 : hits.length > 0;
  });
  expect(offenders).toEqual([]);
});

test('every network request goes through the Supabase client or to a user-chosen recipe URL', () => {
  // connectivity.js only wraps the Supabase client's own fetch (trackedFetch).
  const fetchers = filesMatching(/\bfetch\s*\(/);
  expect(fetchers.sort()).toEqual(['lib/server/connectivity.js', 'lib/server/recipeUrlParser.js']);
  expect(read('lib/server/supabase.js')).toMatch(/global:\s*\{\s*fetch:\s*trackedFetch\s*\}/);
});

test('no background polling: connectivity never schedules requests', () => {
  const src = read('lib/server/connectivity.js');
  // setTimeout is only the per-request time limit; nothing repeats or
  // listens for the app coming to the foreground.
  expect(src).not.toMatch(/setInterval|AppState/);
  // The only fetch is the shared, time-limited one (trackedFetch / pingServer).
  expect(src.match(/\bfetch\s*\(/g)).toHaveLength(1);
});

test('the quick reachability ping sends no user data — only the public key, over HTTPS', async () => {
  const { pingServer } = require('../../lib/server/connectivity');
  global.fetch = jest.fn(async () => ({ status: 200 }));
  await pingServer();
  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toBe('https://example.supabase.co/auth/v1/health');
  expect(Object.keys(init.headers)).toEqual(['apikey']);
  expect(init.body).toBeUndefined();
});

test('the auth session is never written to AsyncStorage by app code', () => {
  // Session storage goes through lib/server/secureStoreAdapter.js only.
  expect(filesMatching(/AsyncStorage[\s\S]{0,80}(session|access_token|refresh_token)/i)).toEqual([]);
});
