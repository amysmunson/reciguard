import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import styles from './styles/main_style';  // Assuming you have the styles imported correctly

const Settings = ({ route, navigation }) => {
  // Example state for holding notes (you can modify this based on your needs)
  const [notes, setNotes] = useState([
    { id: '1', text: 'Note 1: This is the first note' },
    { id: '2', text: 'Note 2: This is the second note' },
    { id: '3', text: 'Note 3: This is the third note' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Displaying Notes */}
      <Text style={styles.notes}>{"Notes"}</Text>

      {/* FlatList to display list of notes */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>{item.text}</Text>
          </View>
        )}
      />

      {/* Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}  onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={24} color="#333" />
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('InputSelector', { listId: newItem.id, listName: newItem.name, itemList: newItem.ingredients})}>
          <Icon name="plus-square-o" size={24} color="#333" />
          <Text style={styles.navButtonText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
          <Icon name="search" size={24} color="#333" />
          <Text style={styles.navButtonText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
          <Icon name="cogs" size={24} color="#333" />
          <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
          <Icon name="folder" size={24} color="#333" />
          <Text style={styles.navButtonText}>Folders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Settings;
