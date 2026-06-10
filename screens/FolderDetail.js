import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, ScrollView, Pressable, TextInput, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { useAuth } from '../lib/auth-context';
import {
  getFolder,
  getRecipesInFolder,
  deleteFolder,
  removeRecipesFromFolder,
  addRecipesToFolder,
} from '../lib/api/folders';
import { getRecipes } from '../lib/api/recipes';
import { getFriends } from '../lib/api/friends';
import {
  getActiveAllergyDetails,
  dotsForRecipe,
  severityColor,
} from '../lib/api/allergies';
import { getMyProfile } from '../lib/api/profile';
import {
  BackIcon,
  CheckboxIcon,
  EllipsisIcon,
  FilterIcon,
  PlusIcon,
  RemoveCircleIcon,
  SearchIcon,
  SelectCircleIcon,
  SortIcon,
  TrashIcon,
} from '../components/icons';
import { loadJson, saveJson, KEYS, getRecipeOpenedMap } from '../lib/storage';
import SortMenu from '../components/SortMenu';
import {
  RECIPE_SORT_OPTIONS,
  DEFAULT_RECIPE_SORT,
  normalizeSort,
  sortRecipes,
} from '../lib/sort';

const FolderDetail = ({ route, navigation }) => {
  const { user } = useAuth();
  const { folderId, folderName: initialName } = route.params;
  const [folder, setFolder] = useState({ id: folderId, name: initialName });
  const [recipes, setRecipes] = useState([]);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Overflow menu (ellipsis) — currently just the delete-folder action.
  const [menuOpen, setMenuOpen] = useState(false);

  // Add-recipe picker — lists the user's recipes not already in this folder.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRecipes, setPickerRecipes] = useState([]);
  const [pickerSelected, setPickerSelected] = useState(new Set());

  // Allergy filter — shares Home's persisted selection (KEYS.homeAllergyFilter)
  // so toggling here and on Home stay consistent.
  const [filterOpen, setFilterOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [myName, setMyName] = useState('Me');
  const [includeSelf, setIncludeSelf] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
  const [filterHydrated, setFilterHydrated] = useState(false);
  // Snapshot of filter state when the modal opens, so backdrop-tap reverts.
  const [filterSnapshot, setFilterSnapshot] = useState(null);
  const [activeAllergies, setActiveAllergies] = useState([]);
  const filterActive = includeSelf || selectedFriendIds.size > 0;

  // Search state — query string only; the input lives in the action bar.
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state — { by, dir }. Recipes inside folders sort like Home does.
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(DEFAULT_RECIPE_SORT);
  const [openedMap, setOpenedMap] = useState({});

  const loadRecipes = useCallback(async () => {
    try {
      const [f, list] = await Promise.all([getFolder(folderId), getRecipesInFolder(folderId)]);
      setFolder(f);
      setRecipes(list);
    } catch (err) {
      Alert.alert('Could not load folder', err.message ?? 'Unknown error');
    }
  }, [folderId]);

  // Recompute the active-allergy details for the current filter selection.
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

  // Hydrate the saved sort selection (shared across all folders).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadJson(KEYS.folderRecipesSort(user.id), null);
      if (!cancelled) setSort(normalizeSort(saved, DEFAULT_RECIPE_SORT));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Hydrate the allergy filter from the same key Home persists to.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadJson(KEYS.homeAllergyFilter(user.id), {
        includeSelf: false,
        friendIds: [],
      });
      if (cancelled) return;
      setIncludeSelf(!!saved.includeSelf);
      setSelectedFriendIds(new Set(saved.friendIds ?? []));
      setFilterHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Refresh opened-at map on focus so sort-by-opened reflects recent views.
  const refreshOpenedMap = useCallback(async () => {
    if (!user?.id) return;
    setOpenedMap(await getRecipeOpenedMap(user.id));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
      refreshOpenedMap();
      if (filterHydrated) refreshActiveAllergies(includeSelf, selectedFriendIds);
    }, [
      loadRecipes,
      refreshOpenedMap,
      refreshActiveAllergies,
      includeSelf,
      selectedFriendIds,
      filterHydrated,
    ])
  );

  // --- Allergy filter helpers ---------------------------------------------
  const openFilter = async () => {
    try {
      const [friendList, profile] = await Promise.all([getFriends(), getMyProfile()]);
      setFriends(friendList);
      setMyName(profile?.name?.trim() || 'Me');
      // Snapshot so a backdrop tap reverts in-flight toggles.
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

  // Done button — persist to the shared key + refresh active allergies.
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

  const applySort = (next) => {
    setSort(next);
    if (user?.id) saveJson(KEYS.folderRecipesSort(user.id), next);
  };

  const sortedRecipes = sortRecipes(recipes, sort, openedMap);
  const displayedRecipes = searchQuery.trim()
    ? sortedRecipes.filter((r) =>
        (r.name ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : sortedRecipes;

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

  // --- Add-recipe picker --------------------------------------------------
  const openRecipePicker = async () => {
    try {
      const all = await getRecipes();
      const inFolder = new Set(recipes.map((r) => r.id));
      setPickerRecipes(all.filter((r) => !inFolder.has(r.id)));
      setPickerSelected(new Set());
      setPickerOpen(true);
    } catch (err) {
      Alert.alert('Could not load recipes', err.message ?? 'Unknown error');
    }
  };

  const togglePick = (id) => {
    setPickerSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = async () => {
    const ids = Array.from(pickerSelected);
    if (!ids.length) return;
    try {
      await addRecipesToFolder({ recipeIds: ids, folderId });
      setPickerOpen(false);
      loadRecipes();
      Alert.alert('Added', `${ids.length} recipe(s) added to this folder.`);
    } catch (err) {
      Alert.alert('Could not add to folder', err.message ?? 'Unknown error');
    }
  };

  const handleBulkRemove = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    Alert.alert(
      'Remove from folder?',
      `${ids.length} recipe(s) will be removed from this folder (recipes are not deleted).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeRecipesFromFolder({ recipeIds: ids, folderId });
              exitSelect();
              loadRecipes();
            } catch (err) {
              Alert.alert('Could not remove', err.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFolder = () => {
    Alert.alert('Delete folder?', 'Recipes inside are not deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFolder(folderId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not delete folder', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      {!selectMode && (
        <>
          <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
            <BackIcon style={styles.overlayIcon_sm} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteRecipeButton} onPress={() => setMenuOpen(true)}>
            <EllipsisIcon size={20} />
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.header_tab}>{folder?.name || 'Folder'}</Text>

      {selectMode ? (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={exitSelect}>
            <Text style={styles.selectBar_cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectBar_count}>{selectedIds.size} selected</Text>
          <TouchableOpacity onPress={handleBulkRemove} disabled={!selectedIds.size}>
            <RemoveCircleIcon
              color={selectedIds.size ? colors.danger : colors.iconDisabled}
            />
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.home_actionBar_iconButton} onPress={openFilter}>
            <FilterIcon
              size={22}
              color={filterActive ? colors.primary : colors.textSecondary}
            />
            {filterActive && <View style={styles.home_actionBar_iconDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.home_actionBar_iconButton} onPress={openRecipePicker}>
            <PlusIcon size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displayedRecipes}
        numColumns={2}
        renderItem={({ item }) => {
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
                        style={[
                          styles.allergyDot,
                          { backgroundColor: severityColor(d.severity) },
                        ]}
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
        }}
        extraData={{ selectedIds, selectMode, activeAllergies, searchQuery, sort, openedMap }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? `No recipes match "${searchQuery}".`
              : 'No recipes in this folder.'}
          </Text>
        }
      />

      <SortMenu
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        options={RECIPE_SORT_OPTIONS}
        sort={sort}
        onChange={applySort}
      />

      {/* Overflow menu — dropped from the ellipsis button */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.sort_popdown_backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.sort_popdown, styles.folderDetail_menu]} onPress={() => {}}>
            <TouchableOpacity
              style={styles.sort_popdown_row}
              onPress={() => {
                setMenuOpen(false);
                handleDeleteFolder();
              }}
            >
              <TrashIcon size={18} />
              <Text style={[styles.sort_popdown_rowText, { color: colors.danger }]}>
                Delete folder
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Allergy filter modal — same selection Home persists/reads */}
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
            <View style={styles.modal_button_right} >
            <TouchableOpacity style={styles.modal_button} onPress={closeFilter}>
              <Text style={[styles.modal_buttonText, { color: colors.primary, fontWeight: 'bold' }]}>
                Done
              </Text>
            </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add-recipe picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modal_backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Add recipes</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {pickerRecipes.length === 0 && (
                <Text style={styles.emptyText}>All your recipes are already in this folder.</Text>
              )}
              {pickerRecipes.map((r) => {
                const checked = pickerSelected.has(r.id);
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.filter_row}
                    onPress={() => togglePick(r.id)}
                  >
                    <CheckboxIcon checked={checked} />
                    <Text style={styles.filter_rowText}>{r.name || 'Untitled'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modal_button_right} >
            <TouchableOpacity style={styles.modal_button} onPress={() => setPickerOpen(false)}>
              <Text style={styles.modal_buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modal_button}
              onPress={handleAddSelected}
              disabled={!pickerSelected.size}
            >
              <Text
                style={[
                  styles.modal_buttonText,
                  { color: pickerSelected.size ? colors.primary : colors.iconDisabled, fontWeight: 'bold' },
                ]}
              >
                {pickerSelected.size ? `Add ${pickerSelected.size}` : 'Add'}
              </Text>
            </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default FolderDetail;
