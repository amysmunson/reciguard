import { useSyncExternalStore } from 'react';
import { loadJson, saveJson } from './storage';

// Settings → "Keep copies on this device". When on (the default), the app
// keeps copies of your data on the device (lib/app/cache.js snapshots and the
// recent-recipe cache in lib/app/recipeCache.js) so screens paint instantly and
// recent recipes open offline. When off, nothing is written or read there:
// every screen loads from the server, and turning it off clears what's
// stored (applyCachingPreference in lib/app/cache.js).
//
// Both cache modules read and write through loadCached / saveCached below,
// so this file is the single switch. Preferences (sort, filters, theme,
// recently-opened times) aren't cached copies and aren't affected.
//
// Stored per device (not per account), like the theme choice, so it stays
// off across sign-out.

const CACHING_ENABLED_KEY = 'app.cachingEnabled';

let enabled = true;
const listeners = new Set();
const emit = () => {
  for (const fn of listeners) fn();
};

// Loaded once at startup; cache reads/writes wait for it so a cache-off
// device never reads stale copies before the setting is known.
const ready = loadJson(CACHING_ENABLED_KEY, true).then((saved) => {
  enabled = saved !== false;
  emit();
});

export const cachingReady = () => ready;
export const isCachingEnabled = () => enabled;

export const setCachingEnabled = async (next) => {
  await ready;
  enabled = !!next;
  emit();
  await saveJson(CACHING_ENABLED_KEY, enabled);
};

export const useCachingEnabled = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => enabled
  );

// Cache-key reads/writes. With caching off, reads return the fallback and
// writes are skipped (checked at write time, so an in-flight fetch that
// finishes after caching was turned off doesn't write anything back).
export const loadCached = async (key, fallback = null) => {
  await ready;
  return enabled ? loadJson(key, fallback) : fallback;
};

export const saveCached = async (key, value) => {
  await ready;
  if (enabled) await saveJson(key, value);
};
