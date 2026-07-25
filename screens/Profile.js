import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { BackIcon, ShareIcon } from '../components/icons';
import { useAuth } from '../lib/auth-context';
import { getMyProfile, updateMyProfile } from '../lib/api/profile';
import { getMyAllergies, severityColor, severityLabel } from '../lib/api/allergies';
import ConfirmModal from '../components/ConfirmModal';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const Profile = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [notes, setNotes] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [baseline, setBaseline] = useState({ name: '', phone: '', about: '', notes: '' });
  const [confirmDiscardVisible, setConfirmDiscardVisible] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

  const load = useCallback(async ({ preserveEdits = false } = {}) => {
    try {
      const [profile, list] = await Promise.all([getMyProfile(), getMyAllergies()]);
      setFriendCode(profile?.friend_code ?? '');
      setAllergies(list);
      // While actively editing, a focus-triggered reload (e.g. returning
      // from EditAllergies) should only refresh the allergy list, not
      // clobber whatever's currently typed into the profile fields.
      if (!preserveEdits) {
        const loaded = {
          name: profile?.name ?? '',
          phone: profile?.phone ?? '',
          about: profile?.about ?? '',
          notes: profile?.notes ?? '',
        };
        setName(loaded.name);
        setPhone(loaded.phone);
        setAbout(loaded.about);
        setNotes(loaded.notes);
        setBaseline(loaded);
      }
    } catch (err) {
      Alert.alert('Could not load profile', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const isDirty =
    name !== baseline.name ||
    phone !== baseline.phone ||
    about !== baseline.about ||
    notes !== baseline.notes;

  // Refreshes on every focus (not just mount) so allergy edits made on
  // EditAllergies — which saves straight to the database itself — show up
  // here as soon as you navigate back.
  useFocusEffect(
    useCallback(() => {
      load({ preserveEdits: isEditing });
    }, [load, isEditing])
  );

  const handleShareCode = async () => {
    if (!friendCode) return;
    try {
      await Share.share({
        message: `Add me on ReciGuard — my friend code is ${friendCode}`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleCopyCode = async () => {
    if (!friendCode) return;
    await Clipboard.setStringAsync(friendCode);
    setCodeCopied(true);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCodeCopied(false), 1500);
  };

  const handleSave = async () => {
    try {
      await updateMyProfile({ name, phone, about, notes });
      setIsEditing(false);
      setBaseline({ name, phone, about, notes });
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    }
  };

  const handleDiscard = () => {
    setConfirmDiscardVisible(false);
    setIsEditing(false);
    load(); // revert any in-flight edits
  };

  const handleBackPress = () => {
    if (!isEditing) {
      navigation.goBack();
      return;
    }
    if (isDirty) {
      setConfirmDiscardVisible(true);
      return;
    }
    handleDiscard();
  };

  if (loading) {
    return (
      <View style={[styles.screen_base, styles.screen_cardPad]}>
        <Text style={[styles.emptyText, { marginTop: 100 }]}>Loading…</Text>
      </View>
    );
  }

  const displayValue = (val) =>
    val && val.trim().length > 0 ? (
      <Text style={styles.display_fieldValue}>{val}</Text>
    ) : (
      <Text style={[styles.display_fieldValue, styles.display_fieldEmpty]}>Not set</Text>
    );

  return (
    <ScrollView
      style={[styles.screen_base, styles.screen_cardPad]}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_card]} onPress={handleBackPress}>
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={isEditing ? handleSave : () => setIsEditing(true)}
      >
        <Text style={styles.overlayText}>{isEditing ? 'Save' : 'Edit'}</Text>
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={[styles.header_card, styles.input_underline]}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />
      ) : (
        <Text style={styles.header_card}>{name || "Your Profile"}</Text>
      )}

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>Your Friend Code</Text>
      <Text style={styles.readOnly_hint}>Share this with friends so they can link your profile to theirs. Tap the code to copy it.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 12 }}>
        <TouchableOpacity onPress={handleCopyCode} disabled={!friendCode}>
          <Text
            style={[
              styles.display_fieldValue,
              styles.friendCode_value,
              { paddingBottom: 0, marginBottom: 0 },
            ]}
          >
            {codeCopied ? 'Copied!' : friendCode || '—'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.friendCode_shareButton}
          onPress={handleShareCode}
          disabled={!friendCode}
        >
          <ShareIcon color={styles.friendCode_shareText.color} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>Email</Text>
      <Text style={styles.display_fieldValue}>{user?.email}</Text>

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>Phone</Text>
      {isEditing ? (
        <TextInput
          style={styles.input_base}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone"
          keyboardType="phone-pad"
        />
      ) : (
        displayValue(phone)
      )}

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>About</Text>
      <Text style={styles.readOnly_hint}>Your friends can see this section.</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input_base, { minHeight: 80 }]}
          value={about}
          onChangeText={setAbout}
          multiline
          placeholder="A short bio your friends can see"
        />
      ) : (
        displayValue(about)
      )}

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>Notes</Text>
      <Text style={styles.readOnly_hint}>Only you can see these notes.</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input_base, { minHeight: 80 }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Private notes only you can see"
        />
      ) : (
        displayValue(notes)
      )}

      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>My Dietary Needs</Text>
      {allergies.length === 0 && <Text style={styles.emptyText}>None added.</Text>}
      {allergies.map((a) => (
        <View key={a.id} style={styles.allergyRow}>
          <Text style={[styles.recipeItem, { flex: 1 }]}>• {cap(a.name)}</Text>
          <View style={styles.severityChip}>
            <View style={[styles.severityDot, { backgroundColor: severityColor(a.severity) }]} />
            <Text style={styles.severityChipLabel}>{severityLabel(a.severity)}</Text>
          </View>
        </View>
      ))}
      {isEditing && (
        <TouchableOpacity
          style={[styles.button_outline, styles.button_outline_link, { marginTop: 8 }]}
          onPress={() => navigation.navigate('EditAllergies', { allergies })}
        >
          <Text style={[styles.buttonText_outline, { color: colors.primary }]}>
            Edit Dietary Needs
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.spacing} />

      <ConfirmModal
        visible={confirmDiscardVisible}
        title="Discard changes?"
        message="Your edits haven't been saved."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={handleDiscard}
        onCancel={() => setConfirmDiscardVisible(false)}
      />
    </ScrollView>
  );
};

export default Profile;
