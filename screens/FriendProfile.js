import React, { useCallback, useEffect, useState } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import {
  getFriend,
  updateFriend,
  deleteFriend,
  linkFriendByCode,
  unlinkFriend,
  friendDisplayName,
} from '../lib/api/friends';
import {
  getFriendAllergies,
  getLinkedUserAllergies,
  addAllergy,
  deleteAllergy,
  updateAllergySeverity,
  severityColor,
  severityLabel,
  normalizeSeverity,
} from '../lib/api/allergies';
import AllergyChecklist from '../components/AllergyChecklist';

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

  const load = useCallback(async () => {
    try {
      const f = await getFriend(friendshipId);
      setFriend(f);
      setName(f.friendName ?? '');
      setNotes(f.friendNotes ?? '');
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

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      const updated = await updateFriend(friendshipId, {
        friendName: name,
        friendNotes: notes,
      });
      setFriend(updated);
      setIsEditing(false);
      Alert.alert('Saved');
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    load(); // revert any in-flight edits
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

  const handleAddBatch = async ({ items, severity }) => {
    if (!items?.length) return;
    try {
      await Promise.all(
        items.map(({ name, userCustom }) =>
          addAllergy({
            name,
            severity,
            friendId: friendshipId,
            userCustom,
          })
        )
      );
      const updated = await getFriendAllergies(friendshipId);
      setAllergies(updated);
    } catch (err) {
      Alert.alert('Could not add allergies', err.message ?? 'Unknown error');
    }
  };

  const handleCycleSeverity = async (allergy) => {
    const order = ['unknown', 'mild', 'moderate', 'severe'];
    const current = normalizeSeverity(allergy.severity);
    const next = order[(order.indexOf(current) + 1) % order.length];
    const dbValue = next === 'unknown' ? null : next;
    try {
      await updateAllergySeverity(allergy.id, dbValue);
      setAllergies((prev) =>
        prev.map((a) => (a.id === allergy.id ? { ...a, severity: dbValue } : a))
      );
    } catch (err) {
      Alert.alert('Could not update severity', err.message ?? 'Unknown error');
    }
  };

  const handleRemoveAllergy = async (id) => {
    try {
      await deleteAllergy(id);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      Alert.alert('Could not remove allergy', err.message ?? 'Unknown error');
    }
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
      <View style={styles.card_container}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const isLinked = !!friend.existingFriendId;
  const linkedAlive = !!friend.linkedProfile;
  const displayName = friendDisplayName(friend);

  const displayValue = (val) =>
    val && val.trim().length > 0 ? (
      <Text style={styles.display_fieldValue}>{val}</Text>
    ) : (
      <Text style={[styles.display_fieldValue, styles.display_fieldEmpty]}>Not set</Text>
    );

  return (
    <ScrollView
      style={styles.card_container}
      contentContainerStyle={{ paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <TouchableOpacity style={styles.card_backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" style={styles.card_backIcon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card_edit}
        onPress={isEditing ? handleCancel : () => setIsEditing(true)}
      >
        <Text style={styles.card_editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
      </TouchableOpacity>

      <Text style={styles.card_header}>{displayName}</Text>

      {isLinked ? (
        <View style={styles.linkStatus_row}>
          <View style={styles.linkBadge}>
            <Icon name="link" size={12} color={colors.textOnPrimary} />
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
            style={styles.linkAccountButton}
            onPress={() => setLinkModalOpen(true)}
          >
            <Icon name="link" size={18} color={colors.link} />
            <Text style={styles.linkAccountButton_text}>Link to Real Account</Text>
          </TouchableOpacity>
        )
      )}

      {!isLinked && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.subheading}>Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Friend's name"
            />
          ) : (
            displayValue(name)
          )}
        </>
      )}

      {linkedAlive && (friend.linkedProfile.notes ?? '').trim().length > 0 && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.subheading}>About them</Text>
          <View style={styles.readOnlyBlock}>
            <Text style={styles.readOnlyText}>{friend.linkedProfile.notes}</Text>
          </View>
          <Text style={styles.readOnly_hint}>From their profile.</Text>
        </>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.subheading}>My Notes</Text>
      {isEditing ? (
        <>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Private notes about this friend (only you see these)"
          />
          <Text style={styles.readOnly_hint}>Only you can see these notes.</Text>
        </>
      ) : (
        <>
          {displayValue(notes)}
          <Text style={styles.readOnly_hint}>Only you can see these notes.</Text>
        </>
      )}

      {isEditing && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.success, padding: 12, marginTop: 10 }]}
          onPress={handleSave}
        >
          <Text style={[styles.addButtonText, { color: colors.textOnPrimary, fontWeight: 'bold' }]}>
            Save
          </Text>
        </TouchableOpacity>
      )}

      {linkedAlive && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.subheading}>Their Allergies</Text>
          {theirAllergies.length === 0 ? (
            <Text style={styles.emptyText}>They haven&apos;t added any.</Text>
          ) : (
            theirAllergies.map((a) => (
              <View key={a.id} style={styles.allergyRow}>
                <Text style={[styles.ingredientItems, { flex: 1 }]}>• {cap(a.name)}</Text>
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
          <Text style={styles.readOnly_hint}>From their profile.</Text>
        </>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.subheading}>My Allergy Notes</Text>
      {allergies.length === 0 && <Text style={styles.emptyText}>None added.</Text>}
      {allergies.map((a) => (
        <View key={a.id} style={styles.allergyRow}>
          <Text style={[styles.ingredientItems, { flex: 1 }]}>• {cap(a.name)}</Text>
          <TouchableOpacity
            onPress={() => isEditing && handleCycleSeverity(a)}
            disabled={!isEditing}
            style={styles.severityChip}
          >
            <View
              style={[
                styles.severityDot,
                { backgroundColor: severityColor(a.severity) },
              ]}
            />
            <Text style={styles.severityChipLabel}>{severityLabel(a.severity)}</Text>
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity onPress={() => handleRemoveAllergy(a.id)} style={styles.deleteButton}>
              <Icon name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      {isEditing && (
        <AllergyChecklist
          existingNames={allergies.map((a) => a.name)}
          onConfirm={handleAddBatch}
        />
      )}
      <Text style={styles.readOnly_hint}>
        Extra allergies you want to track for this friend.
      </Text>

      <Text style={styles.spacing} />
      <Text style={styles.spacing} />

      {isEditing && (
        <TouchableOpacity style={styles.removeFriendButton} onPress={handleDeleteFriend}>
          <Icon name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.removeFriendButton_text}>Remove Friend</Text>
        </TouchableOpacity>
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
          <Pressable style={styles.modal_card} onPress={() => {}}>
            <Text style={styles.modal_title}>Link to Real Account</Text>
            <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
              Ask your friend for their friend code (shown on their Profile screen).
            </Text>
            <TextInput
              style={[styles.auth_input, styles.codeInput]}
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
