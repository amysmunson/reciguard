import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';
import { signIn } from '../lib/api/auth';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter an email and password.');
      return;
    }
    try {
      setLoading(true);
      await signIn({ email: email.trim(), password });
    } catch (err) {
      Alert.alert('Sign in failed', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen_base, styles.screen_authPad]}>
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
        <BackIcon style={styles.overlayIcon_lg} />
      </TouchableOpacity>

      <Text style={styles.auth_title}>Sign In</Text>

      <View style={{ width: '100%', paddingBottom: 16 }}>
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

      <TouchableOpacity
        style={[styles.button_base, styles.button_fullWidth, styles.button_authPrimary]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={[styles.buttonText_base, styles.buttonText_onAuthPrimary]}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button_link} onPress={() => navigation.replace('SignUp')}>
        <Text style={styles.buttonText_authLink}>Don&apos;t have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
