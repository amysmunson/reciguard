import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/main_style';

const InputSelector = ({ route, navigation }) => {
  const { listId, listName, itemList } = route.params;
  const [ingredients, setIngredients] = useState(itemList || []);

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.inputButton} onPress={() => navigation.navigate('EditRecipe', { listId: listId, listName: listName, itemList: itemList})}>
        <Icon name="link-outline" style={styles.inputButtonText}/>
      </TouchableOpacity>
      <TouchableOpacity style={styles.inputButton}>
        <Icon name="camera-outline" style={styles.inputButtonText}/>
      </TouchableOpacity>
      <TouchableOpacity style={styles.inputButton} onPress={() => navigation.navigate('EditRecipe', { listId: listId, listName: listName, itemList: itemListq})}>
        <Text style={styles.inputButtonText}>Manual Entry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InputSelector;
