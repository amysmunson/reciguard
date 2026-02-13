import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AddTodo from '../components/AddTodo';
import TodoItem from '../components/TodoItem';
import HomeScreen from './HomeScreen';

const TodoListScreen = ({ route, navigation }) => {
  const { listId, listName, itemList } = route.params;
  const [todos, setTodos] = useState([]);

  const addTodo = (todoText) => {
    setTodos((prevTodos) => [
      ...prevTodos,
      { id: Math.random().toString(), text: todoText }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{listName}</Text>
      {/* <AddTodo onAddTodo={addTodo} /> */}
      <Text style={styles.ingredients}>{"Ingredients"}</Text>
      {itemList.length > 0 ? (
        itemList.map((item, index) => (
          <Text key={index} style={styles.ingredientItems}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={{ color: '#888' }}>No items</Text>
      )}
      <Text style={styles.instructions}>{"Instructions"}</Text>
      <Text style={styles.notes}>{"Notes"}</Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.bottomHugeButtonText}>Back to Lists</Text>
      </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    bottom: 20,           // 20px from bottom edge
    left: 20,             // 20px padding from left
    right: 20,            // 20px padding from right
    backgroundColor: '#8c9bacff',
    paddingVertical: 18,  // taller button
    // borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,         // Android shadow
    shadowColor: '#000',  // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Placeholders
  ingredientItems: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
  ingredients: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  instructions: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 20,
  },
  notes: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default TodoListScreen;
