import { useAuth } from './auth-context';
import { getMyProfile, updateMyProfile } from './api/profile';
import { mutateCachedResource, useCachedResource } from '../app/cache';
import { appAlert } from '../app/dialog';

// High-contrast mode (profiles.contrast), shared by the Accessibility screen
// and Settings → Display so both switches always agree. The toggle is
// optimistic: it updates the cached profile first (every screen reading
// `profile` re-renders right away, including the other switch), then saves
// to Supabase, and reverts if the save fails.
export const useContrastSetting = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile, loading } = useCachedResource({
    resource: 'profile',
    userId,
    fetcher: getMyProfile,
  });
  const contrast = !!profile?.contrast;

  const toggleContrast = async () => {
    const next = !contrast;
    try {
      await mutateCachedResource('profile', userId, { ...(profile ?? {}), contrast: next });
      await updateMyProfile({ contrast: next });
    } catch (err) {
      if (profile) await mutateCachedResource('profile', userId, profile);
      appAlert('Could not update high-contrast mode', err.message ?? 'Unknown error');
    }
  };

  return { contrast, loading, toggleContrast };
};
