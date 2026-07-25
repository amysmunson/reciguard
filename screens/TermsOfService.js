import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';

const TermsOfService = ({ navigation }) => (
  <View style={{ flex: 1, backgroundColor: colors.background }}>
    <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
      <BackIcon style={styles.overlayIcon_lg} />
    </TouchableOpacity>

    <ScrollView contentContainerStyle={styles.screen_policyPad}>
      <Text style={styles.header_policyMain}>Terms of Service</Text>
      <Text style={styles.policy_updated}>Last updated: July 24, 2026</Text>

      <Text style={styles.policy_body}>
        These terms govern your use of ReciGuard. By creating an account and using the app,
        you agree to them.
      </Text>

      <Text style={styles.header_policySection}>The Service</Text>
      <Text style={styles.policy_body}>
        ReciGuard lets you store and organize recipes, track food restrictions for yourself and
        friends, and share that information with friends you choose to link
        with. We may change, add to, or remove features over time. The information provided when using the Services
        is not intended for distribution or use in any jurisdiction where such activities would be contrary to law or regulation. 
        You are solely responsible for complying with local laws when using these Services.
      </Text>

      <Text style={styles.header_policySection}>Accounts</Text>
      <Text style={styles.policy_body}>
        You need an account to use the app. You are responsible for keeping your login
        credentials secure and for anything that happens under your account. 
      </Text>

      <Text style={styles.header_policySection}>Your Content</Text>
      <Text style={styles.policy_body}>
        You retain full ownership of the recipes, notes, dietary needs information, and other content you
        add to the app and your account. You are solely responsible for what you enter, including its
        accuracy. We are not liable for any statements, representaitons, or inacurrate information entered by you or any user.
        This also applies to food restriction information that other people may rely on.
        You expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.
      </Text>

      <Text style={styles.header_policySection}>Acceptable Use and Prohibited Activities</Text>
      <Text style={styles.policy_body}>
        {'The following activies are prohibited.\n'}
        {'You agree not to:\n'}
        {'• Use violent or sexual content, harassment, or hate speech anywhere in the app, including in recipe names, notes, bios, and feedback submissions.\n'}
        {'• Impersonate someone else or misrepresent your identity or affiliation.\n'}
        {'• Use the app for anything illegal.\n'}
        {'• Attempt to interfere with, disrupt, or gain unauthorized access to the app or other users’ accounts.\n'}
        {'• Trick, defraud, or mislead us and other users.\n'}
        {'• Use any information obtained from the app in order to harass, abuse, or harm another person.\n'}
      </Text>
      <Text style={styles.policy_body}>
        We may remove content or suspend or terminate accounts that violate these terms.
      </Text>

      <Text style={styles.header_policySection}>Not Medical Advice</Text>
      <Text style={styles.policy_body}>
        ReciGuard is a personal organization tool, not a medical or health service. Food restriciton
        information, severity levels, and ingredient warnings in the app are provided by you
        and other users, are not verified by us, and do not constitute medical advice. They
        are not a substitute for professional medical or dietary guidance, and should not be
        relied on as the sole safeguard against an allergic reaction. The app&apos;s ingredient
        matching is a best-effort text match and cannot reliably catch every case — hidden or
        alternate ingredient names, cross-contamination, and less common restrictions may not
        be flagged. Always verify the specific ingredients yourself and consult a qualified
        professional for medical concerns.
      </Text>

      <Text style={styles.header_policySection}>Disclaimer &amp; Limitation of Liability</Text>
      <Text style={styles.policy_body}>
        The app is provided &quot;as is,&quot; without warranties of any kind. We don&apos;t
        guarantee the app will be uninterrupted, error-free, or that any content, including
        dietary needs or ingredient information, is accurate or complete. To the fullest extent
        permitted by law, we aren&apos;t liable for any harm arising from your use of the app
        or reliance on content within it, including allergy-related information.
      </Text>

      <Text style={styles.header_policySection}>Termination</Text>
      <Text style={styles.policy_body}>
        You can delete your account at any time from Settings. We may suspend or terminate
        your access if you violate these terms. See the Privacy Policy for what happens to
        your data when your account is deleted.
      </Text>

      <Text style={styles.header_policySection}>Changes to These Terms</Text>
      <Text style={styles.policy_body}>
        We may update these terms from time to time. We will alert you about these changes by
        updating the &quot;Last updated&quot; date of this document. If you continue to use the app after a change,
        you are deemed to have accepted the updated terms.
      </Text>

      <Text style={styles.header_policySection}>Contact</Text>
      <Text style={styles.policy_body}>
        You can contact us via the feedback form in the settings page or by emailat amunson95070@gmail.com.
      </Text>
    </ScrollView>
  </View>
);

export default TermsOfService;
