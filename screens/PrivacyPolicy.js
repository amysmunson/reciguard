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
      <Text style={styles.policy_updated}>Last updated: October 24, 2026</Text>

      <Text style={styles.policy_body}>
        This policy explains what information the app collects, how it is used, and the
        choices you have. We only collect what the app needs to work for you.
      </Text>

      <Text style={styles.header_policySection}>What we collect</Text>
      <Text style={styles.policy_body}>
        {'• Account info: the email address and password you use to sign in, any name, phone number, or profile notes you choose to add, your friend code (used to let others connect with you), and your accessibility display preference.\n'}
        {'• Content you create: your recipes (including titles, ingredients, steps, section headings, notes, servings, prep and cook times, which recipes you’ve marked as favorites, and any source links or image URLs you add), folders, and dietary need information.\n'}
        {'• Friends you add: their names, the private notes you write about them, and any dietary need information you record for them.\n'}
        {'• Feedback: the message you send from Settings → Send Feedback, linked to your account. We read feedback to improve the app but don’t reply to it.\n'}
        {'• On-device data: your sign-in session (stored securely on your device), small preference settings (such as your sort and filter choices and whether recipes with dietary conflicts are hidden), and a timestamp of when you last opened each recipe (used to sort “recently opened” and to choose which recipes are saved for offline use) are stored locally on your device. Your light/dark appearance choice is also stored on the device; it isn’t tied to your account and stays on the device after you sign out.\n'}
        {'• Offline cache: to make the app load instantly and work without a connection, copies of some of your information are also kept on your device: your recipe and folder lists, which recipes are in each folder, full copies of your five most recently opened recipes, your friends list (including your private notes about them and, for linked friends, their shared name and bio), the names of friends you’ve opened (a friend’s dietary needs are never saved on the device — they’re loaded from our servers each time), and your profile. This mirrors what is already stored on our servers — it isn’t collected separately, and it is cleared from your device automatically when you sign out or delete your account. You can turn it off in Settings → Keep copies on this device, which deletes these copies immediately and stops the app from saving new ones.'}
      </Text>
      <Text style={styles.policy_body}>
        The app does not collect your location, contacts, photo library, device
        identifiers, or advertising data. It contains no analytics or third-party
        tracking, and does not track you in the background.
      </Text>

      <Text style={styles.header_policySection}>How we collect it</Text>
      <Text style={styles.policy_body}>
        Everything above is entered directly by you while using the app, or, when you import
        a recipe from a link, read from that recipe&apos;s web page. The only automatic
        collection is keeping you signed in. The app also checks from time to time whether it
        can reach our server, so it can warn you when you&apos;re offline; that check sends no
        personal information. Your password is handled by our
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
        {'• Recipe links: if you import a recipe from a web address, your device fetches that page directly to read its contents, the same way a web browser would, so that website receives an ordinary request from your device. We don’t send it anything about you.'}
      </Text>
      <Text style={styles.policy_body}>
        We do not share your data with advertisers or data brokers.
      </Text>

      <Text style={styles.header_policySection}>How long we keep it</Text>
      <Text style={styles.policy_body}>
        We keep your information for as long as your account exists. When you delete a recipe,
        it moves to the Recently Deleted folder, where you can restore it for 30 days. After
        that it is permanently deleted from our servers the next time you open Recently
        Deleted, or immediately if you choose &quot;Delete forever&quot; or &quot;Delete
        All&quot;. Other content you delete (folders, friends, notes, dietary needs) is removed
        from our servers right away, and deleting your account removes all of it, including
        recipes in Recently Deleted. Feedback you&apos;ve sent is linked to your account; email
        us if you&apos;d like it removed.
        The on-device cache described above is cleared automatically when you sign out or
        delete your account, so it does not linger on a device after you leave the account.
      </Text>
      <Text style={styles.policy_body}>
        If someone you connected with deletes their account, the friendship stays in your
        list: their name (as it was when you connected) and any private notes you wrote
        about them are kept, since we snapshot that name for you rather than removing your
        entry. You can remove that friend at any time to delete this information.
      </Text>

      <Text style={styles.header_policySection}>Your choices and control</Text>
      <Text style={styles.policy_body}>
        {'• Edit or delete your recipes, folders, friends, and notes at any time in the app. Deleted recipes can be restored from Recently Deleted for 30 days, or deleted permanently there right away.\n'}
        {'• Unlink a connected friend to stop sharing with them.\n'}
        {'• Delete your account from Settings at any time. This permanently removes your profile, recipes (including those in Recently Deleted), folders, and dietary need information from our servers, and cannot be undone. See “How long we keep it” above for what happens to friends you’ve connected with, to feedback, and to locally cached data.'}
      </Text>

      <Text style={styles.header_policySection}>Contact</Text>
      <Text style={styles.policy_body}>
        Questions about this policy can be sent via email to amunson95070@gmail.com.
      </Text>
    </ScrollView>
  </View>
);

export default PrivacyPolicy;
