import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { appAlert } from './dialog';

// Server reachability, shared app-wide. Pings Supabase's auth health
// endpoint while any screen is listening (useIsOnline), and again whenever
// the app returns to the foreground. One status for every subscriber, so
// banners on different screens never disagree.

const HEALTH_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/auth/v1/health`;
const API_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

const TIMEOUT_MS = 5000;
const POLL_ONLINE_MS = 20000;
// Re-check sooner while offline so the banner clears soon after reconnecting.
const POLL_OFFLINE_MS = 5000;

let online = true; // optimistic until the first ping says otherwise
let inFlight = null;
let pollTimer = null;
let appStateSub = null;
const listeners = new Set();

const setOnline = (next) => {
  if (next === online) return;
  online = next;
  for (const fn of listeners) fn();
  schedulePoll(); // switch to the faster/slower cadence right away
};

// Pings the server and returns whether it answered. Any HTTP response counts
// as reachable except a 5xx (server up but broken); a network failure or
// timeout counts as offline. Concurrent callers share one request.
export const checkConnection = () => {
  if (inFlight) return inFlight;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  inFlight = fetch(HEALTH_URL, { headers: { apikey: API_KEY }, signal: controller.signal })
    .then((res) => res.status < 500)
    .catch(() => false)
    .then((ok) => {
      clearTimeout(timeout);
      inFlight = null;
      setOnline(ok);
      return ok;
    });
  return inFlight;
};

const schedulePoll = () => {
  clearTimeout(pollTimer);
  if (!listeners.size) return;
  pollTimer = setTimeout(async () => {
    await checkConnection();
    schedulePoll();
  }, online ? POLL_ONLINE_MS : POLL_OFFLINE_MS);
};

const start = () => {
  appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') checkConnection();
  });
  checkConnection();
  schedulePoll();
};

const stop = () => {
  clearTimeout(pollTimer);
  pollTimer = null;
  appStateSub?.remove();
  appStateSub = null;
};

const subscribe = (fn) => {
  listeners.add(fn);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(fn);
    if (!listeners.size) stop();
  };
};

const getSnapshot = () => online;

// Live online/offline status for a component. Polling only runs while at
// least one mounted component is using this hook.
export const useIsOnline = () => useSyncExternalStore(subscribe, getSnapshot);

// Matches the errors fetch / supabase-js produce when the request never
// reached the server.
const NETWORK_ERROR_RE = /network request failed|failed to fetch|network ?error|fetch failed|timed? ?out|aborted/i;

const isNetworkError = (err) =>
  NETWORK_ERROR_RE.test(err?.message ?? '') || err?.name === 'AuthRetryableFetchError';

// Shows the alert for a failed save. Makes it explicit that nothing was
// saved, and — when the failure was down to connectivity — that the user
// should stay put and retry once reconnected. Offline failures don't always
// look like network errors (e.g. the auth check surfaces as "Not signed in"),
// so this also re-pings the server before deciding.
export const alertSaveFailed = async (err, title = 'Could not save') => {
  const offline = isNetworkError(err) || !(await checkConnection());
  if (offline) {
    appAlert(
      "You're offline",
      "Your changes have not been saved. Stay on this page and try again once you're reconnected."
    );
    return;
  }
  appAlert(
    title,
    `Your changes have not been saved.\n\n${err?.message ?? 'Unknown error'}`
  );
};
