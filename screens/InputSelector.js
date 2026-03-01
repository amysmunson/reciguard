import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles/main_style';

const InputSelector = ({ route, navigation }) => {
  const { recipeId } = route.params;

  const goToEdit = () => navigation.replace('EditRecipe', { recipeId });

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.inputButton} onPress={goToEdit}>
        <Icon name="link-outline" style={styles.inputButtonText} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.inputButton} onPress={goToEdit}>
        <Icon name="camera-outline" style={styles.inputButtonText} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.inputButton} onPress={goToEdit}>
        <Text style={styles.inputButtonText}>Manual Entry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InputSelector;
