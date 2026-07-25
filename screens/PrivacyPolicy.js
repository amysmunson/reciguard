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
      <Text style={styles.policy_updated}>Last updated: July 23, 2026</Text>

      <Text style={styles.policy_body}>
        This policy explains what information the app collects, how it is used, and the
        choices you have. We only collect what the app needs to work for you.
      </Text>

      <Text style={styles.header_policySection}>What we collect</Text>
      <Text style={styles.policy_body}>
        {'• Account info: the email address and password you use to sign in, any name, phone number, or profile notes you choose to add, your friend code (used to let others connect with you), and your accessibility display preference.\n'}
        {'• Content you create: your recipes (including titles, ingredients, steps, notes, and any source links or image URLs you add), folders, and dietary need information.\n'}
        {'• Friends you add: their names, the private notes you write about them, and any dietary need information you record for them.\n'}
        {'• On-device data: your sign-in session, small preference settings (such as your sort and filter choices), and a timestamp of when you last opened each recipe (used to sort “recently opened”) are stored locally on your device.\n'}
        {'• Offline cache: to make the app load instantly and work without a connection, a copy of your recipes, folders, friends, and profile is also cached on your device. This mirrors what is already stored on our servers — it isn’t collected separately, but it does mean a local copy can remain on a device even after you sign out, until you sign in again or the app’s local storage is cleared.'}
      </Text>
      <Text style={styles.policy_body}>
        The app does not collect your location, contacts, photo library, device
        identifiers, or advertising data. It contains no analytics or third-party
        tracking, and does not track you in the background.
      </Text>

      <Text style={styles.header_policySection}>How we collect it</Text>
      <Text style={styles.policy_body}>
        Everything above is entered directly by you while using the app. The only
        automatic collection is keeping you signed in. Your password is handled by our
        authentication provider (Supabase) and is stored in a securely hashed form &mdash;
        it is never visible to us.
      </Text>

      <Text style={styles.header_policySection}>How we use it</Text>
      <Text style={styles.policy_body}>
        We use your information to create and secure your account, to store your recipes,
        folders, notes, and dietary need information so they are available when you sign in, and
        to power features such as dietary need warnings and linking with friends. We do not sell
        your data or use it for advertising.
      </Text>

      <Text style={styles.header_policySection}>Sharing and third parties</Text>
      <Text style={styles.policy_body}>
        {'• Hosting: the app’s backend is provided by Supabase, which stores your account and content on its servers on our behalf and provides our database and sign-in. Supabase processes this data only to run the service.\n'}
        {'• Other users: when you link with someone using a friend code, your name, your “About” bio, and your dietary need information become visible to that connected user. Your private notes and contact details (such as your phone number) are never shared with them. You control this by adding or removing friends and by unlinking.\n'}
        {'• Recipe links: if you import a recipe from a web address, the app fetches that page to read its contents.'}
      </Text>
      <Text style={styles.policy_body}>
        We do not share your data with advertisers or data brokers.
      </Text>

      <Text style={styles.header_policySection}>How long we keep it</Text>
      <Text style={styles.policy_body}>
        We keep your information for as long as your account exists. When you delete
        content, or delete your account, the corresponding data is removed from our servers.
        A cached copy may remain on a device you signed in on until you reinstall the app
        or clear its storage; once your account is deleted this local copy can no longer be
        reached through the app.
      </Text>
      <Text style={styles.policy_body}>
        If someone you connected with deletes their account, the friendship stays in your
        list: their name (as it was when you connected) and any private notes you wrote
        about them are kept, since we snapshot that name for you rather than removing your
        entry. You can remove that friend at any time to delete this information.
      </Text>

      <Text style={styles.header_policySection}>Your choices and control</Text>
      <Text style={styles.policy_body}>
        {'• Edit or delete your recipes, folders, friends, and notes at any time in the app.\n'}
        {'• Unlink a connected friend to stop sharing with them.\n'}
        {'• Delete your account from Settings at any time. This permanently removes your profile, recipes, folders, and dietary need information from our servers, and cannot be undone. See “How long we keep it” above for what happens to friends you’ve connected with, and to locally cached data.'}
      </Text>

      <Text style={styles.header_policySection}>Contact</Text>
      <Text style={styles.policy_body}>
        Questions about this policy can be sent via email to amunson95070@gmail.com.
      </Text>
    </ScrollView>
  </View>
);

export default PrivacyPolicy;
