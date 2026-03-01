import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';

const Landing = ({ navigation }) => (
  <View style={styles.landing_container}>
    <Text style={styles.landing_title}>Recipes</Text>
    <Text style={styles.landing_subtitle}>Your shared recipe book.</Text>

    <TouchableOpacity
      style={styles.landing_primaryButton}
      onPress={() => navigation.navigate('Login')}
    >
      <Text style={styles.landing_primaryButtonText}>Sign In</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.landing_secondaryButton}
      onPress={() => navigation.navigate('SignUp')}
    >
      <Text style={styles.landing_secondaryButtonText}>Create Account</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.landing_link}
      onPress={() => navigation.navigate('PrivacyPolicy')}
    >
      <Text style={styles.landing_linkText}>Privacy Policy</Text>
    </TouchableOpacity>
  </View>
);

export default Landing;
