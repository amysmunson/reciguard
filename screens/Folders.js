import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import NavigationBar from '../components/NavigationBar';
import { getFolders, createFolder, deleteFolders } from '../lib/api/folders';
import { getMyProfile } from '../lib/api/profile';
import { useCachedResource } from '../lib/cache';
import { useAuth } from '../lib/auth-context';
import { startNewRecipe } from '../components/utils/addRecipe';
import { PlusIcon, SearchIcon, SelectCircleIcon, SortIcon, TrashIcon } from '../components/icons';
import SortMenu from '../components/SortMenu';
import { loadJson, saveJson, KEYS } from '../lib/storage';
import {
  FOLDER_SORT_OPTIONS,
  DEFAULT_FOLDER_SORT,
  normalizeSort,
  sortFolders,
} from '../lib/sort';

const Folders = ({ navigation }) => {
  const { user } = useAuth();
  const { data: foldersData } = useCachedResource({
    resource: 'folders',
    userId: user?.id,
    fetcher: getFolders,
  });
  const { data: profile } = useCachedResource({
    resource: 'profile',
    userId: user?.id,
    fetcher: getMyProfile,
  });
  const contrast = !!profile?.contrast;
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  // Selection state — long-press a tile to enter, tap toggles membership.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Sort state — { by, dir }
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(DEFAULT_FOLDER_SORT);

  // Search state — query string only; the input lives in the action bar.
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadJson(KEYS.foldersSort(user.id), null);
      if (!cancelled) setSort(normalizeSort(saved, DEFAULT_FOLDER_SORT));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const applySort = (next) => {
    setSort(next);
    if (user?.id) saveJson(KEYS.foldersSort(user.id), next);
  };

  const folders = sortFolders(foldersData ?? [], sort);
  const displayedFolders = searchQuery.trim()
    ? folders.filter((f) =>
        (f.name ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : folders;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder({ name: newName.trim() });
      setNewName('');
      setCreating(false);
    } catch (err) {
      Alert.alert('Could not create folder', err.message ?? 'Unknown error');
    }
  };

  const handleAddRecipe = () => {
    startNewRecipe({ navigation });
  };

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
    else navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    Alert.alert(
      'Delete folders?',
      `${ids.length} will be permanently deleted. Recipes inside are not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolders(ids);
              exitSelect();
            } catch (err) {
              Alert.alert('Could not delete', err.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      <Text style={styles.header_tab}>Folders</Text>

      {selectMode ? (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={exitSelect}>
            <Text style={styles.selectBar_cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectBar_count}>{selectedIds.size} selected</Text>
          <TouchableOpacity onPress={handleBulkDelete} disabled={!selectedIds.size}>
            <TrashIcon
              size={22}
              color={selectedIds.size ? colors.danger : colors.iconDisabled}
            />
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.home_actionBar_iconButton}
            onPress={() => setCreating(true)}
          >
            <PlusIcon size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displayedFolders}
        numColumns={2}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              onPress={() => handleTilePress(item)}
              onLongPress={() => enterSelect(item.id)}
              delayLongPress={300}
            >
              <View style={[styles.tile, isSelected && styles.tile_selected]}>
                <Text style={styles.tileText}>{item.name || 'Untitled'}</Text>
                {selectMode && (
                  <View style={styles.selectCheck}>
                    <SelectCircleIcon selected={isSelected} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        extraData={{ searchQuery, selectMode, selectedIds }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? `No folders match "${searchQuery}".`
              : 'No folders yet. Tap + to create one.'}
          </Text>
        }
      />

      <Modal
        visible={creating}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCreating(false);
          setNewName('');
        }}
      >
        <Pressable
          style={styles.modal_backdrop}
          onPress={() => {
            setCreating(false);
            setNewName('');
          }}
        >
          <Pressable style={styles.surface_modal} onPress={() => {}}>
            <Text style={styles.header_modal}>New Folder</Text>
            <TextInput
              style={[styles.input_base, styles.input_spaced]}
              placeholder="Folder name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modal_button_right}>
              <TouchableOpacity
                style={styles.modal_button}
                onPress={() => {
                  setCreating(false);
                  setNewName('');
                }}
              >
                <Text style={styles.modal_buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modal_button} onPress={handleCreate}>
                <Text style={[styles.modal_buttonText, { color: colors.link, fontWeight: 'bold' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <SortMenu
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        options={FOLDER_SORT_OPTIONS}
        sort={sort}
        onChange={applySort}
      />

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Folders;
