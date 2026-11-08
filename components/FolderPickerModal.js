import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import {
  getFolders,
  getFolderMemberships,
  createFolder,
  addRecipesToFolder,
  removeRecipesFromFolder,
} from '../lib/server/api/folders';
import { alertSaveFailed } from '../lib/server/connectivity';
import { confirmDiscard, useRegisterUnsaved } from '../lib/app/unsavedChanges';
import { CheckboxIcon, PlusIcon } from './icons';
import AppModal from './AppModal';

// "Add to folder" for one recipe, from the ⋯ menu on RecipeCard / EditRecipe.
// Lists the user's folders with a checkbox showing whether the recipe is
// already in each; tapping a folder adds or removes it right away. "New
// folder" creates a folder and adds the recipe to it. (Home's multi-select
// "Add to folder" is the bulk version of the same thing.)
const FolderPickerModal = ({ visible, onClose, recipeId }) => {
  const [folders, setFolders] = useState(null); // null while loading
  const [memberOf, setMemberOf] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [list, memberships] = await Promise.all([getFolders(), getFolderMemberships()]);
        if (cancelled) return;
        setFolders(list);
        setMemberOf(
          new Set(
            Object.entries(memberships)
              .filter(([, ids]) => ids.includes(recipeId))
              .map(([folderId]) => folderId)
          )
        );
      } catch (err) {
        if (!cancelled) {
          onClose();
          alertSaveFailed(err, 'Could not load folders');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // onClose is a fresh closure each render; reload only when opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, recipeId]);

  const close = () => {
    setCreating(false);
    setNewName('');
    setFolders(null);
    onClose();
  };
  // Backdrop tap / Android back — ask first if a new folder name is typed.
  const dismiss = () => confirmDiscard(creating && !!newName.trim(), close);
  // Typed-but-unsaved modal input: hold off a theme remount (lib/app/unsavedChanges.js).
  useRegisterUnsaved(visible && creating && !!newName.trim());

  const toggle = async (folderId) => {
    if (busyId) return;
    const wasIn = memberOf.has(folderId);
    const flip = (prev) => {
      const next = new Set(prev);
      if (wasIn) next.delete(folderId);
      else next.add(folderId);
      return next;
    };
    setBusyId(folderId);
    setMemberOf(flip);
    try {
      if (wasIn) await removeRecipesFromFolder({ recipeIds: [recipeId], folderId });
      else await addRecipesToFolder({ recipeIds: [recipeId], folderId });
    } catch (err) {
      setMemberOf(flip); // undo
      alertSaveFailed(err, wasIn ? 'Could not remove from folder' : 'Could not add to folder');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const folder = await createFolder({ name });
      await addRecipesToFolder({ recipeIds: [recipeId], folderId: folder.id });
      setFolders((prev) => [folder, ...(prev ?? [])]);
      setMemberOf((prev) => new Set(prev).add(folder.id));
      setCreating(false);
      setNewName('');
    } catch (err) {
      alertSaveFailed(err, 'Could not create folder');
    }
  };

  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.modal_backdrop} onPress={dismiss}>
        <Pressable style={styles.surface_modal} onPress={() => {}}>
          <Text style={styles.header_modal}>Add to folder</Text>

          {creating ? (
            <>
              <TextInput
                style={[styles.input_base, styles.input_spaced]}
                placeholder="Folder name"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={styles.modal_button_right}>
                <TouchableOpacity
                  style={styles.modal_button}
                  onPress={() => {
                    setCreating(false);
                    setNewName('');
                  }}
                >
                  <Text style={styles.modal_buttonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modal_button}
                  onPress={handleCreate}
                  disabled={!newName.trim()}
                >
                  <Text
                    style={[
                      styles.modal_buttonText,
                      { color: newName.trim() ? colors.link : colors.iconDisabled, fontWeight: 'bold' },
                    ]}
                  >
                    Create & Add
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.filter_row} onPress={() => setCreating(true)}>
                <PlusIcon size={20} color={colors.link} />
                <Text style={[styles.filter_rowText, { color: colors.link }]}>New folder</Text>
              </TouchableOpacity>
              <ScrollView style={{ maxHeight: 320 }}>
                {folders === null && <Text style={styles.emptyText}>Loading…</Text>}
                {folders?.length === 0 && (
                  <Text style={styles.emptyText}>No folders yet. Create one above.</Text>
                )}
                {(folders ?? []).map((f) => {
                  const checked = memberOf.has(f.id);
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.filter_row, busyId === f.id && { opacity: 0.5 }]}
                      onPress={() => toggle(f.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                    >
                      <CheckboxIcon checked={checked} />
                      <Text style={styles.filter_rowText}>{f.name || 'Untitled'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.modal_button_right}>
                <TouchableOpacity style={styles.modal_button} onPress={close}>
                  <Text style={[styles.modal_buttonText, { color: colors.link, fontWeight: 'bold' }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </AppModal>
  );
};

export default FolderPickerModal;
