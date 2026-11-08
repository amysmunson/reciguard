import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { removeKey } from './storage';
import { loadCached, saveCached, setCachingEnabled } from './cachePreference';
import { clearCachedRecipes } from './recipeCache';

// Stale-while-revalidate cache layer. Screens render the previously persisted
// snapshot immediately while a fresh fetch runs quietly in the background;
// the screen (and the on-disk snapshot) only updates if the server's data
// actually differs. Mutations call invalidate(resource) to force any mounted
// hooks to refetch. All disk reads/writes go through loadCached/saveCached
// (lib/app/cachePreference.js), so with Settings → "Keep copies on this device"
// off, hooks still fetch and share data in memory but nothing is stored.

const listeners = new Map();

const notify = (resource, nextData) => {
  const set = listeners.get(resource);
  if (set) for (const fn of set) fn(nextData);
};

const subscribe = (resource, fn) => {
  if (!listeners.has(resource)) listeners.set(resource, new Set());
  listeners.get(resource).add(fn);
  return () => {
    const set = listeners.get(resource);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) listeners.delete(resource);
  };
};

const storageKey = (resource, userId) => `cache:${resource}:${userId ?? 'anon'}`;

// Every resource name currently passed to useCachedResource/
// mutateCachedResource. Keep in sync when a screen starts caching a new one.
const CACHED_RESOURCES = [
  'profile',
  'recipes',
  'folders',
  'folderMembers',
  'friends',
  'friendNames',
  // Legacy (full friend profiles from earlier builds) — still listed so
  // sign-out / clearing removes it from devices that have it.
  'friendProfiles',
];

// Serialized form used to tell whether fresh data differs from what's shown.
const toJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

// Reads a resource's on-disk snapshot without subscribing — for screens that
// only want a first paint from data another screen cached (e.g. FolderDetail
// from Home's recipe list, FriendProfile from the friends list).
export const readCachedResource = async (resource, userId) =>
  userId ? loadCached(storageKey(resource, userId), null) : null;

// Read-modify-write of a snapshot that no hook subscribes to (e.g. the
// per-friend 'friendNames' map FriendProfile keeps). `updater` gets the
// current value (or null) and returns the new one.
export const updateCachedResource = async (resource, userId, updater) => {
  if (!userId) return;
  const key = storageKey(resource, userId);
  await saveCached(key, updater(await loadCached(key, null)));
};

// Deletes one resource's snapshot (always, even with caching off — removing
// data is never gated).
export const removeCachedResource = async (resource, userId) => {
  if (userId) await removeKey(storageKey(resource, userId));
};

// Fetches a resource in the background and, only if it changed, saves the new
// snapshot and pushes it to any mounted hooks. Used to warm caches on app
// launch (lib/server/useCacheWarmup.js). Throws on fetch failure; callers decide
// whether to stay quiet.
export const prefetchResource = async (resource, userId, fetcher) => {
  if (!userId) return;
  const key = storageKey(resource, userId);
  const [prev, next] = await Promise.all([loadCached(key, null), fetcher()]);
  if (toJson(prev) === toJson(next)) return;
  await saveCached(key, next);
  notify(resource, next);
};

// Wipes every on-disk resource snapshot for a signed-out/deleted user.
export const clearUserCache = async (userId) => {
  if (!userId) return;
  await Promise.all([
    ...CACHED_RESOURCES.map((resource) => removeKey(storageKey(resource, userId))),
    clearCachedRecipes(userId),
  ]);
};

// Settings toggle. Turning caching off also deletes this user's stored
// copies right away; turning it back on lets them rebuild as screens load.
export const applyCachingPreference = async (enabled, userId) => {
  // Clear first, then switch off, so nothing is left behind.
  if (!enabled) await clearUserCache(userId);
  await setCachingEnabled(enabled);
};

// Force any mounted hooks on this resource to refetch, and drop the on-disk
// snapshot so the next cold start doesn't briefly flash deleted data.
export const invalidate = async (resource, userId) => {
  if (userId) await removeKey(storageKey(resource, userId));
  notify(resource);
};

export const mutateCachedResource = async (resource, userId, nextData) => {
  if (!userId) return nextData;
  const key = storageKey(resource, userId);
  await saveCached(key, nextData);
  notify(resource, nextData);
  return nextData;
};

export const useCachedResource = ({ resource, userId, fetcher, enabled = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // JSON of what's currently shown, so an identical refetch is a no-op (no
  // re-render, no disk write). fetchedRef stops a slow disk read from
  // overwriting a fresher server result.
  const shownJsonRef = useRef(null);
  const fetchedRef = useRef(false);

  const active = enabled && !!userId;
  const key = active ? storageKey(resource, userId) : null;

  const fetchAndStore = useCallback(async () => {
    if (!key) return;
    try {
      const next = await fetcherRef.current();
      fetchedRef.current = true;
      setError(null);
      const json = toJson(next);
      if (json === null || json !== shownJsonRef.current) {
        shownJsonRef.current = json;
        setData(next);
        saveCached(key, next);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  // Hydrate from disk on mount / key change so the UI paints instantly.
  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    shownJsonRef.current = null;
    fetchedRef.current = false;
    setLoading(true);
    setData(null);
    (async () => {
      const cached = await loadCached(key, null);
      if (!cancelled && cached != null && !fetchedRef.current) {
        shownJsonRef.current = toJson(cached);
        setData(cached);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Subscribe to invalidation events from mutations.
  useEffect(() => {
    if (!active) return;
    return subscribe(resource, (nextData) => {
      if (typeof nextData !== 'undefined') {
        shownJsonRef.current = toJson(nextData);
        setData(nextData);
        setError(null);
        setLoading(false);
        return;
      }
      fetchAndStore();
    });
  }, [active, resource, fetchAndStore]);

  // Refetch quietly each time the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      if (active) fetchAndStore();
    }, [active, fetchAndStore])
  );

  return { data, loading, error, refresh: fetchAndStore };
};
