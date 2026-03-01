import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { getFolder, getRecipesInFolder, deleteFolder } from '../lib/api/folders';

const FolderDetail = ({ route, navigation }) => {
  const { folderId, folderName: initialName } = route.params;
  const [folder, setFolder] = useState({ id: folderId, name: initialName });
  const [recipes, setRecipes] = useState([]);

  const load = useCallback(async () => {
    try {
      const [f, list] = await Promise.all([getFolder(folderId), getRecipesInFolder(folderId)]);
      setFolder(f);
      setRecipes(list);
    } catch (err) {
      Alert.alert('Could not load folder', err.message ?? 'Unknown error');
    }
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = () => {
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.edit_backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" style={styles.edit_backButtonIcon} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteRecipeButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{folder?.name || 'Folder'}</Text>

      <FlatList
        data={recipes}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('RecipeCard', { recipeId: item.id })}
          >
            <View style={styles.listItem}>
              <Text style={styles.listItemText}>{item.name || 'Untitled'}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No recipes in this folder.</Text>}
      />
    </View>
  );
};

export default FolderDetail;
