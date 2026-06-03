import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { useAuth } from '../lib/auth-context';
import {
  getFolder,
  getRecipesInFolder,
  deleteFolder,
  removeRecipesFromFolder,
} from '../lib/api/folders';
import {
  getActiveAllergyDetails,
  dotsForRecipe,
  severityColor,
} from '../lib/api/allergies';
import { getMyProfile } from '../lib/api/profile';
import { BackIcon, RemoveCircleIcon, SelectCircleIcon, SortIcon } from '../components/icons';
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

  const [activeAllergies, setActiveAllergies] = useState([]);
  const filterActive = activeAllergies.length > 0;

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

  // Read the user's persisted Home filter so dots show in folders too.
  const loadFilter = useCallback(async () => {
    if (!user?.id) return;
    try {
      const saved = await loadJson(KEYS.homeAllergyFilter(user.id), {
        includeSelf: false,
        friendIds: [],
      });
      const profile = await getMyProfile();
      const details = await getActiveAllergyDetails({
        includeSelf: !!saved.includeSelf,
        friendshipIds: saved.friendIds ?? [],
        myName: profile?.name?.trim() || 'Me',
      });
      setActiveAllergies(details);
    } catch (err) {
      Alert.alert('Could not load allergies', err.message ?? 'Unknown error');
    }
  }, [user?.id]);

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
      loadFilter();
      refreshOpenedMap();
    }, [loadRecipes, loadFilter, refreshOpenedMap])
  );

  const applySort = (next) => {
    setSort(next);
    if (user?.id) saveJson(KEYS.folderRecipesSort(user.id), next);
  };

  const sortedRecipes = sortRecipes(recipes, sort, openedMap);

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
        <>
          <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
            <BackIcon style={styles.overlayIcon_sm} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.overlay_base, styles.folderDetail_sortButton]}
            onPress={() => setSortOpen(true)}
          >
            <SortIcon size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteRecipeButton} onPress={handleDeleteFolder}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.header_tab}>{folder?.name || 'Folder'}</Text>

      <FlatList
        data={sortedRecipes}
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
              <View style={[styles.listItem, isSelected && styles.listItem_selected]}>
                <Text style={styles.listItemText}>{item.name || 'Untitled'}</Text>
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
        extraData={{ selectedIds, selectMode, activeAllergies, sort, openedMap }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No recipes in this folder.</Text>}
      />

      <SortMenu
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        options={RECIPE_SORT_OPTIONS}
        sort={sort}
        onChange={applySort}
      />
    </View>
  );
};

export default FolderDetail;
