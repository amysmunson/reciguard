import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import NavigationBar from '../components/NavigationBar';
import { startNewRecipe } from '../components/utils/addRecipe';
import { getRecipes, deleteRecipes } from '../lib/api/recipes';
import { getFolders, addRecipesToFolder } from '../lib/api/folders';
import { getFriends } from '../lib/api/friends';
import { getMyProfile } from '../lib/api/profile';
import {
  getActiveAllergyDetails,
  dotsForRecipe,
  severityColor,
} from '../lib/api/allergies';
import { loadJson, saveJson, KEYS, getRecipeOpenedMap } from '../lib/storage';
import { useCachedResource } from '../lib/cache';
import { useAuth } from '../lib/auth-context';
import { colors } from '../styles/theme';
import {
  CheckboxIcon,
  FilterIcon,
  FolderIcon,
  SearchIcon,
  SelectCircleIcon,
  SortIcon,
  TrashIcon,
} from '../components/icons';
import SortMenu from '../components/SortMenu';
import {
  RECIPE_SORT_OPTIONS,
  DEFAULT_RECIPE_SORT,
  normalizeSort,
  sortRecipes,
} from '../lib/sort';

const Home = ({ navigation }) => {
  const { user } = useAuth();
  const { data: recipesData } = useCachedResource({
    resource: 'recipes',
    userId: user?.id,
    fetcher: getRecipes,
  });
  const recipes = recipesData ?? [];

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Allergy filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [myName, setMyName] = useState('Me');
  const [includeSelf, setIncludeSelf] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
  const [activeAllergies, setActiveAllergies] = useState([]);
  const [filterHydrated, setFilterHydrated] = useState(false);
  // Snapshot of filter state when the modal opens, so backdrop-tap reverts.
  const [filterSnapshot, setFilterSnapshot] = useState(null);

  // Add-to-folder picker
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [folders, setFolders] = useState([]);

  // Search state — query string only; the input is always visible in the action bar
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state — { by, dir } where dir is 'asc' | 'desc'
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(DEFAULT_RECIPE_SORT);
  const [openedMap, setOpenedMap] = useState({});

  const refreshActiveAllergies = useCallback(async (self, friendIds) => {
    try {
      const details = await getActiveAllergyDetails({
        includeSelf: self,
        friendshipIds: Array.from(friendIds),
        myName: myName || 'Me',
      });
      setActiveAllergies(details);
    } catch (err) {
      Alert.alert('Could not load allergies', err.message ?? 'Unknown error');
    }
  }, [myName]);

  // Hydrate persisted filter + sort selection on mount (per-user).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadJson(KEYS.homeAllergyFilter(user.id), {
        includeSelf: false,
        friendIds: [],
      });
      const savedSort = await loadJson(KEYS.homeSort(user.id), null);
      if (cancelled) return;
      setIncludeSelf(!!saved.includeSelf);
      setSelectedFriendIds(new Set(saved.friendIds ?? []));
      setSort(normalizeSort(savedSort, DEFAULT_RECIPE_SORT));
      setFilterHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Refresh opened-at map on focus so sort-by-opened reflects recent views.
  const refreshOpenedMap = useCallback(async () => {
    if (!user?.id) return;
    const map = await getRecipeOpenedMap(user.id);
    setOpenedMap(map);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshOpenedMap();
      if (filterHydrated) refreshActiveAllergies(includeSelf, selectedFriendIds);
    }, [
      refreshOpenedMap,
      refreshActiveAllergies,
      includeSelf,
      selectedFriendIds,
      filterHydrated,
    ])
  );

  // --- Selection helpers --------------------------------------------------
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterSelect = (id) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleTilePress = (item) => {
    if (selectMode) toggleSelect(item.id);
    else navigation.navigate('RecipeCard', { recipeId: item.id });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    Alert.alert('Delete recipes?', `${ids.length} will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipes(ids);
            exitSelect();
          } catch (err) {
            Alert.alert('Could not delete', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  const openFolderPicker = async () => {
    try {
      const list = await getFolders();
      setFolders(list);
      setFolderPickerOpen(true);
    } catch (err) {
      Alert.alert('Could not load folders', err.message ?? 'Unknown error');
    }
  };

  const handleAddToFolder = async (folderId) => {
    const ids = Array.from(selectedIds);
    try {
      await addRecipesToFolder({ recipeIds: ids, folderId });
      setFolderPickerOpen(false);
      exitSelect();
      Alert.alert('Added', `${ids.length} recipe(s) added to folder.`);
    } catch (err) {
      Alert.alert('Could not add to folder', err.message ?? 'Unknown error');
    }
  };

  // --- Filter helpers -----------------------------------------------------
  const openFilter = async () => {
    try {
      const [friendList, profile] = await Promise.all([getFriends(), getMyProfile()]);
      setFriends(friendList);
      setMyName(profile?.name?.trim() || 'Me');
      // Snapshot so a backdrop tap reverts in-flight toggles
      setFilterSnapshot({
        includeSelf,
        selectedFriendIds: new Set(selectedFriendIds),
      });
      setFilterOpen(true);
    } catch (err) {
      Alert.alert('Could not load profiles', err.message ?? 'Unknown error');
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

  // Done button — commit pending toggles to storage + refresh active allergies.
  const closeFilter = () => {
    setFilterOpen(false);
    setFilterSnapshot(null);
    if (user?.id) {
      saveJson(KEYS.homeAllergyFilter(user.id), {
        includeSelf,
        friendIds: Array.from(selectedFriendIds),
      });
    }
    refreshActiveAllergies(includeSelf, selectedFriendIds);
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

  // --- Misc ---------------------------------------------------------------
  const handleAddRecipe = () => {
    startNewRecipe({ navigation });
  };

  const filterActive = includeSelf || selectedFriendIds.size > 0;

  // Sort recipes by the selected field + direction, then apply the search
  // filter. Missing values always sort to the bottom (see lib/sort).
  const sortedRecipes = sortRecipes(recipes, sort, openedMap);

  const displayedRecipes = searchQuery.trim()
    ? sortedRecipes.filter((r) =>
        (r.name ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : sortedRecipes;

  const applySort = (next) => {
    setSort(next);
    if (user?.id) saveJson(KEYS.homeSort(user.id), next);
  };

  const renderTile = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    const dots = filterActive ? dotsForRecipe(item, activeAllergies) : [];

    return (
      <TouchableOpacity
        onPress={() => handleTilePress(item)}
        onLongPress={() => enterSelect(item.id)}
        delayLongPress={300}
      >
        <View style={[styles.tile, isSelected && styles.tile_selected]}>
          <Text style={styles.tileText}>{item.name || 'Untitled'}</Text>

          {dots.length > 0 && (
            <View style={styles.allergyDotRow}>
              {dots.map((d) => (
                <View
                  key={d.profileId}
                  style={[styles.allergyDot, { backgroundColor: severityColor(d.severity) }]}
                />
              ))}
            </View>
          )}

          {selectMode && (
            <View style={styles.selectCheck}>
              <SelectCircleIcon selected={isSelected} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      <Text style={styles.header_tab}>Your Recipes</Text>

      {selectMode ? (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={exitSelect}>
            <Text style={styles.selectBar_cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectBar_count}>{selectedIds.size} selected</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={openFolderPicker}
              disabled={!selectedIds.size}
              style={{ marginRight: 16 }}
            >
              <FolderIcon color={selectedIds.size ? colors.primary : colors.iconDisabled} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBulkDelete} disabled={!selectedIds.size}>
              <TrashIcon
                size={22}
                color={selectedIds.size ? colors.danger : colors.iconDisabled}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.home_actionBar}>
          <View style={styles.home_actionBar_searchBox}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              style={styles.home_actionBar_searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor={colors.iconInactive}
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={styles.home_actionBar_iconButton}
            onPress={() => setSortOpen(true)}
          >
            <SortIcon size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.home_actionBar_iconButton}
            onPress={openFilter}
          >
            <FilterIcon
              size={22}
              color={filterActive ? colors.primary : colors.textSecondary}
            />
            {filterActive && <View style={styles.home_actionBar_iconDot} />}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displayedRecipes}
        numColumns={2}
        renderItem={renderTile}
        keyExtractor={(item) => item.id}
        extraData={{ selectedIds, selectMode, activeAllergies, searchQuery, sort, openedMap }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? `No recipes match "${searchQuery}".`
              : 'No recipes yet. Tap + to add one.'}
          </Text>
        }
      />

      {/* Sort menu */}
      <SortMenu
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        options={RECIPE_SORT_OPTIONS}
        sort={sort}
        onChange={applySort}
      />

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={dismissFilter}>
        <Pressable style={styles.modal_backdrop} onPress={dismissFilter}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Allergy warnings for</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <TouchableOpacity
                style={styles.filter_row}
                onPress={() => setIncludeSelf((v) => !v)}
              >
                <CheckboxIcon checked={includeSelf} />
                <Text style={styles.filter_rowText}>{myName} (you)</Text>
              </TouchableOpacity>

              {friends.map((f) => {
                const checked = selectedFriendIds.has(f.id);
                const label = f.linkedProfile?.name || f.friendName || 'Unnamed';
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={styles.filter_row}
                    onPress={() => toggleFriend(f.id)}
                  >
                    <CheckboxIcon checked={checked} />
                    <Text style={styles.filter_rowText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
              {friends.length === 0 && (
                <Text style={styles.emptyText}>No friends added yet.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modal_button} onPress={closeFilter}>
              <Text style={[styles.modal_buttonText, { color: colors.primary, fontWeight: 'bold' }]}>
                Done
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Folder picker modal */}
      <Modal
        visible={folderPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderPickerOpen(false)}
      >
        <Pressable
          style={styles.modal_backdrop}
          onPress={() => setFolderPickerOpen(false)}
        >
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Add to folder</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {folders.length === 0 && (
                <Text style={styles.emptyText}>No folders yet. Create one first.</Text>
              )}
              {folders.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.filter_row}
                  onPress={() => handleAddToFolder(f.id)}
                >
                  <FolderIcon size={20} />
                  <Text style={styles.filter_rowText}>{f.name || 'Untitled'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modal_button}
              onPress={() => setFolderPickerOpen(false)}
            >
              <Text style={styles.modal_buttonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <NavigationBar
        navigation={navigation}
        onAddPress={handleAddRecipe}
        onHomePress={() => setSearchQuery('')}
      />
    </View>
  );
};

export default Home;
