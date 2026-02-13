import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const AddTodo = ({ onAddTodo }) => {
  const [todoText, setTodoText] = useState('');

  const handleAddPress = () => {
    if (todoText.trim().length > 0) {
      onAddTodo(todoText);
      setTodoText('');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter a new to-do"
        value={todoText}
        onChangeText={setTodoText}
      />
      <Button title="Add Todo" onPress={handleAddPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    width: '70%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default AddTodo;
