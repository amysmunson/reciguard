import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../components/styles/main_style';
import { getFriend, updateFriend, deleteFriend } from '../lib/api/friends';
import { getFriendAllergies, addAllergy, deleteAllergy } from '../lib/api/allergies';

const FriendProfile = ({ route, navigation }) => {
  const { friendshipId } = route.params;
  const [friend, setFriend] = useState(null);
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');

  const load = useCallback(async () => {
    try {
      const f = await getFriend(friendshipId);
      setFriend(f);
      setNotes(f.friendNotes ?? '');
      const a = await getFriendAllergies(friendshipId);
      setAllergies(a);
    } catch (err) {
      Alert.alert('Could not load friend', err.message ?? 'Unknown error');
    }
  }, [friendshipId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveNotes = async () => {
    try {
      await updateFriend(friendshipId, {
        friendName: friend.friendName,
        friendNotes: notes,
      });
      Alert.alert('Saved');
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    try {
      await addAllergy({
        name: newAllergy.trim(),
        friendId: friendshipId,
        userCustom: true,
      });
      setNewAllergy('');
      const a = await getFriendAllergies(friendshipId);
      setAllergies(a);
    } catch (err) {
      Alert.alert('Could not add allergy', err.message ?? 'Unknown error');
    }
  };

  const handleRemoveAllergy = async (id) => {
    try {
      await deleteAllergy(id);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      Alert.alert('Could not remove allergy', err.message ?? 'Unknown error');
    }
  };

  const handleDeleteFriend = () => {
    Alert.alert('Remove friend?', 'This deletes their notes and allergies.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFriend(friendshipId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not remove friend', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  if (!friend) {
    return (
      <View style={styles.card_container}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const displayName = friend.linkedProfile?.name || friend.friendName || 'Unnamed';

  return (
    <ScrollView style={styles.card_container}>
      <TouchableOpacity style={styles.card_backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" style={styles.card_backIcon} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.card_edit} onPress={handleDeleteFriend}>
        <Text style={[styles.card_editText, { color: '#c00' }]}>Remove</Text>
      </TouchableOpacity>

      <Text style={styles.card_header}>{displayName}</Text>

      <Text style={styles.subheading}>Notes</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Notes about this friend"
      />
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#28a745', padding: 12, marginTop: 10 }]}
        onPress={handleSaveNotes}
      >
        <Text style={[styles.addButtonText, { color: '#fff', fontWeight: 'bold' }]}>
          Save Notes
        </Text>
      </TouchableOpacity>

      <Text style={styles.spacing} />
      <Text style={styles.subheading}>Allergies</Text>
      {allergies.length === 0 && <Text style={styles.emptyText}>None added.</Text>}
      {allergies.map((a) => (
        <View key={a.id} style={styles.ingredientRow}>
          <Text style={[styles.ingredientItems, { flex: 1 }]}>• {a.name}</Text>
          <TouchableOpacity onPress={() => handleRemoveAllergy(a.id)} style={styles.deleteButton}>
            <Icon name="trash-outline" size={20} color="#900" />
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.ingredientRow}>
        <TextInput
          style={styles.input}
          placeholder="Add allergy"
          value={newAllergy}
          onChangeText={setNewAllergy}
          onSubmitEditing={handleAddAllergy}
        />
        <TouchableOpacity onPress={handleAddAllergy} style={styles.deleteButton}>
          <Icon name="add-circle-outline" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>

      <Text style={styles.spacing} />
      <Text style={styles.spacing} />
    </ScrollView>
  );
};

export default FriendProfile;
