import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { useAuth } from '../lib/server/auth-context';
import {
  getFolder,
  getRecipesInFolder,
  deleteFolder,
  updateFolder,
  removeRecipesFromFolder,
  addRecipesToFolder,
} from '../lib/server/api/folders';
import {
  getRecipes,
  getTrashedRecipes,
  setRecipesFavorite,
  restoreRecipes,
  deleteRecipesForever,
  emptyTrash,
  TRASH_RETENTION_DAYS,
} from '../lib/server/api/recipes';
import { useHideUnsafe, applyDietaryVisibility } from '../lib/app/useHideUnsafe';
import {
  getActiveAllergyDetails,
  dotsForRecipe,
  severityColor,
} from '../lib/server/api/allergies';
import { getMyProfile } from '../lib/server/api/profile';
import {
  BackIcon,
  CheckboxIcon,
  EditIcon,
  EllipsisIcon,
  PlusIcon,
  RemoveCircleIcon,
  RestoreIcon,
  SearchIcon,
  SelectCircleIcon,
  SortIcon,
  StarIcon,
  TrashIcon,
} from '../components/icons';
import { loadJson, saveJson, KEYS, getRecipeOpenedMap } from '../lib/app/storage';
import { readCachedResource, useCachedResource } from '../lib/app/cache';
import { usePullToRefresh } from '../lib/server/usePullToRefresh';
import AllergyFilterControl from '../components/AllergyFilterControl';
import SortMenu from '../components/SortMenu';
import { confirmDiscard, useRegisterUnsaved } from '../lib/app/unsavedChanges';
import { alertSaveFailed } from '../lib/server/connectivity';
import {
  RECIPE_SORT_OPTIONS,
  DEFAULT_RECIPE_SORT,
  normalizeSort,
  sortRecipes,
} from '../lib/app/sort';
import { appAlert } from '../lib/app/dialog';
import AppModal from '../components/AppModal';

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Built-in folders (shown first on Folders; can't be renamed or deleted).
// Opened as FolderDetail with route.params.systemFolder set:
//   favorites — every starred recipe; + stars more, "remove" unstars
//   trash     — "Recently Deleted": deleted recipes; restore or delete forever
export const SYSTEM_FOLDERS = {
  favorites: { name: 'Favorites' },
  trash: { name: 'Recently Deleted' },
};

const FolderDetail = ({ route, navigation }) => {
  const { user } = useAuth();
  const { folderId = null, folderName: initialName, systemFolder = null } = route.params;
  const isFavorites = systemFolder === 'favorites';
  const isTrash = systemFolder === 'trash';
  const isSystem = !!systemFolder;
  const hideUnsafe = useHideUnsafe(user?.id);
  const [folder, setFolder] = useState({
    id: folderId,
    name: isSystem ? SYSTEM_FOLDERS[systemFolder].name : initialName,
  });
  // null until something has loaded (cache or server), so the empty-folder
  // message doesn't flash before data arrives.
  const [loadedRecipes, setLoadedRecipes] = useState(null);
  const recipes = loadedRecipes ?? [];

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Overflow menu (ellipsis) — rename and delete.
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Add-recipe picker — lists the user's recipes not already in this folder.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRecipes, setPickerRecipes] = useState([]);
  const [pickerSelected, setPickerSelected] = useState(new Set());

  // Allergy filter — selection itself lives in AllergyFilterControl (shared
  // with Home, same persisted key); it reports the selection here via
  // onSelectionChange so tile dots can be computed.
  const [allergySelection, setAllergySelection] = useState({
    includeSelf: false,
    selectedFriendIds: new Set(),
  });
  const [allergySelectionReady, setAllergySelectionReady] = useState(false);
  const [activeAllergies, setActiveAllergies] = useState([]);
  const filterActive = allergySelection.includeSelf || allergySelection.selectedFriendIds.size > 0;

  // Search state — query string only; the input lives in the action bar.
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state — { by, dir }. Recipes inside folders sort like Home does.
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(DEFAULT_RECIPE_SORT);
  const [openedMap, setOpenedMap] = useState({});

  const { data: profile } = useCachedResource({
    resource: 'profile',
    userId: user?.id,
    fetcher: getMyProfile,
  });
  const contrast = !!profile?.contrast;

  const loadRecipes = useCallback(async () => {
    try {
      let list;
      if (isFavorites) {
        list = (await getRecipes()).filter((r) => r.isFavorite);
      } else if (isTrash) {
        list = await getTrashedRecipes();
      } else {
        const [f, inFolder] = await Promise.all([getFolder(folderId), getRecipesInFolder(folderId)]);
        list = inFolder;
        setFolder((prev) => (sameJson(prev, f) ? prev : f));
      }
      // Only update what changed, so a background refresh is invisible
      // when the cached first paint was already current.
      setLoadedRecipes((prev) => (sameJson(prev, list) ? prev : list));
    } catch (err) {
      appAlert('Could not load folder', err.message ?? 'Unknown error');
    }
  }, [folderId, isFavorites, isTrash]);

  // First paint from cache while loadRecipes fetches from the server:
  // Home's cached recipe list, joined with the cached folder memberships
  // (regular folder) or filtered to starred recipes (Favorites). Trash isn't
  // cached — it's small and server-only.
  useEffect(() => {
    if (!user?.id || isTrash) return;
    let cancelled = false;
    (async () => {
      const [list, members] = await Promise.all([
        readCachedResource('recipes', user.id),
        isFavorites ? null : readCachedResource('folderMembers', user.id),
      ]);
      if (cancelled || !list || (!isFavorites && !members)) return;
      const ids = isFavorites ? null : new Set(members[folderId] ?? []);
      setLoadedRecipes(
        (prev) => prev ?? list.filter((r) => (isFavorites ? r.isFavorite : ids.has(r.id)))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, folderId, isFavorites, isTrash]);

  // Recompute the active-allergy details for the current filter selection.
  const refreshActiveAllergies = useCallback(async (self, friendIds) => {
    try {
      const details = await getActiveAllergyDetails({
        includeSelf: self,
        friendshipIds: Array.from(friendIds),
        myName: 'Me',
      });
      setActiveAllergies(details);
    } catch (err) {
      appAlert('Could not load dietary needs', err.message ?? 'Unknown error');
    }
  }, []);

  const handleAllergySelectionChange = useCallback((self, friendIds) => {
    setAllergySelection({ includeSelf: self, selectedFriendIds: friendIds });
    setAllergySelectionReady(true);
  }, []);

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

  // Refresh opened-at map on focus so sort-by-opened reflects recent views.
  const refreshOpenedMap = useCallback(async () => {
    if (!user?.id) return;
    setOpenedMap(await getRecipeOpenedMap(user.id));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
      refreshOpenedMap();
      if (allergySelectionReady) {
        refreshActiveAllergies(allergySelection.includeSelf, allergySelection.selectedFriendIds);
      }
    }, [
      loadRecipes,
      refreshOpenedMap,
      refreshActiveAllergies,
      allergySelection,
      allergySelectionReady,
    ])
  );

  // Pull down to refetch the folder, opened times, and allergy dots.
  const refreshControl = usePullToRefresh(() =>
    Promise.all([
      loadRecipes(),
      refreshOpenedMap(),
      allergySelectionReady &&
        refreshActiveAllergies(allergySelection.includeSelf, allergySelection.selectedFriendIds),
    ])
  );

  const applySort = (next) => {
    setSort(next);
    if (user?.id) saveJson(KEYS.folderRecipesSort(user.id), next);
  };

  const sortedRecipes = sortRecipes(recipes, sort, openedMap);
  const searchedRecipes = searchQuery.trim()
    ? sortedRecipes.filter((r) =>
        (r.name ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : sortedRecipes;
  // Settings → hide (rather than flag) conflicting recipes. Not in Trash,
  // where you need to see everything to restore or delete it.
  const { visible: displayedRecipes, hiddenCount } = applyDietaryVisibility(searchedRecipes, {
    hide: hideUnsafe && !isTrash,
    filterActive,
    activeAllergies,
  });

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
  // Regular folder: recipes not in it yet. Favorites: recipes not starred.
  const openRecipePicker = async () => {
    try {
      const all = await getRecipes();
      const inFolder = new Set(recipes.map((r) => r.id));
      setPickerRecipes(all.filter((r) => (isFavorites ? !r.isFavorite : !inFolder.has(r.id))));
      setPickerSelected(new Set());
      setPickerOpen(true);
    } catch (err) {
      appAlert('Could not load recipes', err.message ?? 'Unknown error');
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
      if (isFavorites) await setRecipesFavorite(ids, true);
      else await addRecipesToFolder({ recipeIds: ids, folderId });
      setPickerOpen(false);
      loadRecipes();
      appAlert(
        'Added',
        `${ids.length} recipe(s) added to ${isFavorites ? 'Favorites' : 'this folder'}.`
      );
    } catch (err) {
      alertSaveFailed(err, isFavorites ? 'Could not add to Favorites' : 'Could not add to folder');
    }
  };

  const handleBulkRemove = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const where = isFavorites ? 'Favorites' : 'this folder';
    appAlert(
      `Remove from ${isFavorites ? 'Favorites' : 'folder'}?`,
      `${ids.length} recipe(s) will be removed from ${where} (recipes are not deleted).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isFavorites) await setRecipesFavorite(ids, false);
              else await removeRecipesFromFolder({ recipeIds: ids, folderId });
              exitSelect();
              loadRecipes();
            } catch (err) {
              alertSaveFailed(err, 'Could not remove');
            }
          },
        },
      ]
    );
  };

  // --- Trash actions -------------------------------------------------------
  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await restoreRecipes(ids);
      exitSelect();
      loadRecipes();
    } catch (err) {
      alertSaveFailed(err, 'Could not restore');
    }
  };

  const handleBulkDeleteForever = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    appAlert(
      'Delete forever?',
      `${ids.length} recipe(s) will be permanently deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipesForever(ids);
              exitSelect();
              loadRecipes();
            } catch (err) {
              alertSaveFailed(err, 'Could not delete');
            }
          },
        },
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (!recipes.length) return;
    appAlert(
      'Delete all?',
      `All ${recipes.length} recipe(s) in Recently Deleted will be permanently deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await emptyTrash();
              loadRecipes();
            } catch (err) {
              alertSaveFailed(err, 'Could not delete recipes');
            }
          },
        },
      ]
    );
  };

  const openRenameModal = () => {
    setRenameValue(folder?.name ?? '');
    setRenameModalOpen(true);
  };

  // Backdrop tap / Android back ask before throwing away a changed name or a
  // picker selection; the Cancel buttons discard straight away.
  const dismissRename = () =>
    confirmDiscard(renameValue.trim() !== (folder?.name ?? '').trim(), () =>
      setRenameModalOpen(false)
    );
  const dismissPicker = () =>
    confirmDiscard(pickerSelected.size > 0, () => setPickerOpen(false));
  // Typed-but-unsaved modal input: hold off a theme remount (lib/app/unsavedChanges.js).
  useRegisterUnsaved(
    (renameModalOpen && renameValue.trim() !== (folder?.name ?? '').trim()) ||
      (pickerOpen && pickerSelected.size > 0)
  );

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await updateFolder(folderId, { name: trimmed });
      setFolder((prev) => ({ ...prev, name: trimmed }));
      setRenameModalOpen(false);
    } catch (err) {
      alertSaveFailed(err, 'Could not rename folder');
    }
  };

  const handleDeleteFolder = () => {
    appAlert('Delete folder?', 'Recipes inside are not deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFolder(folderId);
            navigation.goBack();
          } catch (err) {
            appAlert('Could not delete folder', err.message ?? 'Unknown error');
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

          {!isFavorites && (
            <TouchableOpacity
              style={styles.deleteRecipeButton}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel="More actions"
            >
              <EllipsisIcon size={20} />
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={styles.header_tab}>{folder?.name || 'Folder'}</Text>
      {isTrash && (
        <Text style={styles.trashFolder_hint}>
          Recipes here are deleted for good {TRASH_RETENTION_DAYS} days after you delete them.
          Long-press to restore or delete.
        </Text>
      )}

      {selectMode ? (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={exitSelect}>
            <Text style={styles.selectBar_cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectBar_count}>{selectedIds.size} selected</Text>
          {isTrash ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={handleBulkRestore}
                disabled={!selectedIds.size}
                style={{ marginRight: 16 }}
                accessibilityLabel="Restore selected"
              >
                <RestoreIcon
                  size={22}
                  color={selectedIds.size ? colors.primary : colors.iconDisabled}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBulkDeleteForever}
                disabled={!selectedIds.size}
                accessibilityLabel="Delete selected forever"
              >
                <TrashIcon size={22} color={selectedIds.size ? colors.danger : colors.iconDisabled} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleBulkRemove}
              disabled={!selectedIds.size}
              accessibilityLabel={isFavorites ? 'Remove from Favorites' : 'Remove from folder'}
            >
              <RemoveCircleIcon
                color={selectedIds.size ? colors.danger : colors.iconDisabled}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.home_actionBar}>
          <View style={styles.home_actionBar_searchBox}>
            <SearchIcon size={18} color={contrast ? colors.text : colors.textMuted} />
            <TextInput
              style={styles.home_actionBar_searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor={contrast ? colors.text : colors.iconInactive}
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
          <AllergyFilterControl
            navigation={navigation}
            route={route}
            returnTo={{
              screen: 'FolderDetail',
              params: { folderId, folderName: folder?.name ?? initialName, systemFolder },
            }}
            onSelectionChange={handleAllergySelectionChange}
          />
          {!isTrash && (
            <TouchableOpacity style={styles.home_actionBar_iconButton} onPress={openRecipePicker}>
              <PlusIcon size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={displayedRecipes}
        numColumns={2}
        refreshControl={refreshControl}
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
                {item.isFavorite && !isSystem && !selectMode && (
                  <View style={styles.tile_star} accessibilityLabel="Favorite">
                    <StarIcon filled size={16} />
                  </View>
                )}
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
        extraData={{ selectedIds, selectMode, activeAllergies, searchQuery, sort, openedMap, hideUnsafe }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loadedRecipes === null ? null : (
            <Text style={styles.emptyText}>
              {hiddenCount > 0
                ? 'Every matching recipe is hidden by your dietary filter.'
                : searchQuery.trim()
                  ? `No recipes match "${searchQuery}".`
                  : isFavorites
                    ? 'No favorites yet. Tap ☆ on a recipe, or + here, to add some.'
                    : isTrash
                      ? 'No recently deleted recipes.'
                      : 'No recipes in this folder.'}
            </Text>
          )
        }
        ListFooterComponent={
          hiddenCount > 0 ? (
            <Text style={styles.hiddenCount_text}>
              {hiddenCount} recipe{hiddenCount === 1 ? '' : 's'} hidden by your dietary filter
              (Settings → Hide recipes with dietary conflicts).
            </Text>
          ) : null
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
      <AppModal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.sort_popdown_backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.sort_popdown, styles.folderDetail_menu]} onPress={() => {}}>
            {isTrash ? (
              <TouchableOpacity
                style={styles.sort_popdown_row}
                onPress={() => {
                  setMenuOpen(false);
                  handleEmptyTrash();
                }}
                disabled={!recipes.length}
              >
                <TrashIcon size={18} color={recipes.length ? colors.danger : colors.iconDisabled} />
                <Text
                  style={[
                    styles.sort_popdown_rowText,
                    { color: recipes.length ? colors.danger : colors.iconDisabled },
                  ]}
                >
                  Delete All
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.sort_popdown_row}
                  onPress={() => {
                    setMenuOpen(false);
                    openRenameModal();
                  }}
                >
                  <EditIcon size={18} />
                  <Text style={styles.sort_popdown_rowText}>Rename folder</Text>
                </TouchableOpacity>
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
              </>
            )}
          </Pressable>
        </Pressable>
      </AppModal>

      {/* Rename-folder modal */}
      <AppModal
        visible={renameModalOpen}
        transparent
        animationType="fade"
        onRequestClose={dismissRename}
      >
        <Pressable style={styles.modal_backdrop} onPress={dismissRename}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Rename Folder</Text>
            <TextInput
              style={[styles.input_base, styles.input_spaced]}
              placeholder="Folder name"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
            />
            <View style={styles.modal_button_right}>
              <TouchableOpacity style={styles.modal_button} onPress={() => setRenameModalOpen(false)}>
                <Text style={styles.modal_buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modal_button}
                onPress={handleRename}
                disabled={!renameValue.trim()}
              >
                <Text
                  style={[
                    styles.modal_buttonText,
                    { color: renameValue.trim() ? colors.link : colors.iconDisabled, fontWeight: 'bold' },
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </AppModal>

      {/* Add-recipe picker modal */}
      <AppModal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={dismissPicker}
      >
        <Pressable style={styles.modal_backdrop} onPress={dismissPicker}>
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>Add recipes</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {pickerRecipes.length === 0 && (
                <Text style={styles.emptyText}>
                  All your recipes are already in {isFavorites ? 'Favorites' : 'this folder'}.
                </Text>
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
      </AppModal>
    </View>
  );
};

export default FolderDetail;
