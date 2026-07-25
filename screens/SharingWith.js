// Lists people who have linked their friend profile to yours
// This is who you are currently sharing your info and allergies with

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon } from '../components/icons';
import { getSharingWith, revokeMyAccess, blockUser } from '../lib/api/friends';
import ConfirmModal from '../components/ConfirmModal';

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

const SharingWith = ({ navigation }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setPeople(await getSharingWith());
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

  // Which confirm dialog (if any) is open: { person, action: 'remove' | 'block' }
  const [confirmTarget, setConfirmTarget] = useState(null);

  const handleRemove = (person) => setConfirmTarget({ person, action: 'remove' });
  const handleBlock = (person) => setConfirmTarget({ person, action: 'block' });
  const dismissConfirm = () => setConfirmTarget(null);

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    const { person, action } = confirmTarget;
    setConfirmTarget(null);
    try {
      if (action === 'remove') await revokeMyAccess(person.friendshipId);
      else await blockUser(person.sharerId);
      load();
    } catch (err) {
      Alert.alert(
        action === 'remove' ? 'Could not remove' : 'Could not block',
        err.message ?? 'Unknown error'
      );
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
        onPress={() => navigation.navigate('BlockedUsers')}
      >
        <Text style={styles.overlayText}>Blocked</Text>
      </TouchableOpacity>

      <Text style={styles.header_card}>Sharing With</Text>
      <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
        You&apos;re sharing your name, bio, and allergies with these people because they&apos;ve linked a friend profile to yours. You can remove their access
        to your profile or block them here.
      </Text>

      {loading && <Text style={styles.emptyText}>Loading…</Text>}

      {!loading && people.length === 0 && (
        <Text style={styles.emptyText}>You aren&apos;t sharing your profile with anyone yet.</Text>
      )}

      {people.map((person) => (
        <View key={person.friendshipId} style={[styles.allergyRow, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowText}>{person.sharerName}</Text>
            <Text style={[styles.readOnly_hint, { marginTop: 2 }]}>
              Linked {relativeTime(person.linkedSince)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button_outline, styles.button_outline_link, { paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 }]}
            onPress={() => handleRemove(person)}
          >
            <Text style={[styles.buttonText_outline, { color: colors.primary, marginLeft: 0 }]}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button_outline, styles.button_outline_danger, { paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 }]}
            onPress={() => handleBlock(person)}
          >
            <Text style={[styles.buttonText_outline, { color: colors.danger, marginLeft: 0 }]}>Block</Text>
          </TouchableOpacity>
        </View>
      ))}

      <ConfirmModal
        visible={!!confirmTarget}
        title={
          confirmTarget
            ? `${confirmTarget.action === 'remove' ? 'Remove' : 'Block'} ${confirmTarget.person.sharerName}?`
            : ''
        }
        message={
          confirmTarget?.action === 'remove'
            ? `${confirmTarget.person.sharerName} will no longer be able to see your profile info or allergies. They can add you again later.`
            : confirmTarget
            ? `This removes ${confirmTarget.person.sharerName} from both of your friend lists and stops either of you from adding each other again.`
            : ''
        }
        confirmLabel={confirmTarget?.action === 'remove' ? 'Remove' : 'Block'}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={dismissConfirm}
      />
    </ScrollView>
  );
};

export default SharingWith;
