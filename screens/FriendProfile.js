import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon, LinkIcon, TrashIcon } from '../components/icons';
import {
  getFriend,
  updateFriend,
  deleteFriend,
  linkFriendByCode,
  unlinkFriend,
} from '../lib/api/friends';
import {
  getFriendAllergies,
  getLinkedUserAllergies,
  severityColor,
  severityLabel,
} from '../lib/api/allergies';
import ConfirmModal from '../components/ConfirmModal';

const normalizeCode = (s) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const FriendProfile = ({ route, navigation }) => {
  const { friendshipId } = route.params;
  const [friend, setFriend] = useState(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const [allergies, setAllergies] = useState([]);

  const [theirAllergies, setTheirAllergies] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState({ name: '', notes: '' });
  const [confirmDiscardVisible, setConfirmDiscardVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const f = await getFriend(friendshipId);
      setFriend(f);
      setName(f.friendName ?? '');
      setNotes(f.friendNotes ?? '');
      setBaseline({ name: f.friendName ?? '', notes: f.friendNotes ?? '' });
      const mine = await getFriendAllergies(friendshipId);
      setAllergies(mine);
      if (f.linkedProfile?.id) {
        try {
          const theirs = await getLinkedUserAllergies(f.linkedProfile.id);
          setTheirAllergies(theirs);
        } catch {
          setTheirAllergies([]);
        }
      } else {
        setTheirAllergies([]);
      }
    } catch (err) {
      Alert.alert('Could not load friend', err.message ?? 'Unknown error');
    }
  }, [friendshipId]);

  const isDirty = name !== baseline.name || notes !== baseline.notes;

  // Refreshes on every focus (not just mount) so allergy edits made on
  // EditAllergies — which saves straight to the database itself — show up
  // here as soon as you navigate back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    try {
      const updated = await updateFriend(friendshipId, {
        friendName: name,
        friendNotes: notes,
      });
      setFriend(updated);
      setIsEditing(false);
      setBaseline({ name, notes });
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    }
  };

  const handleDiscard = () => {
    setConfirmDiscardVisible(false);
    setIsEditing(false);
    load(); // revert any in-flight edits
  };

  const handleBackPress = () => {
    if (!isEditing) {
      navigation.goBack();
      return;
    }
    if (isDirty) {
      setConfirmDiscardVisible(true);
      return;
    }
    handleDiscard();
  };

  const handleLink = async () => {
    const code = normalizeCode(codeInput);
    if (code.length !== 8) {
      Alert.alert('Bad code', 'A friend code is 8 characters.');
      return;
    }
    try {
      setBusy(true);
      const updated = await linkFriendByCode({ friendshipId, code });
      setFriend(updated);
      setName(updated.friendName ?? '');
      setLinkModalOpen(false);
      setCodeInput('');
      load();
    } catch (err) {
      Alert.alert('Could not link', err.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      'Unlink this friend?',
      "Their profile data won't update for you anymore, but your notes and allergies stay.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await unlinkFriend(friendshipId);
              setFriend(updated);
              setTheirAllergies([]);
            } catch (err) {
              Alert.alert('Could not unlink', err.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFriend = () => {
    Alert.alert('Remove friend?', 'This deletes your notes and allergies for them.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFriend(friendshipId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not remove friend', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  if (!friend) {
    return (
      <View style={[styles.screen_base, styles.screen_cardPad]}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const isLinked = !!friend.existingFriendId;
  const linkedAlive = !!friend.linkedProfile;
  // A linked friend who set their own name overrides the user's local name
  // and can't be edited here. Otherwise the name behaves like Profile's.
  const friendSetOwnName = (friend.linkedProfile?.name ?? '').trim().length > 0;

  const displayValue = (val) =>
    val && val.trim().length > 0 ? (
      <Text style={styles.display_fieldValue}>{val}</Text>
    ) : (
      <Text style={[styles.display_fieldValue, styles.display_fieldEmpty]}>Not set</Text>
    );

  return (
    <ScrollView
      style={[styles.screen_base, styles.screen_cardPad, { paddingBottom: 0 }]}
      contentContainerStyle={[styles.screen_baseScroll, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_card]} onPress={handleBackPress}>
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={isEditing ? handleSave : () => setIsEditing(true)}
      >
        <Text style={styles.overlayText}>{isEditing ? 'Save' : 'Edit'}</Text>
      </TouchableOpacity>

      {friendSetOwnName ? (
        <Text style={styles.header_card}>{friend.linkedProfile.name}</Text>
      ) : isEditing ? (
        <TextInput
          style={[styles.header_card, styles.input_underline]}
          value={name}
          onChangeText={setName}
          placeholder="Friend's name"
        />
      ) : (
        <Text style={styles.header_card}>{name || 'Unnamed Friend'}</Text>
      )}

      {isLinked ? (
        <View style={[styles.surface_sm, styles.surface_tinted, { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }]}>
          <View style={styles.linkBadge}>
            <LinkIcon />
          </View>
          <Text style={styles.linkStatus_text}>
            {linkedAlive
              ? 'Linked to a real account'
              : 'Linked account no longer exists'}
          </Text>
          {isEditing && (
            <TouchableOpacity onPress={handleUnlink}>
              <Text style={styles.linkStatus_action}>Unlink</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        isEditing && (
          <TouchableOpacity
            style={[styles.button_outline, styles.button_outline_link, { marginBottom: 8 }]}
            onPress={() => setLinkModalOpen(true)}
          >
            <LinkIcon size={18} color={colors.link} />
            <Text style={[styles.buttonText_outline, { color: colors.link }]}>Link to Real Account</Text>
          </TouchableOpacity>
        )
      )}

      {linkedAlive && (friend.linkedProfile.about ?? '').trim().length > 0 && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.header_section}>About</Text>
          <Text style={styles.readOnly_hint}>From their profile.</Text>
          <View style={[styles.surface_sm, { marginBottom: 4 }]}>
            <Text style={styles.readOnlyText}>{friend.linkedProfile.about}</Text>
          </View>
        </>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>My Notes</Text>
      <Text style={styles.readOnly_hint}>Only you can see these notes.</Text>
      {isEditing ? (
        <>
          <TextInput
            style={[styles.input_base, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Private notes about this friend (only you see these)"
          />
        </>
      ) : (
        <>
          {displayValue(notes)}
        </>
      )}

      {linkedAlive && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.header_section}>Their Allergies</Text>
          <Text style={styles.readOnly_hint}>From their profile.</Text>
          {theirAllergies.length === 0 ? (
            <Text style={styles.emptyText}>They haven&apos;t added any.</Text>
          ) : (
            theirAllergies.map((a) => (
              <View key={a.id} style={styles.allergyRow}>
                <Text style={[styles.recipeItem, { flex: 1 }]}>• {cap(a.name)}</Text>
                <View style={styles.severityChip}>
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: severityColor(a.severity) },
                    ]}
                  />
                  <Text style={styles.severityChipLabel}>{severityLabel(a.severity)}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>My Allergy Notes</Text>
      {linkedAlive ? (
        <Text style={styles.readOnly_hint}>
          Allergies you want to track for this friend.
        </Text>
      ) : (
        <Text style={styles.readOnly_hint}>
          Extra allergies you want to track for this friend. Only visible to you.
        </Text>
      )}

      {allergies.length === 0 && !isEditing && <Text style={[styles.display_fieldValue, styles.display_fieldEmpty]}>None</Text>}
      {allergies.map((a) => (
        <View key={a.id} style={styles.allergyRow}>
          <Text style={[styles.recipeItem, { flex: 1 }]}>• {cap(a.name)}</Text>
          <View style={styles.severityChip}>
            <View
              style={[
                styles.severityDot,
                { backgroundColor: severityColor(a.severity) },
              ]}
            />
            <Text style={styles.severityChipLabel}>{severityLabel(a.severity)}</Text>
          </View>
        </View>
      ))}
      {isEditing && (
        <TouchableOpacity
          style={[styles.button_outline, styles.button_outline_link, { marginVertical: 4 }]}
          onPress={() =>
            navigation.navigate('EditAllergies', { allergies, friendId: friendshipId })
          }
        >
          <Text style={[styles.buttonText_outline, { color: colors.primary }]}>
            Edit Allergies
          </Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <>
          {/* Expands to fill any leftover height so short content still
              pins the footer to the bottom of the screen; collapses to
              nothing once content is tall enough to need scrolling. */}
          <View style={{ flex: 1 }} />
          <View style={styles.friendProfile_dangerFooter}>
            <TouchableOpacity
              style={[styles.button_outline, styles.button_outline_danger]}
              onPress={handleDeleteFriend}
            >
              <TrashIcon size={18} />
              <Text style={[styles.buttonText_outline, { color: colors.danger }]}>Remove Friend</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Link-by-code modal */}
      <Modal
        visible={linkModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setLinkModalOpen(false);
          setCodeInput('');
        }}
      >
        <Pressable
          style={styles.modal_backdrop}
          onPress={() => {
            setLinkModalOpen(false);
            setCodeInput('');
          }}
        >
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Link to Real Account</Text>
            <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
              Ask your friend for their friend code (shown on their Profile screen).
            </Text>
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
            <View style={styles.modal_button_right}>
              <TouchableOpacity
                style={styles.modal_button}
                onPress={() => {
                  setLinkModalOpen(false);
                  setCodeInput('');
                }}
              >
                <Text style={styles.modal_buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modal_button}
                onPress={handleLink}
                disabled={busy}
              >
                <Text style={[styles.modal_buttonText, { color: colors.link, fontWeight: 'bold' }]}>
                  {busy ? 'Linking…' : 'Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

export default FriendProfile;
