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
import { getFolders, createFolder } from '../lib/api/folders';
import { useCachedResource } from '../lib/cache';
import { useAuth } from '../lib/auth-context';
import { startNewRecipe } from '../components/utils/addRecipe';
import { PlusIcon, SearchIcon, SortIcon } from '../components/icons';
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

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

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      <Text style={styles.header_tab}>Folders</Text>

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
          onPress={() => setCreating(true)}
        >
          <PlusIcon size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedFolders}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })
            }
          >
            <View style={styles.tile}>
              <Text style={styles.tileText}>{item.name || 'Untitled'}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        extraData={searchQuery}
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
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
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
