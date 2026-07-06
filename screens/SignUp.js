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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Missing info', 'Enter a name, email, and password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please ensure passwords match exactly.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      Alert.alert('Weak password', 'Follow the password requirements.');
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

      <Text style={styles.header_auth}>Create Account</Text>

      <View style={{ width: '100%', paddingBottom: 8 }}>
        <Text style={styles.input_label}>Name</Text>
        <TextInput
          style={[styles.input_base, styles.input_spaced]}
          placeholder="Name"
          placeholderTextColor={colors.borderInput}
          value={name}
          onChangeText={setName}
        />
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
        <Text style={styles.input_label}>Re-enter Password</Text>
        <TextInput
          style={[styles.input_base]}
          placeholder="Re-enter Password"
          placeholderTextColor={colors.borderInput}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Text style={styles.input_sublabel}>
          {'Password Requirements: \n'}
          {'- At least 8 characters\n'}
          {'- Uppercase and lowercase letters\n'}
          {'- Special characters\n'}
          {'- Numbers\n'}
        </Text>
        {/* Privacy Policy */}
        <TouchableOpacity
          style={[styles.button_link, { alignSelf: 'flex-start' }]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={[styles.buttonText_link, { color: colors.text, fontSize: 16 }]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={[{ flex: 1 }]} />

      <View style={[styles.landing_actions]}>
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
    </View>
  );
};

export default SignUp;
