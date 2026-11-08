import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';
import { useContrastSetting } from '../lib/server/useContrastSetting';

const Accessibility = ({ navigation }) => {
  // Also on Settings → Display; both use the same shared setting.
  const { contrast, loading, toggleContrast } = useContrastSetting();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_safe]}
        onPress={() => navigation.goBack()}
      >
        <BackIcon style={styles.overlayIcon_lg} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.screen_policyPad}>
        <Text style={styles.header_policyMain}>Accessibility Settings</Text>

        <View style={styles.toggle_row}>
          <View style={styles.toggle_label}>
            <Text style={styles.header_section_marginless}>High-Contrast Mode</Text>
          </View>
          <Switch
            value={contrast}
            onValueChange={toggleContrast}
            disabled={loading}
            trackColor={{ false: colors.borderInput, true: colors.primary }}
            thumbColor={contrast ? colors.surface : colors.background}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
        <Text style={styles.policy_body}>
          Turn this mode on if you want text to be higher contrast and more visually prominent. This especially impacts the dietary restriction warnings
          within recipes, where the names of affected individuals will appear in a bold, high-contrast color with
          a highlight that reflects the severity of the dietary restriction.
        </Text>
      </ScrollView>
    </View>
  );
};

export default Accessibility;