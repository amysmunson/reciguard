import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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
import { loadJson, KEYS } from '../lib/storage';

const FolderDetail = ({ route, navigation }) => {
  const { user } = useAuth();
  const { folderId, folderName: initialName } = route.params;
  const [folder, setFolder] = useState({ id: folderId, name: initialName });
  const [recipes, setRecipes] = useState([]);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [activeAllergies, setActiveAllergies] = useState([]);
  const filterActive = activeAllergies.length > 0;

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

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
      loadFilter();
    }, [loadRecipes, loadFilter])
  );

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
    <View style={styles.container}>
      {selectMode ? (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={exitSelect}>
            <Text style={styles.selectBar_cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectBar_count}>{selectedIds.size} selected</Text>
          <TouchableOpacity onPress={handleBulkRemove} disabled={!selectedIds.size}>
            <Icon
              name="remove-circle-outline"
              size={22}
              color={selectedIds.size ? colors.danger : colors.iconDisabled}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.edit_backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" style={styles.edit_backButtonIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteRecipeButton} onPress={handleDeleteFolder}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.header}>{folder?.name || 'Folder'}</Text>

      <FlatList
        data={recipes}
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
                    <Icon
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isSelected ? colors.link : colors.iconInactive}
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        extraData={{ selectedIds, selectMode, activeAllergies }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No recipes in this folder.</Text>}
      />
    </View>
  );
};

export default FolderDetail;
