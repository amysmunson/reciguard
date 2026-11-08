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
      <Text style={styles.policy_updated}>Last updated: October 24, 2026</Text>

      <Text style={styles.policy_body}>
        These terms govern your use of ReciGuard. By creating an account and using the app,
        you agree to them.
      </Text>

      <Text style={styles.header_policySection}>The Service</Text>
      <Text style={styles.policy_body}>
        ReciGuard lets you store and organize recipes (including importing them from recipe
        websites, scaling ingredient amounts, and sorting them into folders), track food
        restrictions for yourself and friends, and share that information with friends you choose
        to link with. We may change, add to, or remove features over time. The information provided when using the Services
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
        accuracy. We are not liable for any statements, representations, or inaccurate information entered by you or any user.
        This also applies to food restriction information that other people may rely on.
        You expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.
      </Text>

      <Text style={styles.header_policySection}>Imported Recipes</Text>
      <Text style={styles.policy_body}>
        When you add a recipe from a link, the app reads the recipe information that website
        publishes (such as the name, ingredients, instructions, sections, servings, and cooking
        times) and saves a copy to your account. Imported details may be incomplete, out of
        date, or wrong, so review a recipe before relying on it. Imported recipes remain the
        work of their original authors and websites; save them for your own personal use, and
        you are responsible for having any rights needed to use or share them. The same applies
        to copies you make of a recipe in the app.
      </Text>

      <Text style={styles.header_policySection}>Scaling, Servings, and Cooking Times</Text>
      <Text style={styles.policy_body}>
        Scaled ingredient amounts (½×, 2×, 3×) are calculated automatically from the amount at
        the start of each ingredient line and are approximate. Amounts written elsewhere in a
        line or in the instructions are not adjusted, and baking times, pan sizes, and
        seasoning may need to change when a recipe is scaled. Servings and prep, cook, and
        total times are estimates entered by you or taken from the source website. Use your own
        judgment when cooking.
      </Text>

      <Text style={styles.header_policySection}>Deleting Recipes</Text>
      <Text style={styles.policy_body}>
        Deleting a recipe moves it to the Recently Deleted folder, where you can restore it for
        30 days. After 30 days it is deleted permanently the next time you open Recently
        Deleted. Choosing &quot;Delete forever&quot;
        or &quot;Delete All&quot; in Recently Deleted deletes recipes immediately. Permanently
        deleted recipes cannot be recovered, by you or by us. Deleting your account deletes all
        of your recipes, including those in Recently Deleted.
      </Text>

      <Text style={styles.header_policySection}>Offline Use and Saved Copies</Text>
      <Text style={styles.policy_body}>
        To load faster and work with a weak connection, the app keeps copies of some of your
        information on your device, such as your recipe and folder lists, recently opened
        recipes, and your friends list. These copies can be out of date until the app
        reconnects. A friend&apos;s food restrictions are not saved on the device; they are
        loaded from our servers each time you open that friend, so they can&apos;t be viewed
        offline. Changes you make while offline or when a save fails are
        not saved; the app tells you when this happens, and you should try again once you are
        reconnected. Signing out removes these copies from the device, and you can turn them
        off in Settings → Keep copies on this device (recipes then can&apos;t be opened offline).
      </Text>

      <Text style={styles.header_policySection}>Acceptable Use and Prohibited Activities</Text>
      <Text style={styles.policy_body}>
        {'The following activities are prohibited.\n'}
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
        ReciGuard is a personal organization tool, not a medical or health service. Food restriction
        information, severity levels, and ingredient warnings in the app are provided by you
        and other users, are not verified by us, and do not constitute medical advice. They
        are not a substitute for professional medical or dietary guidance, and should not be
        relied on as the sole safeguard against an allergic reaction. The app&apos;s ingredient
        matching is a best-effort text match and cannot reliably catch every case — hidden or
        alternate ingredient names, cross-contamination, and less common restrictions may not
        be flagged. The same matching decides which recipes are hidden when you turn on
        &quot;Hide recipes with dietary conflicts&quot; in Settings, so a recipe that is shown,
        and not flagged, may still contain an ingredient someone needs to avoid. Section
        headings in a recipe are not checked. Always verify the specific ingredients yourself
        and consult a qualified professional for medical concerns.
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
        You can send feedback from Settings → Send Feedback; we read every submission but
        don&apos;t reply to it. To contact us, email amunson95070@gmail.com.
      </Text>
    </ScrollView>
  </View>
);

export default TermsOfService;
