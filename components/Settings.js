import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import styles from './styles/main_style';  // Assuming you have the styles imported correctly
import NavigationBar from './NavigationBar'; // Assuming you have a NavigationBar component
import { addRecipeAndNavigate } from './utils/addRecipe';

const Settings = ({ route, navigation }) => {
  // Example state for holding notes (you can modify this based on your needs)
  const [notes, setNotes] = useState([
    { id: '1', text: 'Note 1: This is the first note' },
    { id: '2', text: 'Note 2: This is the second note' },
    { id: '3', text: 'Note 3: This is the third note' },
  ]);

  const { userId } = route.params;

  const handleAddRecipe = async () => {
    try {
      await addRecipeAndNavigate({ userId, navigation });
    } catch (err) {
      console.log('❌ Settings handleAddRecipe error:', err);
    }
  };

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
      <NavigationBar navigation={navigation} userId={userId} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Settings;
