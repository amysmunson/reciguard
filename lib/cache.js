import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadJson, saveJson, removeKey } from './storage';

// Stale-while-revalidate cache layer. Screens render the previously persisted
// snapshot immediately while a fresh fetch runs in the background; mutations
// call invalidate(resource) to force any mounted hooks to refetch.

const listeners = new Map();

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

// Force any mounted hooks on this resource to refetch, and drop the on-disk
// snapshot so the next cold start doesn't briefly flash deleted data.
export const invalidate = async (resource, userId) => {
  if (userId) await removeKey(storageKey(resource, userId));
  const set = listeners.get(resource);
  if (set) for (const fn of set) fn();
};

export const useCachedResource = ({ resource, userId, fetcher, enabled = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const active = enabled && !!userId;
  const key = active ? storageKey(resource, userId) : null;

  const fetchAndStore = useCallback(async () => {
    if (!key) return;
    try {
      const next = await fetcherRef.current();
      setData(next);
      setError(null);
      saveJson(key, next);
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
    setLoading(true);
    setData(null);
    (async () => {
      const cached = await loadJson(key, null);
      if (!cancelled && cached != null) {
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
    return subscribe(resource, fetchAndStore);
  }, [active, resource, fetchAndStore]);

  // Refetch quietly each time the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      if (active) fetchAndStore();
    }, [active, fetchAndStore])
  );

  return { data, loading, error, refresh: fetchAndStore };
};
