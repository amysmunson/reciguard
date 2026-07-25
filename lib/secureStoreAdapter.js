// SecureStore-backed storage adapter for Supabase's auth session, so the
// access/refresh token live in the OS Keychain (iOS) / Keystore-backed
// storage (Android) instead of plain AsyncStorage.
//
// SecureStore rejects any single value over ~2048 bytes, and a Supabase
// session (access token + refresh token + user metadata as JSON) can get
// close to or over that, so values are split across multiple SecureStore
// items and reassembled on read.
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const chunkKey = (key, i) => `${key}.c${i}`;
const countKey = (key) => `${key}.n`;

export const SecureStoreAdapter = {
  getItem: async (key) => {
    const countRaw = await SecureStore.getItemAsync(countKey(key));
    if (countRaw == null) return null;
    const count = parseInt(countRaw, 10);
    if (!Number.isFinite(count) || count < 1) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i)))
    );
    if (chunks.some((c) => c == null)) return null;
    return chunks.join('');
  },

  setItem: async (key, value) => {
    const prevCountRaw = await SecureStore.getItemAsync(countKey(key));
    const prevCount = prevCountRaw ? parseInt(prevCountRaw, 10) : 0;

    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    if (!chunks.length) chunks.push('');

    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)));
    // Drop leftover chunks from a previous, longer value stored at this key.
    if (prevCount > chunks.length) {
      await Promise.all(
        Array.from({ length: prevCount - chunks.length }, (_, i) =>
          SecureStore.deleteItemAsync(chunkKey(key, chunks.length + i))
        )
      );
    }
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  },

  removeItem: async (key) => {
    const countRaw = await SecureStore.getItemAsync(countKey(key));
    const count = countRaw ? parseInt(countRaw, 10) : 0;
    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i)))
    );
    await SecureStore.deleteItemAsync(countKey(key));
  },
};
