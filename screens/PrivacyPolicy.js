import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';

const PrivacyPolicy = ({ navigation }) => (
  <View style={{ flex: 1, backgroundColor: colors.background }}>
    <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
      <BackIcon style={styles.overlayIcon_lg} />
    </TouchableOpacity>

    <ScrollView contentContainerStyle={styles.screen_policyPad}>
      <Text style={styles.header_policyMain}>Privacy Policy</Text>
      <Text style={styles.policy_updated}>Last updated: today</Text>

      <Text style={styles.header_policySection}>What we collect</Text>
      <Text style={styles.policy_body}>
        We store the account information you provide (email, name) and the recipes,
        folders, friends, and allergy notes you create in the app.
      </Text>

      <Text style={styles.header_policySection}>How we use it</Text>
      <Text style={styles.policy_body}>
        Your data is used to provide the app&apos;s features to you. We do not sell
        your data.
      </Text>

      <Text style={styles.header_policySection}>Deleting your account</Text>
      <Text style={styles.policy_body}>
        You can delete your account from Settings at any time. This permanently removes
        your profile, recipes, folders, friends, and allergies.
      </Text>

      <Text style={styles.header_policySection}>Contact</Text>
      <Text style={styles.policy_body}>
        Questions about this policy can be sent to the app maintainer.
      </Text>
    </ScrollView>
  </View>
);

export default PrivacyPolicy;
