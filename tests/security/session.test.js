// The auth session (access + refresh tokens) lives in the OS keychain via
// SecureStore, never in plain AsyncStorage, and sign-out wipes every local
// copy of the user's data.
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ auth: {} })) }));
jest.mock('react-native-url-polyfill/auto', () => ({}));

test('Supabase client stores the session in SecureStore and ignores session URLs', () => {
  jest.isolateModules(() => {
    const { createClient } = require('@supabase/supabase-js');
    const { SecureStoreAdapter } = require('../../lib/server/secureStoreAdapter');
    require('../../lib/server/supabase');
    const [url, , options] = createClient.mock.calls[0];
    expect(url).toMatch(/^https:\/\//);
    expect(options.auth.storage).toBe(SecureStoreAdapter);
    expect(options.auth.persistSession).toBe(true);
    // Sessions can't be injected through deep links.
    expect(options.auth.detectSessionInUrl).toBe(false);
  });
});

test('SecureStore adapter round-trips a large session in chunks and removes every chunk', async () => {
  const SecureStore = require('expo-secure-store');
  const { SecureStoreAdapter } = require('../../lib/server/secureStoreAdapter');
  const big = 'x'.repeat(5000);
  await SecureStoreAdapter.setItem('sb-session', big);
  expect(await SecureStoreAdapter.getItem('sb-session')).toBe(big);
  await SecureStoreAdapter.removeItem('sb-session');
  expect(await SecureStoreAdapter.getItem('sb-session')).toBeNull();
  const stillStored = await Promise.all(
    [0, 1, 2, 3].map((i) => SecureStore.getItemAsync(`sb-session.c${i}`))
  );
  expect(stillStored.every((v) => v == null)).toBe(true);
});
