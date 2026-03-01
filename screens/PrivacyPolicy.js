import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles/main_style';

const PrivacyPolicy = ({ navigation }) => (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <TouchableOpacity style={styles.auth_backButton} onPress={() => navigation.goBack()}>
      <Icon name="chevron-back" style={styles.auth_backIcon} />
    </TouchableOpacity>

    <ScrollView contentContainerStyle={styles.policy_container}>
      <Text style={styles.policy_title}>Privacy Policy</Text>
      <Text style={styles.policy_updated}>Last updated: today</Text>

      <Text style={styles.policy_heading}>What we collect</Text>
      <Text style={styles.policy_body}>
        We store the account information you provide (email, name) and the recipes,
        folders, friends, and allergy notes you create in the app.
      </Text>

      <Text style={styles.policy_heading}>How we use it</Text>
      <Text style={styles.policy_body}>
        Your data is used to provide the app&apos;s features to you. We do not sell
        your data.
      </Text>

      <Text style={styles.policy_heading}>Deleting your account</Text>
      <Text style={styles.policy_body}>
        You can delete your account from Settings at any time. This permanently removes
        your profile, recipes, folders, friends, and allergies.
      </Text>

      <Text style={styles.policy_heading}>Contact</Text>
      <Text style={styles.policy_body}>
        Questions about this policy can be sent to the app maintainer.
      </Text>
    </ScrollView>
  </View>
);

export default PrivacyPolicy;
