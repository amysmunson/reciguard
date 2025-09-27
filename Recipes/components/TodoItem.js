import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TodoItem = ({ todo }) => {
  return (
    <View style={styles.todoItem}>
      <Text>{todo.text}</Text>
      <Text style={{ color: '#888' }}>ID: {todo.id}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  todoItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default TodoItem;
