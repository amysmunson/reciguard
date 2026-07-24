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
import AllergyFilterControl from '../components/AllergyFilterControl';
import { startNewRecipe } from '../components/utils/addRecipe';
import { getRecipes, deleteRecipes } from '../lib/api/recipes';
import { getFolders, addRecipesToFolder } from '../lib/api/folders';
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

const Home = ({ navigation, route }) => {
  const { user } = useAuth();
  const { data: recipesData } = useCachedResource({
    resource: 'recipes',
    userId: user?.id,
    fetcher: getRecipes,
  });
  const { data: profile } = useCachedResource({
    resource: 'profile',
    userId: user?.id,
    fetcher: getMyProfile,
  });
  const contrast = !!profile?.contrast;
  const recipes = recipesData ?? [];

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Allergy filter — selection itself lives in AllergyFilterControl (shared
  // with FolderDetail); it reports the selection here via onSelectionChange
  // so tile dots can be computed.
  const [allergySelection, setAllergySelection] = useState({
    includeSelf: false,
    selectedFriendIds: new Set(),
  });
  const [allergySelectionReady, setAllergySelectionReady] = useState(false);
  const [activeAllergies, setActiveAllergies] = useState([]);
  const filterActive = allergySelection.includeSelf || allergySelection.selectedFriendIds.size > 0;

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
        myName: 'Me',
      });
      setActiveAllergies(details);
    } catch (err) {
      Alert.alert('Could not load allergies', err.message ?? 'Unknown error');
    }
  }, []);

  const handleAllergySelectionChange = useCallback((self, friendIds) => {
    setAllergySelection({ includeSelf: self, selectedFriendIds: friendIds });
    setAllergySelectionReady(true);
  }, []);

  // Hydrate persisted sort selection on mount (per-user).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const savedSort = await loadJson(KEYS.homeSort(user.id), null);
      if (cancelled) return;
      setSort(normalizeSort(savedSort, DEFAULT_RECIPE_SORT));
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
      if (allergySelectionReady) {
        refreshActiveAllergies(allergySelection.includeSelf, allergySelection.selectedFriendIds);
      }
    }, [refreshOpenedMap, refreshActiveAllergies, allergySelection, allergySelectionReady])
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

  // --- Misc ---------------------------------------------------------------
  const handleAddRecipe = () => {
    startNewRecipe({ navigation });
  };

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
            returnTo={{ screen: 'Home' }}
            onSelectionChange={handleAllergySelectionChange}
          />
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
            <View style={styles.modal_button_right} >
              <TouchableOpacity
                style={styles.modal_button}
                onPress={() => setFolderPickerOpen(false)}
              >
                <Text style={styles.modal_buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
