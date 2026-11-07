import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import NavigationBar from '../components/NavigationBar';
import { getFolders, createFolder, deleteFolders } from '../lib/api/folders';
import { getMyProfile } from '../lib/api/profile';
import { useCachedResource } from '../lib/cache';
import { usePullToRefresh } from '../lib/usePullToRefresh';
import { useAuth } from '../lib/auth-context';
import { confirmDiscard, useRegisterUnsaved } from '../lib/unsavedChanges';
import { alertSaveFailed } from '../lib/connectivity';
import { PlusIcon, SearchIcon, SelectCircleIcon, SortIcon, StarIcon, TrashIcon } from '../components/icons';
import { SYSTEM_FOLDERS } from './FolderDetail';
import SortMenu from '../components/SortMenu';
import { loadJson, saveJson, KEYS } from '../lib/storage';
import {
  FOLDER_SORT_OPTIONS,
  DEFAULT_FOLDER_SORT,
  normalizeSort,
  sortFolders,
} from '../lib/sort';
import { appAlert } from '../lib/dialog';
import AppModal from '../components/AppModal';

const Folders = ({ navigation }) => {
  const { user } = useAuth();
  const { data: foldersData, refresh: refreshFolders } = useCachedResource({
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
  const refreshControl = usePullToRefresh(refreshFolders);
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
      alertSaveFailed(err, 'Could not create folder');
    }
  };

  const closeCreate = () => {
    setCreating(false);
    setNewName('');
  };

  // Backdrop tap / Android back — easy to hit by accident, so ask first if
  // a name has been typed. The Cancel button discards straight away.
  const dismissCreate = () => confirmDiscard(!!newName.trim(), closeCreate);
  // Typed-but-unsaved modal input: hold off a theme remount (lib/unsavedChanges.js).
  useRegisterUnsaved(creating && !!newName.trim());

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
    if (item.system) {
      // Built-in folders can't be selected; tapping one in select mode is a no-op.
      if (!selectMode) navigation.navigate('FolderDetail', { systemFolder: item.system });
      return;
    }
    if (selectMode) toggleSelect(item.id);
    else navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name });
  };

  // Built-in folders: Favorites always first, Recently Deleted always last,
  // unaffected by sort, never selectable.
  const query = searchQuery.trim().toLowerCase();
  const systemTiles = Object.entries(SYSTEM_FOLDERS)
    .map(([key, { name }]) => ({ id: `system:${key}`, system: key, name }))
    .filter((t) => !query || t.name.toLowerCase().includes(query));

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    appAlert(
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
              appAlert('Could not delete', err.message ?? 'Unknown error');
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
        data={[
          ...systemTiles.filter((t) => t.system === 'favorites'),
          ...displayedFolders,
          ...systemTiles.filter((t) => t.system === 'trash'),
        ]}
        numColumns={2}
        refreshControl={refreshControl}
        renderItem={({ item }) => {
          if (item.system) {
            return (
              <TouchableOpacity
                onPress={() => handleTilePress(item)}
                disabled={selectMode}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} folder`}
              >
                {/* Same tile as any folder, with a small icon inline before the name. */}
                <View style={[styles.tile, selectMode && { opacity: 0.4 }]}>
                  <View style={styles.tile_labelRow}>
                    {item.system === 'favorites' ? (
                      <StarIcon filled size={16} />
                    ) : (
                      <TrashIcon size={16} color={colors.text} />
                    )}
                    <Text style={styles.tileText}>{item.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }
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
        ListFooterComponent={
          displayedFolders.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `No folders match "${searchQuery}".`
                : 'No folders of your own yet. Tap + to create one.'}
            </Text>
          ) : null
        }
      />

      <AppModal
        visible={creating}
        transparent
        animationType="fade"
        onRequestClose={dismissCreate}
      >
        <Pressable style={styles.modal_backdrop} onPress={dismissCreate}>
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
              <TouchableOpacity style={styles.modal_button} onPress={closeCreate}>
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
      </AppModal>

      <SortMenu
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        options={FOLDER_SORT_OPTIONS}
        sort={sort}
        onChange={applySort}
      />

      <NavigationBar navigation={navigation} />
    </View>
  );
};

export default Folders;
