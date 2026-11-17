import {
  trackedFetch,
  pingServer,
  isOnline,
  alertLoadFailed,
  alertActionFailed,
  alertSaveFailed,
} from '../../lib/server/connectivity';
import { appAlert } from '../../lib/app/dialog';

jest.mock('../../lib/app/dialog', () => ({ appAlert: jest.fn() }));

const goOffline = async () => {
  global.fetch = jest.fn(async () => {
    throw new TypeError('Network request failed');
  });
  await expect(trackedFetch('https://example.supabase.co/rest/v1/recipes')).rejects.toThrow();
};
const goOnline = async () => {
  global.fetch = jest.fn(async () => ({ status: 200 }));
  await trackedFetch('https://example.supabase.co/rest/v1/recipes');
};

beforeEach(async () => {
  await goOnline();
  appAlert.mockClear();
});

test('online/offline comes from the requests the app already makes', async () => {
  await goOffline();
  expect(isOnline()).toBe(false);
  // Any request that gets through clears it (pull-to-refresh, opening a recipe…).
  await goOnline();
  expect(isOnline()).toBe(true);
  // A 4xx still reached the server; a 5xx counts as down.
  global.fetch = jest.fn(async () => ({ status: 404 }));
  await trackedFetch('x');
  expect(isOnline()).toBe(true);
  global.fetch = jest.fn(async () => ({ status: 503 }));
  await trackedFetch('x');
  expect(isOnline()).toBe(false);
});

test('a request the app cancels on purpose does not flip the status', async () => {
  global.fetch = jest.fn(async () => {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  });
  await expect(trackedFetch('x')).rejects.toThrow();
  expect(isOnline()).toBe(true);
});

test('automatic loads never pop up when offline, but real server errors still do', async () => {
  await goOffline();
  alertLoadFailed(new Error('Network request failed'), 'Could not load dietary needs');
  // Offline failures that don't look like network errors (e.g. "Not signed in").
  alertLoadFailed(new Error('Not signed in'), 'Could not load recipes');
  expect(appAlert).not.toHaveBeenCalled();

  await goOnline();
  alertLoadFailed(new Error('permission denied'), 'Could not load recipes');
  expect(appAlert).toHaveBeenCalledWith('Could not load recipes', 'permission denied');
});

test('a tap that needs the server gets exactly one offline popup', async () => {
  await goOffline();
  alertActionFailed(new Error('Network request failed'), 'Could not add to folder');
  expect(appAlert).toHaveBeenCalledTimes(1);
  expect(appAlert.mock.calls[0][0]).toBe("You're offline");

  appAlert.mockClear();
  alertSaveFailed(new Error('Network request failed'));
  expect(appAlert).toHaveBeenCalledTimes(1);
  expect(appAlert.mock.calls[0][1]).toMatch(/not been saved/);
});

test('a request that hangs gives up after 15 s and marks the app offline', async () => {
  jest.useFakeTimers();
  try {
    // Never resolves on its own; only the abort ends it.
    global.fetch = jest.fn(
      (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        })
    );
    const pending = trackedFetch('https://example.supabase.co/rest/v1/recipes');
    const settled = expect(pending).rejects.toThrow('Network request timed out');
    jest.advanceTimersByTime(15000);
    await settled;
    expect(isOnline()).toBe(false);
  } finally {
    jest.useRealTimers();
  }
});

test('the quick ping answers within 3 s, so an unreachable server shows offline fast', async () => {
  jest.useFakeTimers();
  try {
    global.fetch = jest.fn(
      (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        })
    );
    const result = pingServer();
    jest.advanceTimersByTime(3000);
    await expect(result).resolves.toBe(false);
    expect(isOnline()).toBe(false);
  } finally {
    jest.useRealTimers();
  }
  // And a reachable server answers true and clears the offline state.
  global.fetch = jest.fn(async () => ({ status: 200 }));
  await expect(pingServer()).resolves.toBe(true);
  expect(isOnline()).toBe(true);
});

test('nothing is requested in the background, however long the app sits idle', async () => {
  jest.useFakeTimers();
  try {
    global.fetch = jest.fn(async () => ({ status: 200 }));
    jest.advanceTimersByTime(10 * 60 * 1000);
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});
