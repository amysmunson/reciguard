import { useSyncExternalStore } from 'react';
import { appAlert } from '../app/dialog';

// Server reachability, shared app-wide, learned from requests the app
// already makes. There is no background polling: every Supabase request goes
// through `trackedFetch` (wired into the client in supabase.js). One that
// reaches the server marks the app online; one that can't marks it offline.
// So the offline banner appears on the first failed load or save, and clears
// on the next request that gets through: pull-to-refresh, opening a recipe,
// coming back to a screen, and so on.
//
// Two limits keep a dead connection from leaving a screen stuck:
//   - Every request gives up after REQUEST_TIMEOUT_MS.
//   - Screens that would otherwise sit on "Loading…" (RecipeCard, EditRecipe)
//     call pingServer() first, only when they open. It answers within
//     PING_TIMEOUT_MS, so an unreachable server shows the offline state in
//     seconds instead of after the full request's timeout and auth retries.
//
// Popups follow two rules:
//   - Automatic loads (screen open/focus, background refresh, pull-to-refresh)
//     never alert for a connection failure. The banner already says so.
//     Use alertLoadFailed.
//   - Taps that need the server (save, delete, add, sign in) get one popup.
//     Use alertSaveFailed (changes weren't saved) or alertActionFailed.

const HEALTH_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/auth/v1/health`;
const API_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const PING_TIMEOUT_MS = 3000;
const REQUEST_TIMEOUT_MS = 15000;

let online = true; // optimistic until a request says otherwise
const listeners = new Set();

const setOnline = (next) => {
  if (next === online) return;
  online = next;
  for (const fn of listeners) fn();
};

// fetch with a time limit. Rejects with "Network request timed out" when the
// limit passes; a caller's own abort (init.signal) is passed through as-is.
const fetchWithTimeout = async (input, init = {}, ms) => {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const outer = init.signal;
  if (outer?.aborted) controller.abort();
  else outer?.addEventListener?.('abort', () => controller.abort(), { once: true });
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (timedOut) throw new Error('Network request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// fetch for the Supabase client. A response below 500 means the server was
// reached and is working; a 5xx (server up but broken, e.g. a paused
// project), a network failure, or a timeout counts as offline. Requests the
// app cancels on purpose don't change the status.
export const trackedFetch = async (input, init) => {
  try {
    const res = await fetchWithTimeout(input, init, REQUEST_TIMEOUT_MS);
    setOnline(res.status < 500);
    return res;
  } catch (err) {
    if (err?.name !== 'AbortError') setOnline(false);
    throw err;
  }
};

// Quick "can we reach the server?" check, used only when a screen opens and
// has nothing to show yet. Sends just the public key (no session, no user
// data) and resolves true/false within PING_TIMEOUT_MS. Concurrent callers
// share one request.
let pingInFlight = null;
export const pingServer = () => {
  if (pingInFlight) return pingInFlight;
  pingInFlight = fetchWithTimeout(HEALTH_URL, { headers: { apikey: API_KEY } }, PING_TIMEOUT_MS)
    .then((res) => res.status < 500)
    .catch(() => false)
    .then((ok) => {
      pingInFlight = null;
      setOnline(ok);
      return ok;
    });
  return pingInFlight;
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
