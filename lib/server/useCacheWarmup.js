import { useEffect } from 'react';
import { mutateCachedResource, prefetchResource, removeCachedResource } from '../app/cache';
import { loadJson, removeKey, KEYS } from '../app/storage';
import { refreshAllCachedRecipes } from '../app/recipeCache';
import { cachingReady, isCachingEnabled } from '../app/cachePreference';
import { getFolders } from './api/folders';
import { getMyProfile, isDeviceOnlyFlag, setMyProfileFlags } from './api/profile';
import { getFriendsWithMyName, purgeLegacyFriendProfiles } from './api/friends';
import { getRecipe } from './api/recipes';

// "Hide recipes with dietary conflicts" used to be saved only on the device.
// It's on the profile now (profiles.hide_unsafe_recipes), once
// supabase/profiles_add_hide_unsafe_recipes.sql has been run:
//   - Column not there yet: the device copy is still the setting itself
//     (getMyProfile reads it from there), so it's kept.
//   - Column there: an "on" is copied up once, then the device copy is
//     removed. If the save fails (offline), it's kept and retried next launch.
export const migrateHideUnsafeToProfile = async (userId) => {
  const key = KEYS.hideUnsafeRecipes(userId);
  const legacy = await loadJson(key, null);
  if (legacy == null) return;
  const profile = await getMyProfile();
  if (!profile || isDeviceOnlyFlag(profile, 'hide_unsafe_recipes')) return;
  if (legacy === true && !profile.hide_unsafe_recipes) {
    await setMyProfileFlags({ hide_unsafe_recipes: true });
    await mutateCachedResource('profile', userId, { ...profile, hide_unsafe_recipes: true });
  }
  await removeKey(key);
};

// Runs once per signed-in session (app launch or sign-in): quietly refreshes
// the caches of screens the user hasn't opened yet, so every tab paints
// current data from cache and the recently opened recipes are fresh before
// the user goes offline. Home fetches recipes + profile itself on launch, so
// they aren't repeated here. Each refresh only writes (and re-renders mounted
// screens) if the server's data changed. Failures are silent — screens still
// refetch when opened.
export const useCacheWarmup = (user) => {
  const userId = user?.id;
  const fallbackName = user?.email || 'you';

  useEffect(() => {
    if (!userId) return;
    const quiet = (promise) => promise.catch(() => {});
    // Remove full friend profiles cached by earlier builds (always — this is
    // a deletion, so it runs even with caching off).
    quiet(purgeLegacyFriendProfiles(userId));
    // Earlier builds also cached which recipes were in each folder; only the
    // folder list is cached now.
    quiet(removeCachedResource('folderMembers', userId));
    quiet(migrateHideUnsafeToProfile(userId));
    (async () => {
      // Nothing to warm when Settings → "Keep copies on this device" is off.
      await cachingReady();
      if (!isCachingEnabled()) return;
      quiet(prefetchResource('folders', userId, getFolders));
      quiet(prefetchResource('friends', userId, () => getFriendsWithMyName(fallbackName)));
      quiet(refreshAllCachedRecipes(userId, getRecipe));
    })();
    // Once per user session; fallbackName only matters for the first run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
};
