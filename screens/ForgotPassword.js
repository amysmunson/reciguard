import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';
import { requestPasswordReset, verifyPasswordResetOtp, updatePassword } from '../lib/api/auth';

const ForgotPassword = ({ navigation }) => {
  // 'request' = collect email and send the code; 'reset' = enter code + new password.
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Missing info', 'Enter your email address.');
      return;
    }
    try {
      setLoading(true);
      await requestPasswordReset({ email: email.trim() });
      setStep('reset');
      Alert.alert('Check your email', 'We sent a 6-digit code to reset your password.');
    } catch (err) {
      Alert.alert('Could not send code', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !password) {
      Alert.alert('Missing info', 'Enter the code and a new password.');
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
      // Verifying the code signs the user in with a recovery session,
      // which authorizes updating the password.
      await verifyPasswordResetOtp({ email: email.trim(), token: code.trim() });
      await updatePassword({ password });
      // Verifying the code already signed the user in, so the auth listener
      // swaps in the app stack automatically
      Alert.alert('Password updated', 'Your password has been reset.');
    } catch (err) {
      Alert.alert('Reset failed', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen_base, styles.screen_authPad]}>
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
        <BackIcon style={styles.overlayIcon_lg} />
      </TouchableOpacity>

      <Text style={styles.header_auth}>Reset Password</Text>

      {step === 'request' ? (
        <View style={{ width: '100%', paddingBottom: 8 }}>
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
          <Text style={styles.input_sublabel}>
            Enter the email for your account and we&apos;ll send you a code to reset your password.
          </Text>
        </View>
      ) : (
        <View style={{ width: '100%', paddingBottom: 8 }}>
          <Text style={styles.input_label}>Reset Code</Text>
          <TextInput
            style={[styles.input_base, styles.input_spaced, styles.input_code]}
            placeholder="000000"
            placeholderTextColor={colors.borderInput}
            autoCapitalize="none"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <Text style={styles.input_label}>New Password</Text>
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
        </View>
      )}

      <View style={[{ flex: 1 }]} />

      <View style={[styles.landing_actions]}>
        <TouchableOpacity
          style={[styles.button_base, styles.button_fullWidth, styles.button_authPrimary]}
          onPress={step === 'request' ? handleSendCode : handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={[styles.buttonText_base, styles.buttonText_onAuthPrimary]}>
              {step === 'request' ? 'Send Code' : 'Reset Password'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button_link} onPress={() => navigation.replace('Login')}>
          <Text style={styles.buttonText_authLink}>Back to Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPassword;
