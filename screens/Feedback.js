import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon } from '../components/icons';
import { submitFeedback } from '../lib/api/feedback';

const TYPES = [
  { id: 'suggestion', label: 'Suggestion' },
  { id: 'question', label: 'Question' },
];

const Feedback = ({ navigation }) => {
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    try {
      setSubmitting(true);
      await submitFeedback({ type, message: message.trim() });
      Alert.alert('Thanks!', 'Your feedback has been sent.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Could not send feedback', err.message ?? 'Unknown error');
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
        Have a suggestion or a question? Send it straight to us.
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {TYPES.map((t) => {
          const selected = type === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setType(t.id)}
              style={[
                styles.button_outline,
                styles.button_outline_link,
                { flex: 1, marginRight: t.id === 'suggestion' ? 8 : 0 },
                selected && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.buttonText_outline,
                  { color: selected ? colors.textOnPrimary : colors.primary, marginLeft: 0 },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={[styles.input_base, { minHeight: 120 }]}
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder={type === 'suggestion' ? "What's your idea?" : 'What would you like to know?'}
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
    </ScrollView>
  );
};

export default Feedback;
