import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import styles from '../styles/main_style';
import { BackIcon, ShareIcon, TrashIcon } from '../components/icons';
import { useAuth } from '../lib/auth-context';
import { getMyProfile, updateMyProfile } from '../lib/api/profile';
import {
  getMyAllergies,
  addAllergy,
  deleteAllergy,
  updateAllergySeverity,
  severityColor,
  severityLabel,
  normalizeSeverity,
} from '../lib/api/allergies';
import AllergyChecklist from '../components/AllergyChecklist';

const formatCode = (code) =>
  code ? code.slice(0, 4) + '-' + code.slice(4, 8) : '';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const Profile = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profile, list] = await Promise.all([getMyProfile(), getMyAllergies()]);
      setName(profile?.name ?? '');
      setPhone(profile?.phone ?? '');
      setNotes(profile?.notes ?? '');
      setFriendCode(profile?.friend_code ?? '');
      setAllergies(list);
    } catch (err) {
      Alert.alert('Could not load profile', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleShareCode = async () => {
    if (!friendCode) return;
    try {
      await Share.share({
        message: `Add me on Recipes — my friend code is ${formatCode(friendCode)}`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleSave = async () => {
    try {
      await updateMyProfile({ name, phone, notes });
      setIsEditing(false);
      Alert.alert('Saved');
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    load(); // revert any in-flight edits
  };

  const handleAddBatch = async ({ items, severity }) => {
    if (!items?.length) return;
    try {
      await Promise.all(
        items.map(({ name, userCustom }) =>
          addAllergy({ name, severity, userCustom })
        )
      );
      const updated = await getMyAllergies();
      setAllergies(updated);
    } catch (err) {
      Alert.alert('Could not add allergies', err.message ?? 'Unknown error');
    }
  };

  const handleCycleSeverity = async (allergy) => {
    // Cycle: unknown → mild → moderate → severe → unknown
    const order = ['unknown', 'mild', 'moderate', 'severe'];
    const current = normalizeSeverity(allergy.severity);
    const next = order[(order.indexOf(current) + 1) % order.length];
    const dbValue = next === 'unknown' ? null : next;
    try {
      await updateAllergySeverity(allergy.id, dbValue);
      setAllergies((prev) =>
        prev.map((a) => (a.id === allergy.id ? { ...a, severity: dbValue } : a))
      );
    } catch (err) {
      Alert.alert('Could not update severity', err.message ?? 'Unknown error');
    }
  };

  const handleRemoveAllergy = async (id) => {
    try {
      await deleteAllergy(id);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      Alert.alert('Could not remove allergy', err.message ?? 'Unknown error');
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen_base, styles.screen_cardPad]}>
        <Text style={styles.emptyText}>Loading…</Text>
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
      contentContainerStyle={{ paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_card]} onPress={() => navigation.goBack()}>
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={isEditing ? handleCancel : () => setIsEditing(true)}
      >
        <Text style={styles.overlayText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
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

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>Email</Text>
      <Text style={styles.display_fieldValue}>{user?.email}</Text>

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>Phone</Text>
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

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>Notes</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input_base, { minHeight: 80 }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Anything you'd like to remember about yourself"
        />
      ) : (
        displayValue(notes)
      )}

      {isEditing && (
        <TouchableOpacity
          style={[
            styles.button_base,
            styles.button_fullWidth,
            styles.button_primary,
            { padding: 12, marginTop: 10 },
          ]}
          onPress={handleSave}
        >
          <Text style={[styles.buttonText_base, styles.buttonText_onPrimary]}>
            Save Profile
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>My Allergies</Text>
      {allergies.length === 0 && <Text style={styles.emptyText}>None added.</Text>}
      {allergies.map((a) => {
        const sev = normalizeSeverity(a.severity);
        const dotColor = severityColor(a.severity);
        return (
          <View key={a.id} style={styles.allergyRow}>
            <Text style={[styles.ingredientItems, { flex: 1 }]}>• {cap(a.name)}</Text>
            <TouchableOpacity
              onPress={() => isEditing && handleCycleSeverity(a)}
              disabled={!isEditing}
              style={styles.severityChip}
            >
              <View style={[styles.severityDot, { backgroundColor: dotColor }]} />
              <Text style={styles.severityChipLabel}>{severityLabel(sev)}</Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                onPress={() => handleRemoveAllergy(a.id)}
                style={styles.deleteButton}
              >
                <TrashIcon />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      {isEditing && (
        <AllergyChecklist
          existingNames={allergies.map((a) => a.name)}
          onConfirm={handleAddBatch}
        />
      )}

      <Text style={styles.spacing} />

      <View style={[styles.surface_lg, { marginVertical: 10, alignItems: 'center' }]}>
        <Text style={styles.friendCode_label}>Your Friend Code</Text>
        <Text style={styles.friendCode_value}>
          {friendCode ? formatCode(friendCode) : '—'}
        </Text>
        <Text style={styles.friendCode_hint}>
          Share this with friends so they can link your profile to theirs.
        </Text>
        <TouchableOpacity
          style={styles.friendCode_shareButton}
          onPress={handleShareCode}
          disabled={!friendCode}
        >
          <ShareIcon />
          <Text style={styles.friendCode_shareText}>Share Code</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.spacing} />
    </ScrollView>
  );
};

export default Profile;
