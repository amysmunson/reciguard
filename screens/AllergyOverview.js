import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon, CheckboxIcon, FilterIcon } from '../components/icons';
import { useAuth } from '../lib/auth-context';
import { getFriends, friendDisplayName } from '../lib/api/friends';
import { getMyProfile } from '../lib/api/profile';
import {
  getActiveAllergyDetails,
  severityColor,
  severityLabel,
  SEVERITY_RANK,
} from '../lib/api/allergies';
import { loadJson, saveJson, KEYS } from '../lib/storage';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Summary of allergies for everyone you select from  popup checklist
// Done persists that selection (KEYS.allergyOverviewFilter) so it's restored next time you
// open this page. If nothing saved yet (first visit) defaults to everyone.
// filters it locally, so toggling doesn't keep calling server. Read only
const AllergyOverview = ({ navigation, route }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [myName, setMyName] = useState('Me');
  const [details, setDetails] = useState([]);
  const [includeSelf, setIncludeSelf] = useState(true);
  const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  // Snapshot of the selection when the popup opens, so a backdrop tap
  // reverts any in-flight toggles
  const [filterSnapshot, setFilterSnapshot] = useState(null);

  // Arriving from Home/FolderDetail's own allergy filter passes the people
  // that were checked there over the saved/default selection
  const seededFriendIds = route.params?.initialFriendIds;

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Load all the data we need in parallel, then set state once it's all ready
      const [profile, friendList, saved] = await Promise.all([
        getMyProfile(),
        getFriends(),
        loadJson(KEYS.allergyOverviewFilter(user.id), null),
      ]);
      const resolvedName = profile?.name?.trim() || 'Me';
      const allFriendIds = friendList.map((f) => f.id);

      const allDetails = await getActiveAllergyDetails({
        includeSelf: true,
        friendshipIds: allFriendIds,
        myName: resolvedName,
      });

      setFriends(friendList);
      setMyName(resolvedName);
      setDetails(allDetails);

      const seedIncludeSelf = !!route.params?.initialIncludeSelf;
      const seedIsEmpty = !seedIncludeSelf && (!seededFriendIds || seededFriendIds.length === 0);
      if (seededFriendIds !== undefined && !seedIsEmpty) {
        const validIds = new Set(allFriendIds);
        setIncludeSelf(seedIncludeSelf);
        setSelectedFriendIds(new Set(seededFriendIds.filter((id) => validIds.has(id))));
      } else if (seededFriendIds !== undefined) {
        // Seeded but empty, so default to everyone.
        setIncludeSelf(true);
        setSelectedFriendIds(new Set(allFriendIds));
      } else if (saved) {
        // otherwise restore the saved selection, dropping any friend ids that no longer exist
        const validIds = new Set(allFriendIds);
        setIncludeSelf(!!saved.includeSelf);
        setSelectedFriendIds(new Set((saved.friendIds ?? []).filter((id) => validIds.has(id))));
      } else {
        // Nothing saved yet, so default to everyone
        setIncludeSelf(true);
        setSelectedFriendIds(new Set(allFriendIds));
      }
    } catch (err) {
      Alert.alert('Could not load Dietary Needs Overview', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, seededFriendIds, route.params?.initialIncludeSelf]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Plain goBack() when opened from Friends; when opened from Home/
  // FolderDetail's own filter, return there with a signal to reopen it so
  // you land back in your selection menu instead of a bare screen.
  const handleBack = () => {
    const returnTo = route.params?.returnTo;
    if (returnTo) {
      navigation.navigate(returnTo.screen, { ...returnTo.params, reopenAllergyFilter: true });
    } else {
      navigation.goBack();
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

  const openFilter = () => {
    setFilterSnapshot({ includeSelf, selectedFriendIds: new Set(selectedFriendIds) });
    setFilterOpen(true);
  };

  // Done button — commit whatever is currently checked, and persist it
  const closeFilter = () => {
    setFilterSnapshot(null);
    setFilterOpen(false);
    if (user?.id) {
      saveJson(KEYS.allergyOverviewFilter(user.id), {
        includeSelf,
        friendIds: Array.from(selectedFriendIds),
      });
    }
  };

  // Backdrop tap — revert any in-flight toggles, close without committing.
  const dismissFilter = () => {
    if (filterSnapshot) {
      setIncludeSelf(filterSnapshot.includeSelf);
      setSelectedFriendIds(filterSnapshot.selectedFriendIds);
    }
    setFilterSnapshot(null);
    setFilterOpen(false);
  };

  // Roster includes everyone currently checked, even if they have no
  // allergies recorded — getActiveAllergyDetails only returns rows that
  // exist, so an empty-but-selected person still needs a "none" row.
  const groups = useMemo(() => {
    const allergiesByProfile = new Map();
    for (const d of details) {
      if (!allergiesByProfile.has(d.profileId)) allergiesByProfile.set(d.profileId, []);
      allergiesByProfile.get(d.profileId).push({ name: d.name, severity: d.severity });
    }

    const roster = [];
    if (includeSelf) roster.push({ profileId: 'self', profileName: myName });
    for (const f of friends) {
      if (selectedFriendIds.has(f.id)) {
        roster.push({ profileId: f.id, profileName: friendDisplayName(f) });
      }
    }
    roster.sort((a, b) => a.profileName.localeCompare(b.profileName));

    return roster.map((r) => ({
      ...r,
      allergies: (allergiesByProfile.get(r.profileId) ?? [])
        .slice()
        .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]),
    }));
  }, [details, includeSelf, selectedFriendIds, friends, myName]);

  return (
    <ScrollView
      style={[styles.screen_base, styles.screen_cardPad]}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_card]}
        onPress={handleBack}
      >
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={openFilter}
      >
        <FilterIcon size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.header_card}>Dietary Needs Overview</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : (
        <>
          {groups.length === 0 ? (
            <Text style={styles.emptyText}>
              Nobody selected. Tap the filter icon to choose who to show.
            </Text>
          ) : (
            groups.map((g) => (
              <View key={g.profileId} style={{ marginBottom: 20 }}>
                <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>
                  {g.profileName}
                </Text>
                {g.allergies.length === 0 ? (
                  <Text style={styles.emptyText}>No known dietary needs.</Text>
                ) : (
                  g.allergies.map((a, idx) => (
                    <View key={a.name + idx} style={styles.allergyRow}>
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
              </View>
            ))
          )}
        </>
      )}

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={dismissFilter}>
        <Pressable style={styles.modal_backdrop} onPress={dismissFilter}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Show dietary needs for</Text>
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
              <TouchableOpacity style={styles.modal_button} onPress={closeFilter}>
                <Text style={[styles.modal_buttonText, { color: colors.primary, fontWeight: 'bold' }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

export default AllergyOverview;
