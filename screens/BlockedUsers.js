// Reachable from SharingWith. Lists people the current user has blocked with an Unblock option. 

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon } from '../components/icons';
import { getMyBlocks, unblockUser, blockUserByCode } from '../lib/api/friends';
import ConfirmModal from '../components/ConfirmModal';

// Strip non-alphanumeric, uppercase, max 8 chars — same normalization as
// the friend-code inputs in Friends.js/FriendProfile.js.
const normalizeCode = (s) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const relativeTime = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

const BlockedUsers = ({ navigation }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setBlocks(await getMyBlocks());
    } catch (err) {
      Alert.alert('Could not load', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const [confirmTarget, setConfirmTarget] = useState(null);

  const handleUnblock = (person) => setConfirmTarget(person);
  const dismissConfirm = () => setConfirmTarget(null);

  const handleConfirmUnblock = async () => {
    const person = confirmTarget;
    if (!person) return;
    setConfirmTarget(null);
    try {
      await unblockUser(person.blockedId);
      load();
    } catch (err) {
      Alert.alert('Could not unblock', err.message ?? 'Unknown error');
    }
  };

  // Block someone by their friend code directly — no existing friendship or
  // prior sharing required, so you can preempt ever sharing with them.
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);

  const openCodeModal = () => {
    setCodeInput('');
    setBusy(false);
    setCodeModalVisible(true);
  };
  const closeCodeModal = () => setCodeModalVisible(false);

  const handleBlockByCode = async () => {
    const code = normalizeCode(codeInput);
    if (code.length !== 8) {
      Alert.alert('Bad code', 'A friend code is 8 characters.');
      return;
    }
    try {
      setBusy(true);
      const profile = await blockUserByCode(code);
      closeCodeModal();
      load();
      Alert.alert('Blocked', `${profile.name ?? 'That user'} has been blocked.`);
    } catch (err) {
      Alert.alert('Could not block', err.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={[styles.screen_base, styles.screen_cardPad]} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_card]}
        onPress={() => navigation.goBack()}
      >
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={openCodeModal}
      >
        <Text style={styles.overlayText}>Block by Code</Text>
      </TouchableOpacity>

      <Text style={styles.header_card}>Blocked Users</Text>
      <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
        People you&apos;ve blocked can&apos;t see your info and can&apos;t add you back. It will also remove any
        existing friendship links for both you and the blocked user. You must unblock to allow them
         to see your profile again. You can also block someone by their friend code before you&apos;ve
        ever shared with them.
      </Text>

      {loading && <Text style={styles.emptyText}>Loading…</Text>}

      {!loading && blocks.length === 0 && (
        <Text style={styles.emptyText}>You haven&apos;t blocked anyone.</Text>
      )}

      {blocks.map((person) => (
        <View key={person.blockId} style={[styles.allergyRow, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowText}>{person.blockedName}</Text>
            <Text style={[styles.readOnly_hint, { marginTop: 2 }]}>
              Blocked {relativeTime(person.blockedSince)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button_outline, styles.button_outline_link, { paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 }]}
            onPress={() => handleUnblock(person)}
          >
            <Text style={[styles.buttonText_outline, { color: colors.primary, marginLeft: 0 }]}>Unblock</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal
        visible={codeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCodeModal}
      >
        <Pressable style={styles.modal_backdrop} onPress={closeCodeModal}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Block by Friend Code</Text>
            <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
              Enter another user&apos;s friend code to block them right away. You do not need to have added or linked with them first.
            </Text>
            <TextInput
              style={[styles.input_base, styles.input_spaced, styles.input_code]}
              placeholder="ABCDEFGH"
              value={codeInput}
              onChangeText={(t) => setCodeInput(normalizeCode(t))}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modal_button_right}>
              <TouchableOpacity style={styles.modal_button} onPress={closeCodeModal}>
                <Text style={styles.modal_buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modal_button}
                onPress={handleBlockByCode}
                disabled={busy}
              >
                <Text style={[styles.modal_buttonText, { color: colors.danger, fontWeight: 'bold' }]}>
                  {busy ? 'Blocking…' : 'Block'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!confirmTarget}
        title={confirmTarget ? `Unblock ${confirmTarget.blockedName}?` : ''}
        message={
          confirmTarget
            ? `${confirmTarget.blockedName} will be able to add you again. This doesn't restore any previous link — you'll each need to add each other again.`
            : ''
        }
        confirmLabel="Unblock"
        cancelLabel="Cancel"
        onConfirm={handleConfirmUnblock}
        onCancel={dismissConfirm}
      />
    </ScrollView>
  );
};

export default BlockedUsers;
