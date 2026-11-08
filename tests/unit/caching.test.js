import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateCachedResource, readCachedResource, clearUserCache, applyCachingPreference } from '../../lib/app/cache';
import { cacheRecentRecipe, getCachedRecipe, removeCachedRecipes, RECENT_RECIPE_LIMIT } from '../../lib/app/recipeCache';
import { recordRecipeOpened } from '../../lib/app/storage';
import { isCachingEnabled, setCachingEnabled } from '../../lib/app/cachePreference';

const U = 'user-1';

beforeEach(async () => {
  await AsyncStorage.clear();
  await setCachingEnabled(true);
});

test(`recent-recipe cache keeps only the ${RECENT_RECIPE_LIMIT} most recently opened`, async () => {
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
    await recordRecipeOpened(U, id);
    await new Promise((r) => setTimeout(r, 2)); // distinct timestamps
    await cacheRecentRecipe(U, { id, name: id });
  }
  expect(await getCachedRecipe(U, 'a')).toBeNull();
  expect(await getCachedRecipe(U, 'b')).toBeNull();
  expect((await getCachedRecipe(U, 'g')).name).toBe('g');

  await removeCachedRecipes(U, ['g']);
  expect(await getCachedRecipe(U, 'g')).toBeNull();
});

test('turning caching off clears stored copies and stops new writes', async () => {
  await updateCachedResource('friendNames', U, () => ({ f1: { friend: { id: 'f1' } } }));
  await recordRecipeOpened(U, 'r1');
  await cacheRecentRecipe(U, { id: 'r1', name: 'Soup' });
  expect(await readCachedResource('friendNames', U)).toBeTruthy();

  await applyCachingPreference(false, U);
  expect(isCachingEnabled()).toBe(false);
  expect(await readCachedResource('friendNames', U)).toBeNull();
  expect(await getCachedRecipe(U, 'r1')).toBeNull();
  const keys = await AsyncStorage.getAllKeys();
  expect(keys.filter((k) => k.startsWith('cache:'))).toEqual([]);

  // New writes are skipped while off.
  await updateCachedResource('friendNames', U, () => ({ f2: {} }));
  await cacheRecentRecipe(U, { id: 'r1', name: 'Soup' });
  expect((await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('cache:'))).toEqual([]);

  // And resume when turned back on.
  await applyCachingPreference(true, U);
  await updateCachedResource('friendNames', U, () => ({ f3: {} }));
  expect(await readCachedResource('friendNames', U)).toEqual({ f3: {} });
});

test('clearUserCache removes every cache key for the user', async () => {
  await updateCachedResource('friendNames', U, () => ({ x: 1 }));
  await recordRecipeOpened(U, 'r1');
  await cacheRecentRecipe(U, { id: 'r1' });
  await clearUserCache(U);
  expect((await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('cache:'))).toEqual([]);
});
