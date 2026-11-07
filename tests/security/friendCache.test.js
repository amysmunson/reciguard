// FriendProfile caches only who a friend is ({ id, name }) — never their
// notes or dietary needs, which always come from the server.
jest.mock('../../lib/supabase', () => require('../helpers/fakeSupabase').module);
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cacheFriendIdentity,
  getCachedFriendIdentity,
  purgeLegacyFriendProfiles,
} from '../../lib/api/friends';
import { readCachedResource, updateCachedResource } from '../../lib/cache';
import { setCachingEnabled } from '../../lib/cachePreference';

const U = 'user-1';
const fullFriend = {
  id: 'f1',
  existingFriendId: 'other-user',
  friendName: 'Sam (my name for them)',
  friendNotes: 'Private: allergic since 2019, carries an EpiPen',
  linkedProfile: { id: 'other-user', name: 'Samantha', about: 'Loves baking' },
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await setCachingEnabled(true);
});

test('only id and display name are stored — no notes, bio, or dietary data', async () => {
  await cacheFriendIdentity(U, fullFriend);
  const stored = await readCachedResource('friendNames', U);
  expect(stored).toEqual({ f1: { id: 'f1', name: 'Samantha' } });
  const raw = JSON.stringify(await AsyncStorage.multiGet(await AsyncStorage.getAllKeys()));
  expect(raw).not.toMatch(/EpiPen|Loves baking|allerg/i);
});

test('a first-time friend still gets an instant name from the cached friends list', async () => {
  await updateCachedResource('friends', U, () => ({ list: [fullFriend], myName: 'Me' }));
  expect(await getCachedFriendIdentity(U, 'f1')).toEqual({ id: 'f1', name: 'Samantha' });
  expect(await getCachedFriendIdentity(U, 'nobody')).toBeNull();
});

test('full friend profiles cached by earlier builds are purged', async () => {
  await updateCachedResource('friendProfiles', U, () => ({
    f1: { friend: fullFriend, allergies: [{ name: 'peanut' }], theirAllergies: [] },
  }));
  await purgeLegacyFriendProfiles(U);
  expect(await readCachedResource('friendProfiles', U)).toBeNull();
  // Purging works even with caching turned off (deletions are never gated).
  await updateCachedResource('friendProfiles', U, () => ({ f1: {} }));
  await setCachingEnabled(false);
  await purgeLegacyFriendProfiles(U);
  await setCachingEnabled(true);
  expect(await readCachedResource('friendProfiles', U)).toBeNull();
});
