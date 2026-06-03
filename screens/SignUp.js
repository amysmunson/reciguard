import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';
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
    <View style={[styles.screen_base, styles.screen_authPad]}>
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
        <BackIcon style={styles.overlayIcon_lg} />
      </TouchableOpacity>

      <Text style={styles.auth_title}>Create Account</Text>

    <View style={{ width: '100%', paddingBottom: 16 }}>
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
      </View>

      <TouchableOpacity style={styles.button_link} onPress={() => navigation.navigate('PrivacyPolicy')}>
        <Text style={styles.buttonText_link}>Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button_base, styles.button_fullWidth, styles.button_authPrimary]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={[styles.buttonText_base, styles.buttonText_onAuthPrimary]}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button_link} onPress={() => navigation.replace('Login')}>
        <Text style={styles.buttonText_authLink}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUp;
