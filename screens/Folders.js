import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import NavigationBar from '../components/NavigationBar';
import { getFolders, createFolder } from '../lib/api/folders';
import { addRecipeAndNavigate } from '../components/utils/addRecipe';

const Folders = ({ navigation }) => {
  const [folders, setFolders] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    try {
      const list = await getFolders();
      setFolders(list);
    } catch (err) {
      Alert.alert('Could not load folders', err.message ?? 'Unknown error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder({ name: newName.trim() });
      setNewName('');
      setCreating(false);
      load();
    } catch (err) {
      Alert.alert('Could not create folder', err.message ?? 'Unknown error');
    }
  };

  const handleAddRecipe = async () => {
    try {
      await addRecipeAndNavigate({ navigation });
    } catch (err) {
      Alert.alert('Could not create recipe', err.message ?? 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.home_search} onPress={() => setCreating(true)}>
        <Icon name="plus" style={styles.home_searchIcon} />
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

      <Modal visible={creating} transparent animationType="fade">
        <View style={styles.modal_backdrop}>
          <View style={styles.modal_card}>
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
                <Text style={[styles.modal_buttonText, { color: '#0066cc', fontWeight: 'bold' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Folders;
