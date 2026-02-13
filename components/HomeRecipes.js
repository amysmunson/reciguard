import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import AddTodo from '../components/AddTodo';
import TodoItem from '../components/TodoItem';

const TodoListScreen = ({ route }) => {
  const { listId, listName } = route.params;
//   Correct for production
//   const [todos, setTodos] = useState([]);

//   Testing, populated with samples
  const [lists, setTodos] = useState([
  { id: '1', name: 'Grocery List', items: ['Milk', 'Eggs', 'Bread']},
  { id: '2', name: 'Work Tasks', items: []},
  { id: '3', name: 'Vacation Planning', items: [] },
]);

  const addTodo = (todoText) => {
    setTodos((prevTodos) => [
      ...prevTodos,
      { id: Math.random().toString(), text: todoText }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{listName}</Text>
      <AddTodo onAddTodo={addTodo} />
      <FlatList
        data={todos}
        renderItem={({ item }) => <TodoItem todo={item} />}
        keyExtractor={(item) => item.id}
      />
      <Button title="Back to Lists" onPress={() => route.params.navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default TodoListScreen;
