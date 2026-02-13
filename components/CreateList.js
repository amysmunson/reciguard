import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const CreateList = ({ onCreate }) => {
  const [listName, setListName] = useState('');

  const handleCreatePress = () => {
    if (listName.trim().length > 0) {
      onCreate(listName);
      setListName('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter list name"
        value={listName}
        onChangeText={setListName}
      />
      <Button title="Create List" onPress={handleCreatePress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default CreateList;
