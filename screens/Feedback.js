import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon } from '../components/icons';
import { submitFeedback, FEEDBACK_MAX_LENGTH } from '../lib/server/api/feedback';
import ConfirmModal from '../components/ConfirmModal';
import { useUnsavedChangesGuard } from '../lib/app/unsavedChanges';
import { appAlert } from '../lib/app/dialog';

// Feedback only — no questions, since submissions aren't replied to. Every
// row is saved with type 'suggestion' (an existing allowed value of
// feedback_submissions.type, so no database change).
const FEEDBACK_TYPE = 'suggestion';

const Feedback = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { discardModalProps, leaveWithoutPrompt } = useUnsavedChangesGuard({
    navigation,
    isDirty: message.trim().length > 0,
  });

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    try {
      setSubmitting(true);
      await submitFeedback({ type: FEEDBACK_TYPE, message: message.trim() });
      appAlert('Thanks!', 'Your feedback has been sent.', [
        { text: 'OK', onPress: () => leaveWithoutPrompt(() => navigation.goBack()) },
      ]);
    } catch (err) {
      appAlert('Could not send feedback', err.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.screen_base, styles.screen_cardPad]} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_card]}
        onPress={() => navigation.goBack()}
      >
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <Text style={styles.header_card}>Send Feedback</Text>
      <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>
        Have an idea, or found something that isn&apos;t working? Let us know. We read
        everything, but we can&apos;t reply to individual messages.
      </Text>

      <TextInput
        style={[styles.input_base, { minHeight: 120 }]}
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder="What's your feedback?"
        maxLength={FEEDBACK_MAX_LENGTH}
        placeholderTextColor={colors.textMuted}
      />

      <TouchableOpacity
        style={[
          styles.button_base,
          styles.button_fullWidth,
          styles.button_primary,
          { marginTop: 16 },
          (!message.trim() || submitting) && { opacity: 0.5 },
        ]}
        onPress={handleSubmit}
        disabled={!message.trim() || submitting}
      >
        <Text style={[styles.buttonText_base, styles.buttonText_onPrimary]}>
          {submitting ? 'Sending…' : 'Send'}
        </Text>
      </TouchableOpacity>

      <ConfirmModal {...discardModalProps} />
    </ScrollView>
  );
};

export default Feedback;
