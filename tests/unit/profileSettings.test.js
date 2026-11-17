import React from 'react';
import { Switch } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('../../lib/server/supabase', () => require('../helpers/fakeSupabase').module);
jest.mock('../../lib/server/auth-context', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: () => {} }));
jest.mock('../../lib/app/dialog', () => ({ appAlert: jest.fn() }));

const fake = require('../helpers/fakeSupabase');
const { setMyProfileFlags } = require('../../lib/server/api/profile');
const { useProfileToggle, resetProfileToggles } = require('../../lib/server/useProfileToggle');
const { mutateCachedResource, readCachedResource } = require('../../lib/app/cache');
const { appAlert } = require('../../lib/app/dialog');

const PROFILE = { id: 'user-1', name: 'Amy', contrast: false, hide_unsafe_recipes: false };

const Toggle = ({ field }) => {
  const { value, ready, toggle } = useProfileToggle(field);
  return <Switch testID="switch" value={value} disabled={!ready} onValueChange={toggle} />;
};

const updates = () =>
  fake.state.log.filter((e) => e.table === 'profiles' && fake.opsOf(e, 'update').length);

beforeEach(async () => {
  fake.reset();
  resetProfileToggles();
  appAlert.mockClear();
  fake.state.respond = (entry) =>
    fake.opsOf(entry, 'update').length ? { data: null, error: null } : { data: PROFILE, error: null };
  await mutateCachedResource('profile', 'user-1', PROFILE);
});

test('a switch save is one request: no getUser round trip, no response body, only allowed fields', async () => {
  fake.client.auth.getUser.mockClear();
  await setMyProfileFlags({ hide_unsafe_recipes: true, name: 'not a flag', contrast: 'yes' });
  expect(fake.client.auth.getUser).not.toHaveBeenCalled();
  expect(fake.state.log).toHaveLength(1);
  const [entry] = fake.state.log;
  expect(fake.opsOf(entry, 'update')[0][1]).toEqual({ hide_unsafe_recipes: true });
  expect(fake.opsOf(entry, 'select')).toHaveLength(0);
  expect(fake.hasOp(entry, 'eq', 'id', 'user-1')).toBe(true);
});

test('the switch flips before the save finishes, and the cached profile keeps every other field', async () => {
  let finishSave;
  fake.state.respond = (entry) =>
    fake.opsOf(entry, 'update').length
      ? new Promise((resolve) => (finishSave = () => resolve({ data: null, error: null })))
      : { data: PROFILE, error: null };
  await render(<Toggle field="hide_unsafe_recipes" />);
  await fireEvent(screen.getByTestId('switch'), 'valueChange', true);
  expect(screen.getByTestId('switch').props.value).toBe(true); // save still pending
  expect(await readCachedResource('profile', 'user-1')).toEqual({ ...PROFILE, hide_unsafe_recipes: true });
  await act(async () => finishSave());
});

test('quick repeated taps send at most one request at a time, ending on the last value', async () => {
  const pending = [];
  fake.state.respond = (entry) =>
    fake.opsOf(entry, 'update').length
      ? new Promise((resolve) => pending.push(() => resolve({ data: null, error: null })))
      : { data: PROFILE, error: null };
  await render(<Toggle field="contrast" />);
  const sw = () => screen.getByTestId('switch');
  await fireEvent(sw(), 'valueChange', true); // on  → request 1 starts
  await fireEvent(sw(), 'valueChange', false); // off → waits
  await fireEvent(sw(), 'valueChange', true); // on  → replaces "off"
  expect(updates()).toHaveLength(1);
  await act(async () => pending.shift()());
  // Request 1 already saved "on", which is the latest value: nothing more to send.
  expect(updates()).toHaveLength(1);
  expect(sw().props.value).toBe(true);
});

test('a failed save puts the switch back and shows one popup', async () => {
  fake.state.respond = (entry) =>
    fake.opsOf(entry, 'update').length
      ? { data: null, error: new Error('Network request failed') }
      : { data: PROFILE, error: null };
  await render(<Toggle field="hide_unsafe_recipes" />);
  await fireEvent(screen.getByTestId('switch'), 'valueChange', true);
  await act(async () => {});
  expect(screen.getByTestId('switch').props.value).toBe(false);
  expect(appAlert).toHaveBeenCalledTimes(1);
});

describe('before profiles.hide_unsafe_recipes exists (migration not run)', () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  const { getMyProfile } = require('../../lib/server/api/profile');
  const { migrateHideUnsafeToProfile } = require('../../lib/server/useCacheWarmup');
  const { KEYS } = require('../../lib/app/storage');
  const { hidesUnsafeRecipes } = require('../../lib/app/dietaryVisibility');
  const NO_COLUMN = { id: 'user-1', name: 'Amy', contrast: false };
  const key = KEYS.hideUnsafeRecipes('user-1');

  beforeEach(async () => {
    await AsyncStorage.clear();
    fake.state.respond = (entry) =>
      fake.opsOf(entry, 'update').length ? { data: null, error: null } : { data: NO_COLUMN, error: null };
  });

  test('the setting is read from the device, so it keeps working', async () => {
    await AsyncStorage.setItem(key, 'true');
    const profile = await getMyProfile();
    expect(hidesUnsafeRecipes(profile)).toBe(true);
    expect(profile.deviceOnly).toEqual(['hide_unsafe_recipes']);
  });

  test('toggling saves on the device with no request, and no error popup', async () => {
    await mutateCachedResource('profile', 'user-1', await getMyProfile());
    fake.reset();
    fake.state.respond = () => ({ data: NO_COLUMN, error: null });
    await render(<Toggle field="hide_unsafe_recipes" />);
    await fireEvent(screen.getByTestId('switch'), 'valueChange', true);
    await act(async () => {});
    expect(screen.getByTestId('switch').props.value).toBe(true);
    expect(updates()).toHaveLength(0);
    expect(await AsyncStorage.getItem(key)).toBe('true');
    expect(appAlert).not.toHaveBeenCalled();
  });

  test('high contrast still saves to the server', async () => {
    await mutateCachedResource('profile', 'user-1', await getMyProfile());
    fake.reset();
    fake.state.respond = (entry) =>
      fake.opsOf(entry, 'update').length ? { data: null, error: null } : { data: NO_COLUMN, error: null };
    await render(<Toggle field="contrast" />);
    await fireEvent(screen.getByTestId('switch'), 'valueChange', true);
    await act(async () => {});
    expect(updates()).toHaveLength(1);
  });

  test('the one-time copy-up waits for the column, then moves the device value to the profile', async () => {
    await AsyncStorage.setItem(key, 'true');
    await migrateHideUnsafeToProfile('user-1');
    expect(updates()).toHaveLength(0);
    expect(await AsyncStorage.getItem(key)).toBe('true'); // kept: still the setting

    // Migration run: the column now exists (default false).
    fake.state.respond = (entry) =>
      fake.opsOf(entry, 'update').length
        ? { data: null, error: null }
        : { data: { ...NO_COLUMN, hide_unsafe_recipes: false }, error: null };
    await migrateHideUnsafeToProfile('user-1');
    expect(fake.opsOf(updates()[0], 'update')[0][1]).toEqual({ hide_unsafe_recipes: true });
    expect(await AsyncStorage.getItem(key)).toBeNull();
    expect(hidesUnsafeRecipes(await readCachedResource('profile', 'user-1'))).toBe(true);
  });
});
