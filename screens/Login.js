import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
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

      <Text style={styles.header_auth}>Sign In</Text>

      <View style={{ width: '100%', paddingBottom: 16 }}>
        <Text style={styles.input_label}>Email</Text>
        <TextInput
          style={[styles.input_base, styles.input_spaced]}
          placeholder="Email"
          placeholderTextColor={colors.borderInput}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.input_label}>Password</Text>
        <TextInput
          style={[styles.input_base, styles.input_spaced]}
          placeholder="Password"
          placeholderTextColor={colors.borderInput}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {/* Forgot Password */}
        <TouchableOpacity
          style={[styles.button_link, { alignSelf: 'flex-start' }]}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={[styles.buttonText_authLink]}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Push the actions to the bottom */}
      <View style={[{ flex: 1 }]} />

      {/* Action stack — pinned to the bottom */}
      <View style={styles.landing_actions}>
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
    </View>
  );
};

export default Login;
