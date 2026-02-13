import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../components/styles/main_style';
import { signUp } from '../lib/api/auth';

const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Missing info', 'Enter a name, email, and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await signUp({ email: email.trim(), password, name: name.trim() });
    } catch (err) {
      Alert.alert('Sign up failed', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.auth_container}>
      <TouchableOpacity style={styles.auth_backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" style={styles.auth_backIcon} />
      </TouchableOpacity>

      <Text style={styles.auth_title}>Create Account</Text>

      <TextInput
        style={styles.auth_input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.auth_input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.auth_input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.auth_primaryButton}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.auth_primaryButtonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.auth_link}>Already have an account? Sign in</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
        <Text style={styles.auth_link}>Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUp;
