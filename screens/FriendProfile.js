import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon, CopyIcon, EditIcon, LinkIcon, RestoreIcon, TrashIcon } from '../components/icons';
import {
  getFriend,
  getCachedFriendIdentity,
  cacheFriendIdentity,
  uncacheFriendIdentity,
  updateFriend,
  deleteFriend,
  duplicateFriend,
  linkFriendByCode,
  unlinkFriend,
} from '../lib/server/api/friends';
import {
  getFriendAllergies,
  getLinkedUserAllergies,
  severityColor,
  severityLabel,
} from '../lib/server/api/allergies';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../lib/server/auth-context';
import { EditHeader } from '../components/EditHeader';
import StatusScreen from '../components/StatusScreen';
import SectionHeading from '../components/SectionHeading';
import { useUnsavedChangesGuard, useRegisterUnsaved } from '../lib/app/unsavedChanges';
import { alertSaveFailed, isOfflineError, alertLoadFailed, alertActionFailed, pingServer } from '../lib/server/connectivity';
import { usePullToRefresh } from '../lib/server/usePullToRefresh';
import { appAlert } from '../lib/app/dialog';
import AppModal from '../components/AppModal';

const normalizeCode = (s) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const FriendProfile = ({ route, navigation }) => {
  const { friendshipId } = route.params;
  const { user } = useAuth();
  const userId = user?.id;
  const [friend, setFriend] = useState(null);
  // Edit is enabled only once server data is in.
  const [serverLoaded, setServerLoaded] = useState(false);
  const serverLoadedRef = useRef(false);
  // Cached { id, name } shown until the full profile arrives.
  const [identity, setIdentity] = useState(null);
  const identityShownRef = useRef(false);
  // The server couldn't be reached and only the cached name is showing.
  const [detailsFailed, setDetailsFailed] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  // Your dietary-need notes for this friend, and their own public ones.
  // null until loaded, so the sections stay blank rather than flashing "None".
  const [allergies, setAllergies] = useState(null);
  const [theirAllergies, setTheirAllergies] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  // Typed-but-unsaved modal input: hold off a theme remount (lib/app/unsavedChanges.js).
  useRegisterUnsaved(linkModalOpen && !!codeInput);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState({ name: '', notes: '' });
  const [confirmDiscardVisible, setConfirmDiscardVisible] = useState(false);

  // Shows a full profile snapshot ({ friend, allergies, theirAllergies }) in
  // one go, so the screen never fills in piece by piece.
  const applyProfile = useCallback(({ friend: f, allergies: mine, theirAllergies: theirs }, preserveEdits) => {
    setFriend(f);
    // While actively editing, a focus-triggered reload (e.g. returning
    // from EditAllergies) should only refresh the allergy lists, not
    // clobber whatever's currently typed into the name/notes fields.
    if (!preserveEdits) {
      setName(f.friendName ?? '');
      setNotes(f.friendNotes ?? '');
      setBaseline({ name: f.friendName ?? '', notes: f.friendNotes ?? '' });
    }
    setAllergies(mine);
    setTheirAllergies(theirs);
  }, []);

  // Only the friend's identity ({ id, name }) is cached — enough to show the
  // right name instantly. Everything else (notes, both dietary-needs lists)
  // always comes from the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await getCachedFriendIdentity(userId, friendshipId);
      if (cancelled || !cached || serverLoadedRef.current) return;
      identityShownRef.current = true;
      setIdentity(cached);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, friendshipId]);

  // Always fetches the full profile from the server (on open and each focus,
  // quietly) and refreshes the cached name. A failure with the name already
  // on screen just says details need a connection; with nothing to show, it
  // alerts.
  const load = useCallback(async ({ preserveEdits = false } = {}) => {
    // Nothing from the server on screen yet: a quick reachability check
    // first, so offline shows the message in seconds instead of waiting out
    // the full requests.
    if (!serverLoadedRef.current && !(await pingServer())) {
      setDetailsFailed(true);
      return;
    }
    try {
      const f = await getFriend(friendshipId);
      const [mine, theirs] = await Promise.all([
        getFriendAllergies(friendshipId),
        f.linkedProfile?.id ? getLinkedUserAllergies(f.linkedProfile.id).catch(() => []) : [],
      ]);
      serverLoadedRef.current = true;
      applyProfile({ friend: f, allergies: mine, theirAllergies: theirs }, preserveEdits);
      setServerLoaded(true);
      setDetailsFailed(false);
      cacheFriendIdentity(userId, f);
    } catch (err) {
      if (err?.message === 'Friend not found') {
        uncacheFriendIdentity(userId, friendshipId);
        appAlert('Friend not found', 'This friend may have been removed.');
        return;
      }
      if (serverLoadedRef.current) return; // keep what's on screen
      // Offline, or a cached name is showing: say so on screen, no popup.
      if (identityShownRef.current || isOfflineError(err)) {
        setDetailsFailed(true);
        return;
      }
      alertLoadFailed(err, 'Could not load friend');
    }
  }, [friendshipId, userId, applyProfile]);

  const isDirty = name !== baseline.name || notes !== baseline.notes;

  // Retry from the loading / couldn't-load screen.
  const retryControl = usePullToRefresh(() => load());

  // The in-screen back button only leaves edit mode (handleBackPress below);
  // this covers actually leaving the screen mid-edit — swipe back, Android
  // back, or popping the stack from elsewhere.
  const { discardModalProps, leaveWithoutPrompt } = useUnsavedChangesGuard({
    navigation,
    isDirty: isEditing && isDirty,
  });

  // Refreshes on every focus (not just mount) so allergy edits made on
  // EditAllergies — which saves straight to the database itself — show up
  // here as soon as you navigate back.
  useFocusEffect(
    useCallback(() => {
      load({ preserveEdits: isEditing });
    }, [load, isEditing])
  );

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const updated = await updateFriend(friendshipId, {
        friendName: name,
        friendNotes: notes,
      });
      setFriend(updated);
      setIsEditing(false);
      setBaseline({ name, notes });
    } catch (err) {
      alertSaveFailed(err);
    } finally {
      setSaving(false);
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
      appAlert('Bad code', 'A friend code is 8 characters.');
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
      alertActionFailed(err, 'Could not link');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = () => {
    appAlert(
      'Unlink this friend?',
      "Their profile data won't update for you anymore, but your notes and dietary needs stay.",
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
              alertActionFailed(err, 'Could not unlink');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFriend = () => {
    appAlert('Remove friend?', 'This deletes your notes and dietary needs for them.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFriend(friendshipId);
            leaveWithoutPrompt(() => navigation.goBack());
          } catch (err) {
            alertActionFailed(err, 'Could not remove friend');
          }
        },
      },
    ]);
  };

  // Before the full profile arrives: the cached name (if any) as the title,
  // plus the shared loading message — never a stale copy of their notes or
  // dietary needs. Pull down to try again.
  if (!friend) {
    let message = 'Loading…';
    if (detailsFailed) {
      message = identity
        ? "Couldn't load their notes and dietary needs. Connect to the internet, then pull down to try again."
        : "Couldn't load this friend. Connect to the internet, then pull down to try again.";
    }
    return (
      <StatusScreen
        title={identity?.name}
        message={message}
        onBack={handleBackPress}
        refreshControl={retryControl}
        backIconStyle={styles.overlayIcon_sm}
      />
    );
  }

  const isLinked = !!friend.existingFriendId;
  const linkedAlive = !!friend.linkedProfile;
  // A linked friend who set their own name overrides the user's local name
  // and can't be edited here. Otherwise the name behaves like Profile's.
  const friendSetOwnName = (friend.linkedProfile?.name ?? '').trim().length > 0;

  // ⋯ → Duplicate friend: a new, unlinked friend with what's on screen (name,
  // notes — unsaved edits included) plus the dietary needs you track for them.
  const makeDuplicate = async () => {
    try {
      const base = friendSetOwnName ? friend.linkedProfile.name : name.trim() || 'Unnamed Friend';
      const copy = await duplicateFriend(friendshipId, {
        friendName: `${base} (copy)`,
        friendNotes: notes,
      });
      leaveWithoutPrompt(() => navigation.replace('FriendProfile', { friendshipId: copy.id }));
    } catch (err) {
      alertSaveFailed(err, 'Could not duplicate friend');
    }
  };

  const handleDuplicate = () => {
    const what = isDirty
      ? 'The copy will include your unsaved edits; this friend stays as last saved.'
      : 'The copy gets your notes and the dietary needs you track for them.';
    const linkNote = isLinked
      ? " It won't be linked to their account, and their own shared dietary needs aren't copied."
      : '';
    appAlert('Duplicate friend?', what + linkNote, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Duplicate', onPress: makeDuplicate },
    ]);
  };

  const menuActions = [
    ...(allergies
      ? [
          {
            key: 'allergies',
            label: 'Edit dietary needs',
            icon: <EditIcon size={18} color={colors.textSecondary} />,
            onPress: () => navigation.navigate('EditAllergies', { allergies, friendId: friendshipId }),
          },
        ]
      : []),
    { key: 'duplicate', label: 'Duplicate friend', icon: <CopyIcon />, onPress: handleDuplicate },
    ...(isDirty
      ? [
          {
            key: 'discard',
            label: 'Discard changes',
            icon: <RestoreIcon color={colors.textSecondary} />,
            onPress: () => setConfirmDiscardVisible(true),
          },
        ]
      : []),
    {
      key: 'remove',
      label: 'Remove friend',
      icon: <TrashIcon size={18} />,
      onPress: handleDeleteFriend,
      danger: true,
    },
  ];

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
      {isEditing ? (
        <EditHeader
          onBack={handleBackPress}
          onSave={handleSave}
          saving={saving}
          menuActions={menuActions}
        />
      ) : (
        <>
          <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_card]} onPress={handleBackPress}>
            <BackIcon style={styles.overlayIcon_sm} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.overlay_base, styles.overlay_topRight_card]}
            onPress={() => setIsEditing(true)}
            disabled={!serverLoaded}
          >
            <Text style={[styles.overlayText, !serverLoaded && { opacity: 0.4 }]}>Edit</Text>
          </TouchableOpacity>
        </>
      )}

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
        <View style={[styles.surface_sm, styles.surface_tinted, { flexDirection: 'row', alignItems: 'center', marginVertical: 4 }]}>
          <View style={styles.linkBadge}>
            <LinkIcon />
          </View>
          <Text style={styles.linkStatus_text}>
            {linkedAlive
              ? 'Linked to another account'
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
            style={[styles.button_outline, styles.button_outline_link, { marginVertical: 4 }]}
            onPress={() => setLinkModalOpen(true)}
          >
            <LinkIcon size={18} color={colors.link} />
            <Text style={[styles.buttonText_outline, { color: colors.link }]}>Link to Friend&apos;s Account</Text>
          </TouchableOpacity>
        )
      )}

      {linkedAlive && (friend.linkedProfile.about ?? '').trim().length > 0 && (
        <>
          <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>About</Text>
          <Text style={styles.readOnly_hint}>From their profile.</Text>
          <Text style={styles.display_fieldValue}>{friend.linkedProfile.about}</Text>
        </>
      )}

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>My Notes</Text>
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
          <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>Their Dietary Needs</Text>
          <Text style={styles.readOnly_hint}>From their profile.</Text>
          {theirAllergies === null ? null : theirAllergies.length === 0 ? (
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

      <SectionHeading
        title="My Dietary Need Notes"
        actionLabel={isEditing && allergies ? 'Edit' : null}
        onAction={() =>
          navigation.navigate('EditAllergies', { allergies, friendId: friendshipId })
        }
        accessibilityLabel="Edit dietary need notes"
      />
      {linkedAlive ? (
        <Text style={styles.readOnly_hint}>
          Dietary needs you want to track for this friend.
        </Text>
      ) : (
        <Text style={styles.readOnly_hint}>
          Extra dietary needs you want to track for this friend. Only visible to you.
        </Text>
      )}

      {allergies?.length === 0 && !isEditing && <Text style={[styles.display_fieldValue, styles.display_fieldEmpty]}>None</Text>}
      {(allergies ?? []).map((a) => (
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


      {/* Link-by-code modal */}
      <AppModal
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
          <Pressable style={styles.surface_modal} onPress={() => { }}>
            <Text style={styles.header_modal}>Link to Existing Account</Text>
            <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
              Ask your friend for their friend code (shown on their Profile screen).
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
      </AppModal>

      <ConfirmModal
        visible={confirmDiscardVisible}
        title="Discard changes?"
        message="Your edits haven't been saved."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={handleDiscard}
        onCancel={() => setConfirmDiscardVisible(false)}
      />
      <ConfirmModal {...discardModalProps} />
    </ScrollView>
  );
};

export default FriendProfile;
