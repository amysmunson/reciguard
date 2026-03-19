import React, { useCallback, useState } from 'react';
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
import FAIcon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import NavigationBar from '../components/NavigationBar';
import PlusIcon from '../components/icons/PlusIcon';
import { useAuth } from '../lib/auth-context';
import {
  getFriends,
  addFriend,
  addFriendByCode,
  friendDisplayName,
} from '../lib/api/friends';
import { getMyProfile } from '../lib/api/profile';
import { startNewRecipe } from '../components/utils/addRecipe';

// Strip non-alphanumeric, uppercase, max 8 chars.
const normalizeCode = (s) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const Friends = ({ navigation }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, profile] = await Promise.all([getFriends(), getMyProfile()]);
      setFriends(list);
      setMyName(profile?.name?.trim() || user?.email || 'Me');
    } catch (err) {
      Alert.alert('Could not load friends', err.message ?? 'Unknown error');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addFriend({ friendName: newName.trim() });
      setNewName('');
      setAdding(false);
      load();
    } catch (err) {
      Alert.alert('Could not add friend', err.message ?? 'Unknown error');
    }
  };

  const handleAddRecipe = async () => {
    try {
      await addRecipeAndNavigate({ navigation });
    } catch (err) {
      Alert.alert('Could not create recipe', err.message ?? 'Unknown error');
    }
  };

  const displayName = (f) => f.linkedProfile?.name || f.friendName || 'Unnamed';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.home_search} onPress={() => setAdding(true)}>
        <Icon name="plus" style={styles.home_searchIcon} />
      </TouchableOpacity>

      <Text style={styles.header}>Friends</Text>

      <FlatList
        data={friends}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.settings_row}
            onPress={() => navigation.navigate('FriendProfile', { friendshipId: item.id })}
          >
            <Text style={styles.settings_rowText}>{displayName(item)}</Text>
            <Icon name="chevron-right" size={14} color="#888" />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No friends yet. Tap + to add one.</Text>
        }
      />

      <Modal visible={adding} transparent animationType="fade">
        <View style={styles.modal_backdrop}>
          <View style={styles.modal_card}>
            <Text style={styles.modal_title}>Add Friend</Text>
            <TextInput
              style={styles.auth_input}
              placeholder="Friend's name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={styles.modal_button}
                onPress={() => {
                  setAdding(false);
                  setNewName('');
                }}
              >
                <Text style={styles.modal_buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modal_button} onPress={handleAdd}>
                <Text style={[styles.modal_buttonText, { color: '#0066cc', fontWeight: 'bold' }]}>
                  Add
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

export default Friends;
