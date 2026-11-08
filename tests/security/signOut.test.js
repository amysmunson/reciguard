jest.mock('../../lib/server/supabase', () => require('../helpers/fakeSupabase').module);
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut, deleteAccount } from '../../lib/server/api/auth';
import { updateCachedResource } from '../../lib/app/cache';
import { cacheRecentRecipe } from '../../lib/app/recipeCache';
import { recordRecipeOpened, saveJson, KEYS } from '../../lib/app/storage';
import { setCachingEnabled } from '../../lib/app/cachePreference';
import * as fake from '../helpers/fakeSupabase';

const U = fake.state.userId;

const seedUserData = async () => {
  await setCachingEnabled(true);
  await updateCachedResource('friendNames', U, () => ({ f1: { allergies: [{ name: 'peanut' }] } }));
  await updateCachedResource('profile', U, () => ({ name: 'Me', phone: '555' }));
  await recordRecipeOpened(U, 'r1');
  await cacheRecentRecipe(U, { id: 'r1', name: 'Private recipe' });
  await saveJson(KEYS.homeSort(U), { by: 'name', dir: 'asc' });
};

const userKeys = async () =>
  (await AsyncStorage.getAllKeys()).filter((k) => k.includes(U));

beforeEach(async () => {
  await AsyncStorage.clear();
  fake.reset();
});

test('sign-out removes every cached copy and per-user setting from the device', async () => {
  await seedUserData();
  expect((await userKeys()).length).toBeGreaterThan(0);
  await signOut();
  expect(fake.client.auth.signOut).toHaveBeenCalled();
  expect(await userKeys()).toEqual([]);
});

test('account deletion also wipes local data', async () => {
  await seedUserData();
  fake.client.rpc.mockResolvedValueOnce({ data: null, error: null });
  await deleteAccount();
  expect(fake.client.rpc).toHaveBeenCalledWith('delete_current_user');
  expect(await userKeys()).toEqual([]);
});
