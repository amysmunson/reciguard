import React, { useState } from 'react';
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
import { PlusIcon, SortIcon } from '../components/icons';

const Folders = ({ navigation }) => {
  const { user } = useAuth();
  const { data: foldersData } = useCachedResource({
    resource: 'folders',
    userId: user?.id,
    fetcher: getFolders,
  });
  const folders = foldersData ?? [];
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

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
    <View style={styles.container}>
      <TouchableOpacity style={styles.home_search} onPress={() => setCreating(true)}>
        <PlusIcon size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.header}>Folders</Text>

      <FlatList
        data={folders}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })
            }
          >
            <View style={styles.listItem}>
              <Text style={styles.listItemText}>{item.name || 'Untitled'}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No folders yet. Tap + to create one.</Text>
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
          <Pressable style={styles.modal_card} onPress={() => {}}>
            <Text style={styles.modal_title}>New Folder</Text>
            <TextInput
              style={styles.auth_input}
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

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Folders;
