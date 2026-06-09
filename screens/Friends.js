import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import NavigationBar from '../components/NavigationBar';
import { KeyIcon, LinkIcon, PersonAddIcon, PlusIcon } from '../components/icons';
import { useAuth } from '../lib/auth-context';
import {
  getFriends,
  addFriend,
  addFriendByCode,
  friendDisplayName,
} from '../lib/api/friends';
import { getMyProfile } from '../lib/api/profile';
import { useCachedResource } from '../lib/cache';
import { startNewRecipe } from '../components/utils/addRecipe';

// Strip non-alphanumeric, uppercase, max 8 chars.
const normalizeCode = (s) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const Friends = ({ navigation }) => {
  const { user } = useAuth();
  const fallbackName = user?.email || 'you';

  const { data } = useCachedResource({
    resource: 'friends',
    userId: user?.id,
    fetcher: async () => {
      const [list, profile] = await Promise.all([getFriends(), getMyProfile()]);
      return { list, myName: profile?.name?.trim() || fallbackName };
    },
  });
  const friends = data?.list ?? [];
  const myName = data?.myName || fallbackName;

  // Modal state. Step "choose" picks path; "code" enters friend code;
  // "manual" enters a name for an off-platform friend.
  const [modalStep, setModalStep] = useState(null); // null | 'choose' | 'code' | 'manual'
  const [codeInput, setCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [busy, setBusy] = useState(false);

  const closeModal = () => {
    setModalStep(null);
    setCodeInput('');
    setNameInput('');
    setBusy(false);
  };

  const handleAddByCode = async () => {
    const code = normalizeCode(codeInput);
    if (code.length !== 8) {
      Alert.alert('Bad code', 'A friend code is 8 characters.');
      return;
    }
    try {
      setBusy(true);
      const friend = await addFriendByCode(code);
      closeModal();
      Alert.alert('Added', `Linked to ${friendDisplayName(friend)}.`);
    } catch (err) {
      Alert.alert('Could not add by code', err.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddManual = async () => {
    if (!nameInput.trim()) return;
    try {
      setBusy(true);
      await addFriend({ friendName: nameInput.trim() });
      closeModal();
    } catch (err) {
      Alert.alert('Could not add friend', err.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddRecipe = () => {
    startNewRecipe({ navigation });
  };

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      <TouchableOpacity style={styles.home_search} onPress={() => setModalStep('choose')}>
        <PlusIcon size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.header_tab}>Friends</Text>

      <FlatList
        style={styles.friends_list}
        data={friends}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.row, styles.friends_meRow]}
            onPress={() => navigation.navigate('Profile')}
          >
            {myName === fallbackName ? (
              <Text style={[styles.rowText, { fontWeight: 'bold' }]}>
              Your Profile ({fallbackName})
            </Text>
            ) : (
              <Text style={[styles.rowText, { fontWeight: 'bold' }]}>
              {myName} (you)
            </Text>
            )}
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const linked = !!item.existingFriendId;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('FriendProfile', { friendshipId: item.id })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={styles.rowText}>{friendDisplayName(item)}</Text>
                {linked && (
                  <View style={styles.linkBadge}>
                    <LinkIcon />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No friends yet. Tap + to add one.</Text>
        }
      />

      <Modal
        visible={!!modalStep}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modal_backdrop} onPress={closeModal}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            {modalStep === 'choose' && (
              <>
                <Text style={styles.header_modal}>Add Friend</Text>
                <TouchableOpacity
                  style={styles.addChoice_button}
                  onPress={() => setModalStep('code')}
                >
                  <KeyIcon />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.addChoice_title}>By friend code</Text>
                    <Text style={styles.addChoice_subtitle}>
                      Link an existing user with the code they shared.
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addChoice_button}
                  onPress={() => setModalStep('manual')}
                >
                  <PersonAddIcon />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.addChoice_title}>Manually</Text>
                    <Text style={styles.addChoice_subtitle}>
                      Add an off-platform contact with a name only.
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modal_button} onPress={closeModal}>
                  <Text style={styles.modal_buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {modalStep === 'code' && (
              <>
                <Text style={styles.header_modal}>Enter Friend Code</Text>
                <TextInput
                  style={[styles.input_base, styles.input_spaced, styles.input_code]}
                  placeholder="ABCD-EFGH"
                  value={codeInput}
                  onChangeText={(t) => setCodeInput(normalizeCode(t))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  maxLength={8}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    style={styles.modal_button}
                    onPress={() => setModalStep('choose')}
                  >
                    <Text style={styles.modal_buttonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modal_button}
                    onPress={handleAddByCode}
                    disabled={busy}
                  >
                    <Text style={[styles.modal_buttonText, { color: colors.link, fontWeight: 'bold' }]}>
                      {busy ? 'Adding…' : 'Link'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modalStep === 'manual' && (
              <>
                <Text style={styles.header_modal}>Add Manually</Text>
                <TextInput
                  style={[styles.input_base, styles.input_spaced]}
                  placeholder="Friend's name"
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    style={styles.modal_button}
                    onPress={() => setModalStep('choose')}
                  >
                    <Text style={styles.modal_buttonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modal_button}
                    onPress={handleAddManual}
                    disabled={busy}
                  >
                    <Text style={[styles.modal_buttonText, { color: colors.link, fontWeight: 'bold' }]}>
                      {busy ? 'Adding…' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Friends;
