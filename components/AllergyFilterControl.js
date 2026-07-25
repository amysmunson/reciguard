import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { AllergyListIcon, CheckboxIcon, FilterIcon } from './icons';
import { useAuth } from '../lib/auth-context';
import { getFriends, friendDisplayName } from '../lib/api/friends';
import { getMyProfile } from '../lib/api/profile';
import { loadJson, saveJson, KEYS } from '../lib/storage';

// Self-contained "Allergy warnings for" control — the FilterIcon trigger
// (with its active-dot) plus the popup checklist, shared by Home and
// FolderDetail so this logic (and the persisted selection, which both
// screens read/write to the same KEYS.homeAllergyFilter key) only exists
// once. The parent doesn't own the selection; it's told about it via
// onSelectionChange whenever it's known — once after hydrating on mount,
// and again whenever Done is pressed — and is expected to use that to
// refresh whatever it derives from it (e.g. recipe-tile allergy dots).
//
// Props:
//   navigation, route — passed straight from the host screen; route is
//     watched for `reopenAllergyFilter`, set by AllergyOverview's back
//     button so this control reopens instead of returning to a bare screen.
//   returnTo — { screen, params } identifying the host screen, embedded in
//     the navigation to AllergyOverview so its back button knows where (and
//     how) to return.
//   onSelectionChange(includeSelf, selectedFriendIds) — called after the
//     saved selection hydrates, and again after Done.
const AllergyFilterControl = ({ navigation, route, returnTo, onSelectionChange }) => {
  const { user } = useAuth();
  const [filterOpen, setFilterOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [myName, setMyName] = useState('Me');
  const [includeSelf, setIncludeSelf] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
  // Snapshot of the selection when the popup opens, so a backdrop tap
  // reverts any in-flight toggles instead of keeping them.
  const [filterSnapshot, setFilterSnapshot] = useState(null);
  const filterActive = includeSelf || selectedFriendIds.size > 0;

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Hydrate the persisted selection once on mount.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadJson(KEYS.homeAllergyFilter(user.id), {
        includeSelf: false,
        friendIds: [],
      });
      if (cancelled) return;
      const self = !!saved.includeSelf;
      const ids = new Set(saved.friendIds ?? []);
      setIncludeSelf(self);
      setSelectedFriendIds(ids);
      onSelectionChangeRef.current?.(self, ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Returning from AllergyOverview's back button lands here with this
  // param set — reopen the popup instead of leaving a bare screen.
  useEffect(() => {
    if (route.params?.reopenAllergyFilter) {
      navigation.setParams({ reopenAllergyFilter: undefined });
      openFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.reopenAllergyFilter]);

  const openFilter = async () => {
    try {
      const [friendList, profile] = await Promise.all([getFriends(), getMyProfile()]);
      setFriends(friendList);
      setMyName(profile?.name?.trim() || 'Me');
      // Snapshot so a backdrop tap reverts in-flight toggles.
      setFilterSnapshot({ includeSelf, selectedFriendIds: new Set(selectedFriendIds) });
      setFilterOpen(true);
    } catch {
      // Best-effort — the icon just won't open a populated list this time.
    }
  };

  const toggleFriend = (id) => {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Done button — persist + notify the host.
  const closeFilter = () => {
    setFilterOpen(false);
    setFilterSnapshot(null);
    if (user?.id) {
      saveJson(KEYS.homeAllergyFilter(user.id), {
        includeSelf,
        friendIds: Array.from(selectedFriendIds),
      });
    }
    onSelectionChangeRef.current?.(includeSelf, selectedFriendIds);
  };

  // Backdrop tap — revert any in-flight toggles, close without saving.
  const dismissFilter = () => {
    if (filterSnapshot) {
      setIncludeSelf(filterSnapshot.includeSelf);
      setSelectedFriendIds(filterSnapshot.selectedFriendIds);
    }
    setFilterSnapshot(null);
    setFilterOpen(false);
  };

  const openAllergyOverview = () => {
    setFilterOpen(false);
    navigation.navigate('AllergyOverview', {
      initialIncludeSelf: includeSelf,
      initialFriendIds: Array.from(selectedFriendIds),
      returnTo,
    });
  };

  return (
    <>
      <TouchableOpacity style={styles.home_actionBar_iconButton} onPress={openFilter}>
        <FilterIcon size={22} color={filterActive ? colors.primary : colors.textSecondary} />
        {filterActive && <View style={styles.home_actionBar_iconDot} />}
      </TouchableOpacity>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={dismissFilter}>
        <Pressable style={styles.modal_backdrop} onPress={dismissFilter}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Filter on Profiles</Text>
            <Text style={[styles.readOnly_hint, { marginBottom: 8 }]}>
              Warning dots are a best-effort ingredient match. Some restrictions are harder to
              catch automatically (like corn in the corn syrup of marshmallows). Always check the 
              specific ingredients yourself.
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <TouchableOpacity
                style={styles.filter_row}
                onPress={() => setIncludeSelf((v) => !v)}
              >
                <CheckboxIcon checked={includeSelf} />
                <Text style={styles.filter_rowText}>{myName} (you)</Text>
              </TouchableOpacity>

              {friends.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.filter_row}
                  onPress={() => toggleFriend(f.id)}
                >
                  <CheckboxIcon checked={selectedFriendIds.has(f.id)} />
                  <Text style={styles.filter_rowText}>{friendDisplayName(f)}</Text>
                </TouchableOpacity>
              ))}
              {friends.length === 0 && (
                <Text style={styles.emptyText}>No friends added yet.</Text>
              )}
            </ScrollView>
            <View style={styles.modal_button_right}>
              <TouchableOpacity
                style={[styles.modal_button, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={openAllergyOverview}
              >
                <AllergyListIcon size={18} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.modal_buttonText, { color: colors.primary, fontWeight: 'bold' }]}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modal_button} onPress={closeFilter}>
                <Text style={[styles.modal_buttonText, { color: colors.primary, fontWeight: 'bold' }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default AllergyFilterControl;
