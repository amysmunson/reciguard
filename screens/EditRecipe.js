import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  InputAccessoryView,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import {
  createRecipe,
  getRecipe,
  updateRecipe,
  trashRecipe,
  duplicateRecipe,
  TRASH_RETENTION_DAYS,
} from '../lib/server/api/recipes';
import {
  CheckIcon,
  CopyIcon,
  DragHandleIcon,
  FolderIcon,
  PlusIcon,
  RestoreIcon,
  TrashIcon,
} from '../components/icons';
import ConfirmModal from '../components/ConfirmModal';
import { EditHeader } from '../components/EditHeader';
import FolderPickerModal from '../components/FolderPickerModal';
import ReorderableList from '../components/ReorderableList';
import RemoveBadge from '../components/RemoveBadge';
import { useUnsavedChangesGuard } from '../lib/app/unsavedChanges';
import { alertSaveFailed } from '../lib/server/connectivity';
import { toItem } from '../lib/app/recipeItems';
import { resolveTotalMinutes } from '../lib/app/recipeTimes';
import { appAlert } from '../lib/app/dialog';

// nativeID linking the multiline inputs to the iOS "Done" accessory bar.
const DONE_ACCESSORY_ID = 'editRecipeDone';

// Ingredient / step rows carry a client-only `key` so drag-and-drop and
// TextInput focus stay attached to the right row as rows move.
let nextRowKey = 0;
const withKey = (x) => ({ ...toItem(x), key: `row${nextRowKey++}` });

// Digits-only number input text -> positive integer, or null when blank/zero.
const parsePositiveInt = (text) => {
  const n = parseInt(text, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const digitsOnly = (text, max) => text.replace(/[^0-9]/g, '').slice(0, max);
const asInputText = (n) => (n ? String(n) : '');

// Comparable form of the editable fields. Blank rows are ignored (they're
// dropped on save anyway), so adding then abandoning an empty row isn't
// treated as an unsaved change. Row order and section flags do count.
const snapshot = ({ name, servings, prep, cook, total, ingredients, steps, userNotes }) => {
  const cleanItems = (list) =>
    list
      .map(toItem)
      .filter((i) => i.text.trim().length > 0)
      .map((i) => [i.text, i.isHeader]);
  const cleanNotes = (list) => list.filter((s) => s.trim().length > 0);
  return JSON.stringify([
    name,
    String(servings ?? ''),
    String(prep ?? ''),
    String(cook ?? ''),
    String(total ?? ''),
    cleanItems(ingredients),
    cleanItems(steps),
    cleanNotes(userNotes),
  ]);
};
const EMPTY_SNAPSHOT = snapshot({
  name: '',
  servings: '',
  prep: '',
  cook: '',
  total: '',
  ingredients: [],
  steps: [],
  userNotes: [],
});

const EditRecipe = ({ route, navigation }) => {
  const recipeId = route.params?.recipeId ?? null;
  const isNew = !recipeId;
  // If create new recipe, go back to home after saving
  const fromCreate = !!route.params?.fromCreate;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  // The recipe as loaded — supplies fields this screen doesn't edit (link,
  // source, photo) when making a copy.
  const [loaded, setLoaded] = useState(null);
  const [name, setName] = useState('');
  // Number fields are kept as raw input text; parsed (or null) on save.
  // Servings is optional and never pre-filled; blank saves as "not filled in".
  const [servings, setServings] = useState('');
  const [prep, setPrep] = useState('');
  const [cook, setCook] = useState('');
  const [total, setTotal] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  // Snapshot of the last-loaded values; null while an existing recipe loads.
  const [baseline, setBaseline] = useState(isNew ? EMPTY_SNAPSHOT : null);
  // The form as last loaded, for ⋯ → Discard changes.
  const [loadedForm, setLoadedForm] = useState(null);
  // Off while a row is being dragged, so the page doesn't scroll under it.
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const isDirty =
    baseline !== null &&
    snapshot({ name, servings, prep, cook, total, ingredients, steps, userNotes }) !== baseline;
  const { discardModalProps, leaveWithoutPrompt } = useUnsavedChangesGuard({
    navigation,
    isDirty,
  });

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const r = await getRecipe(recipeId);
        const form = {
          name: r.name,
          servings: asInputText(r.servings),
          prep: asInputText(r.prepMinutes),
          cook: asInputText(r.cookMinutes),
          total: asInputText(r.totalMinutes),
          ingredients: r.ingredients.map(withKey),
          steps: r.steps.map(withKey),
          userNotes: r.userNotes,
        };
        setLoaded(r);
        setLoadedForm(form);
        setName(form.name);
        setServings(form.servings);
        setPrep(form.prep);
        setCook(form.cook);
        setTotal(form.total);
        setIngredients(form.ingredients);
        setSteps(form.steps);
        setUserNotes(form.userNotes);
        setBaseline(snapshot(form));
      } catch (err) {
        appAlert('Could not load recipe', err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recipeId, isNew]);

  // The form as a recipe payload (blank rows dropped, row keys stripped).
  const formValues = () => {
    const items = (list) =>
      list
        .filter((i) => i.text.trim().length > 0)
        .map(({ text, isHeader }) => ({ text, isHeader }));
    const prepMinutes = parsePositiveInt(prep);
    const cookMinutes = parsePositiveInt(cook);
    return {
      name,
      servings: parsePositiveInt(servings),
      prepMinutes,
      cookMinutes,
      totalMinutes: resolveTotalMinutes({
        prepMinutes,
        cookMinutes,
        totalMinutes: parsePositiveInt(total),
      }),
      ingredients: items(ingredients),
      steps: items(steps),
      userNotes: userNotes.filter((s) => s.trim().length > 0),
    };
  };

  const handleSave = async () => {
    if (saving) return;
    const payload = formValues();

    if (isNew && !payload.name && !payload.ingredients.length && !payload.steps.length) {
      appAlert('Nothing to save', 'Add at least a name, an ingredient, or a step.');
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await createRecipe(payload);
        leaveWithoutPrompt(() => navigation.popToTop());
      } else {
        await updateRecipe(recipeId, payload);
        leaveWithoutPrompt(() => (fromCreate ? navigation.popToTop() : navigation.goBack()));
      }
    } catch (err) {
      alertSaveFailed(err);
    } finally {
      setSaving(false);
    }
  };

  // Copies what's on screen — including unsaved edits — into a new recipe,
  // then shows the copy. The original stays as it was last saved.
  const makeCopy = async () => {
    try {
      const copy = await duplicateRecipe({ ...(loaded ?? {}), ...formValues() });
      leaveWithoutPrompt(() => navigation.replace('RecipeCard', { recipeId: copy.id }));
    } catch (err) {
      alertSaveFailed(err, 'Could not copy recipe');
    }
  };

  const handleCopy = () => {
    if (!isDirty) {
      makeCopy();
      return;
    }
    appAlert(
      'Copy with your edits?',
      'The copy will include your unsaved edits. The original stays as it was last saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Make Copy', onPress: makeCopy },
      ]
    );
  };

  const handleTrash = () => {
    appAlert(
      'Delete recipe?',
      `It stays in Recently Deleted for ${TRASH_RETENTION_DAYS} days, so you can restore it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await trashRecipe(recipeId);
              leaveWithoutPrompt(() => navigation.popToTop());
            } catch (err) {
              alertSaveFailed(err, 'Could not delete recipe');
            }
          },
        },
      ]
    );
  };

  // ⋯ → Discard changes: back to the last saved values (empty for a new recipe).
  const handleDiscard = () => {
    appAlert('Discard changes?', "Your edits haven't been saved.", [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          const f = loadedForm;
          setName(f?.name ?? '');
          setServings(f?.servings ?? '');
          setPrep(f?.prep ?? '');
          setCook(f?.cook ?? '');
          setTotal(f?.total ?? '');
          setIngredients((f?.ingredients ?? []).map(withKey));
          setSteps((f?.steps ?? []).map(withKey));
          setUserNotes(f?.userNotes ?? []);
        },
      },
    ]);
  };

  const menuActions = [
    ...(!isNew
      ? [
          {
            key: 'folder',
            label: 'Add to folder',
            icon: <FolderIcon size={18} color={colors.textSecondary} />,
            onPress: () => setFolderPickerOpen(true),
          },
          { key: 'copy', label: 'Make a copy', icon: <CopyIcon />, onPress: handleCopy },
        ]
      : []),
    ...(isDirty
      ? [{ key: 'discard', label: 'Discard changes', icon: <RestoreIcon color={colors.textSecondary} />, onPress: handleDiscard }]
      : []),
    ...(!isNew
      ? [
          {
            key: 'trash',
            label: 'Delete',
            icon: <TrashIcon size={18} />,
            onPress: handleTrash,
            danger: true,
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <View style={[styles.screen_base, styles.screen_editPad]}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  // Ingredients / Instructions: reorderable rows plus "Add <item>" and
  // "Add Section" buttons. Section rows are bold and never numbered.
  const renderItemList = (label, list, setList, placeholder, numbered = false) => {
    const stepNumbers = [];
    let n = 0;
    list.forEach((item) => stepNumbers.push(item.isHeader ? null : ++n));

    const updateText = (key, text) =>
      setList((prev) => prev.map((i) => (i.key === key ? { ...i, text } : i)));
    const remove = (key) => setList((prev) => prev.filter((i) => i.key !== key));
    const add = (isHeader) => setList((prev) => [...prev, withKey({ text: '', isHeader })]);

    return (
      <>
        <Text style={[styles.header_section, styles.editRecipe_sectionHeader]}>{label}</Text>
        {list.length === 0 && (
          <Text style={[styles.noItemsText, styles.text_body]}>No items yet.</Text>
        )}
        <ReorderableList
          items={list}
          onReorder={setList}
          onDragActiveChange={(active) => setScrollEnabled(!active)}
          renderItem={({ item, index, dragHandleProps }) => (
            <View style={styles.editRecipe_row}>
              <View {...dragHandleProps} style={styles.dragHandle} hitSlop={8}>
                <DragHandleIcon />
              </View>
              {numbered && !item.isHeader && (
                <Text style={styles.recipeItem}>{stepNumbers[index]}. </Text>
              )}
              <View style={styles.editRecipe_inputWrap}>
                <TextInput
                  multiline
                  scrollEnabled={false}
                  style={[
                    styles.input_base,
                    styles.text_body,
                    styles.editRecipe_input,
                    item.isHeader && styles.editSection_input,
                  ]}
                  value={item.text}
                  onChangeText={(text) => updateText(item.key, text)}
                  placeholder={item.isHeader ? 'Section name (e.g. For the sauce)' : placeholder}
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={item.isHeader ? 'Section name' : placeholder}
                  inputAccessoryViewID={Platform.OS === 'ios' ? DONE_ACCESSORY_ID : undefined}
                />
                <RemoveBadge
                  onPress={() => remove(item.key)}
                  accessibilityLabel={item.isHeader ? 'Remove section' : `Remove ${placeholder.toLowerCase()}`}
                />
              </View>
            </View>
          )}
        />
        <View style={styles.addButton_row}>
          <TouchableOpacity style={styles.addButton} onPress={() => add(false)}>
            <PlusIcon size={16} color={colors.primary} strokeWidth={1.75} />
            <Text style={styles.addButtonText}>Add {placeholder}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => add(true)}>
            <PlusIcon size={16} color={colors.primary} strokeWidth={1.75} />
            <Text style={styles.addButtonText}>Add Section</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Your Notes: plain list (no sections or reordering).
  const renderNotes = () => (
    <>
      <Text style={[styles.header_section, styles.editRecipe_sectionHeader]}>Your Notes</Text>
      {userNotes.length === 0 && (
        <Text style={[styles.noItemsText, styles.text_body]}>No items yet.</Text>
      )}
      {userNotes.map((item, index) => (
        <View key={index} style={styles.editRecipe_row}>
          <View style={styles.editRecipe_inputWrap}>
            <TextInput
              multiline
              scrollEnabled={false}
              style={[styles.input_base, styles.text_body, styles.editRecipe_input]}
              value={item}
              onChangeText={(text) =>
                setUserNotes((prev) => prev.map((s, i) => (i === index ? text : s)))
              }
              placeholder="Note"
              placeholderTextColor={colors.textMuted}
              inputAccessoryViewID={Platform.OS === 'ios' ? DONE_ACCESSORY_ID : undefined}
            />
            <RemoveBadge
              onPress={() => setUserNotes((prev) => prev.filter((_, i) => i !== index))}
              accessibilityLabel="Remove note"
            />
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setUserNotes((prev) => [...prev, ''])}
      >
        <PlusIcon size={16} color={colors.primary} strokeWidth={1.75} />
        <Text style={styles.addButtonText}>Add Note</Text>
      </TouchableOpacity>
    </>
  );

  // "Prep [ ] min" style number field.
  const minutesField = (label, value, setValue, placeholder = '') => (
    <View style={styles.times_field}>
      <Text style={[styles.text_body, styles.servings_label]}>{label}</Text>
      <TextInput
        style={[styles.input_base, styles.times_input, styles.text_body]}
        value={value}
        onChangeText={(t) => setValue(digitsOnly(t, 4))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        accessibilityLabel={`${label} time in minutes`}
        inputAccessoryViewID={Platform.OS === 'ios' ? DONE_ACCESSORY_ID : undefined}
      />
      <Text style={[styles.text_body, styles.servings_label]}>min</Text>
    </View>
  );
  const sumPlaceholder =
    prep || cook ? String((parsePositiveInt(prep) ?? 0) + (parsePositiveInt(cook) ?? 0)) : '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.screen_baseScroll, styles.screen_editPad]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={scrollEnabled}
      >
        <EditHeader
          variant="safe"
          onBack={() => navigation.goBack()}
          onSave={handleSave}
          saving={saving}
          menuActions={menuActions}
        />

        <TextInput
          style={[styles.header_card, styles.input_underline]}
          value={name}
          onChangeText={setName}
          placeholder={isNew ? 'New recipe name' : 'Recipe name'}
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.servings_row}>
          <Text style={[styles.text_body, styles.servings_label]}>Makes</Text>
          <TextInput
            style={[styles.input_base, styles.servings_input, styles.text_body]}
            value={servings}
            onChangeText={(t) => setServings(digitsOnly(t, 3))}
            placeholder="#"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel="Number of servings"
            inputAccessoryViewID={Platform.OS === 'ios' ? DONE_ACCESSORY_ID : undefined}
          />
          <Text style={[styles.text_body, styles.servings_label]}>servings</Text>
        </View>

        <View style={styles.times_row}>
          {minutesField('Prep', prep, setPrep)}
          {minutesField('Cook', cook, setCook)}
          {minutesField('Total', total, setTotal, sumPlaceholder)}
        </View>
        <Text style={[styles.readOnly_hint, { marginTop: 0 }]}>
          Total defaults to prep + cook. Set it yourself if there&apos;s resting or marinating time.
        </Text>

        {renderItemList('Ingredients', ingredients, setIngredients, 'Ingredient')}
        {renderItemList('Instructions', steps, setSteps, 'Step', true)}
        {renderNotes()}

      </ScrollView>

      {/* iOS-only "Done" bar above the keyboard — the multiline inputs use
          Return for newlines, so this is how you dismiss the keyboard. */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={DONE_ACCESSORY_ID}>
          <View style={styles.inputAccessory_bar}>
            <TouchableOpacity style={styles.inputAccessory_doneButton} onPress={Keyboard.dismiss}>
              <CheckIcon size={18} color={colors.primary} />
              <Text style={styles.inputAccessory_doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}


      {!isNew && (
        <FolderPickerModal
          visible={folderPickerOpen}
          onClose={() => setFolderPickerOpen(false)}
          recipeId={recipeId}
        />
      )}

      <ConfirmModal {...discardModalProps} />
    </KeyboardAvoidingView>
  );
};

export default EditRecipe;
