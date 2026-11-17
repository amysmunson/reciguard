import { useAuth } from './auth-context';
import { getMyProfile, isDeviceOnlyFlag, saveDeviceFlag, setMyProfileFlags } from './api/profile';
import { mutateCachedResource, useCachedResource } from '../app/cache';
import { alertSaveFailed } from './connectivity';

// An on/off Settings switch stored on the profile (profiles.contrast,
// profiles.hide_unsafe_recipes). Built to feel instant:
//   - The switch flips immediately: the cached profile is updated first, so
//     every screen reading it re-renders (the other copy of the switch, the
//     recipe lists, the contrast styling) before any network request.
//   - The save is one small request (setMyProfileFlags: no getUser round
//     trip, no response body, no refetch).
//   - Quick repeated taps don't pile up requests or land out of order: one
//     write per field runs at a time, and when it finishes, only the latest
//     value is sent next.
// If the save fails, the switch goes back to the last saved value, with one
// "not saved" popup.
//
// If the field's column doesn't exist on the server yet (its migration hasn't
// been run), getMyProfile marks it device-only and the switch saves on the
// device instead, with no request.

const writers = {}; // per field: { running, wanted, saved }

const saveLatest = async (field, userId) => {
  const w = writers[field];
  if (w.running) return;
  w.running = true;
  try {
    while (w.wanted !== w.saved) {
      const value = w.wanted;
      await setMyProfileFlags({ [field]: value });
      w.saved = value;
    }
  } catch (err) {
    // Put the cached profile back to what the server has.
    w.wanted = w.saved;
    w.onFail?.(err, w.saved);
  } finally {
    w.running = false;
  }
};

export const useProfileToggle = (field, failTitle = 'Could not change this setting') => {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile } = useCachedResource({
    resource: 'profile',
    userId,
    fetcher: getMyProfile,
  });
  const value = !!profile?.[field];
  // Needs the profile (from the device cache, normally instant) so the
  // optimistic update has the rest of the profile to keep.
  const ready = !!userId && profile != null;

  const toggle = () => {
    if (!ready) return;
    const next = !value;
    if (isDeviceOnlyFlag(profile, field)) {
      mutateCachedResource('profile', userId, { ...profile, [field]: next });
      saveDeviceFlag(field, userId, next);
      return;
    }
    const w = (writers[field] ??= { running: false, wanted: value, saved: value });
    if (!w.running) w.saved = value; // the value on screen is the saved one
    w.wanted = next;
    w.onFail = (err, savedValue) => {
      mutateCachedResource('profile', userId, { ...profile, [field]: savedValue });
      alertSaveFailed(err, failTitle);
    };
    mutateCachedResource('profile', userId, { ...profile, [field]: next });
    saveLatest(field, userId);
  };

  return { value, ready, toggle };
};

// Test helper: forget pending write state between tests.
export const resetProfileToggles = () => {
  for (const key of Object.keys(writers)) delete writers[key];
};
