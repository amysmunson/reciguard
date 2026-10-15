import { useEffect } from 'react';
import { prefetchResource } from './cache';
import { refreshAllCachedRecipes } from './recipeCache';
import { getFolders, getFolderMemberships } from './api/folders';
import { getFriendsWithMyName } from './api/friends';
import { getRecipe } from './api/recipes';

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
    quiet(prefetchResource('folders', userId, getFolders));
    quiet(prefetchResource('folderMembers', userId, getFolderMemberships));
    quiet(prefetchResource('friends', userId, () => getFriendsWithMyName(fallbackName)));
    quiet(refreshAllCachedRecipes(userId, getRecipe));
    // Once per user session; fallbackName only matters for the first run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
};
