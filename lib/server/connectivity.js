import { useSyncExternalStore } from 'react';
import { appAlert } from '../app/dialog';

// Server reachability, shared app-wide, learned only from requests the app
// already makes. There is no polling or health ping: every Supabase request
// goes through `trackedFetch` (wired into the client in supabase.js). One
// that reaches the server marks the app online; one that can't marks it
// offline. So the offline banner appears on the first failed load or save,
// and clears on the next request that gets through: pull-to-refresh, opening
// a recipe, coming back to a screen, and so on.
//
// Popups follow two rules:
//   - Automatic loads (screen open/focus, background refresh, pull-to-refresh)
//     never alert for a connection failure. The banner already says so.
//     Use alertLoadFailed.
//   - Taps that need the server (save, delete, add, sign in) get one popup.
//     Use alertSaveFailed (changes weren't saved) or alertActionFailed.

let online = true; // optimistic until a request says otherwise
const listeners = new Set();

const setOnline = (next) => {
  if (next === online) return;
  online = next;
  for (const fn of listeners) fn();
};

// fetch for the Supabase client. A response below 500 means the server was
// reached and is working; a 5xx (server up but broken, e.g. a paused
// project) or a network failure counts as offline. Requests the app cancels
// on purpose don't change the status.
export const trackedFetch = async (input, init) => {
  try {
    const res = await fetch(input, init);
    setOnline(res.status < 500);
    return res;
  } catch (err) {
    if (err?.name !== 'AbortError') setOnline(false);
    throw err;
  }
};

export const isOnline = () => online;

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Live online/offline status for a component.
export const useIsOnline = () => useSyncExternalStore(subscribe, isOnline);

// Matches the errors fetch / supabase-js produce when the request never
// reached the server.
const NETWORK_ERROR_RE = /network request failed|failed to fetch|network ?error|fetch failed|timed? ?out|aborted/i;

const isNetworkError = (err) =>
  NETWORK_ERROR_RE.test(err?.message ?? '') || err?.name === 'AuthRetryableFetchError';

// True when a failure was down to connectivity. Offline failures don't
// always look like network errors (e.g. the auth check surfaces as "Not
// signed in"), so this also uses the status the failed request just set.
export const isOfflineError = (err) => isNetworkError(err) || !online;

const OFFLINE_TITLE = "You're offline";

// Automatic load failed. Silent when offline (the banner covers it); a real
// server error still gets one alert.
export const alertLoadFailed = (err, title = 'Could not load') => {
  if (isOfflineError(err)) return;
  appAlert(title, err?.message ?? 'Unknown error');
};

// A tap that needed the server failed (nothing to "unsave", e.g. opening
// the folder picker, linking a friend, signing in).
export const alertActionFailed = (err, title = 'Something went wrong') => {
  if (isOfflineError(err)) {
    appAlert(OFFLINE_TITLE, 'Connect to the internet and try again.');
    return;
  }
  appAlert(title, err?.message ?? 'Unknown error');
};

// A save failed. Makes it explicit that nothing was saved, and, when the
// failure was down to connectivity, that the user should stay put and retry
// once reconnected.
export const alertSaveFailed = (err, title = 'Could not save') => {
  if (isOfflineError(err)) {
    appAlert(
      OFFLINE_TITLE,
      "Your changes have not been saved. Stay on this page and try again once you're reconnected."
    );
    return;
  }
  appAlert(title, `Your changes have not been saved.\n\n${err?.message ?? 'Unknown error'}`);
};
