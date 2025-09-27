import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import TodoItem from './TodoItem';

const TodoList = ({ todos }) => {
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={todos}
        renderItem={({ item }) => <TodoItem todo={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    marginTop: 20,
  },
});

export default TodoList;
