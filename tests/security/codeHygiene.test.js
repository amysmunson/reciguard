// Static checks over the app source that ships in the bundle.
const { appSourceFiles, read } = require('../helpers/repoFiles');
import { checkConnection } from '../../lib/server/connectivity';

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

test('every network request goes to the Supabase client, the health check, or a user-chosen recipe URL', () => {
  const fetchers = filesMatching(/\bfetch\s*\(/);
  expect(fetchers.sort()).toEqual(['lib/server/connectivity.js', 'lib/server/recipeUrlParser.js']);
});

test('the connectivity check sends no user data — only the public key, over HTTPS', async () => {
  global.fetch = jest.fn(async () => ({ status: 200 }));
  await checkConnection();
  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toBe('https://example.supabase.co/auth/v1/health');
  expect(Object.keys(init.headers)).toEqual(['apikey']);
  expect(init.body).toBeUndefined();
});

test('the auth session is never written to AsyncStorage by app code', () => {
  // Session storage goes through lib/server/secureStoreAdapter.js only.
  expect(filesMatching(/AsyncStorage[\s\S]{0,80}(session|access_token|refresh_token)/i)).toEqual([]);
});
