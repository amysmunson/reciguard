// Central icon registry.
//
// Every icon used in the app lives here. To swap an icon — change its
// look, switch icon libraries, replace a vendor icon with a custom SVG —
// edit this file in one place and every screen picks it up.
//
// Two kinds of icons:
//
//   1. Custom SVG icons (one file each, in this directory):
//      PlusIcon, SearchIcon, SortIcon, FilterIcon.
//
//   2. Vector-icon wrappers (defined inline below) — each pins a semantic
//      name (e.g. `BackIcon`) to a specific vendor icon string. Defaults
//      reflect the most common usage; pass `size`, `color`, or `style` to
//      override. `style` always wins over `size`/`color` (react-native-
//      vector-icons honors style.fontSize / style.color).
//
// Stateful icons (`CheckboxIcon`, `RadioIcon`, `SelectCircleIcon`,
// `SortArrowIcon`) take a state prop and pick the right glyph internally
// so callers don't have to keep two icon strings in sync.

import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../styles/theme';

// --- Custom SVG icons (live in their own files) ---------------------------
export { default as PlusIcon } from './PlusIcon';
export { default as SearchIcon } from './SearchIcon';
export { default as SortIcon } from './SortIcon';
export { default as FilterIcon } from './FilterIcon';
export { default as EditIcon } from './EditIcon';

// --- Navigation / structure ----------------------------------------------

// Back chevron used by every overlay back button. Pair with
// styles.overlayIcon_sm or styles.overlayIcon_lg for size + color.
export const BackIcon = ({ style, ...rest }) => (
  <Ionicons name="chevron-back" style={style} {...rest} />
);

// "Open original" / external-link icon on RecipeCard.
export const ExternalLinkIcon = ({ size = 20, color = colors.primary, style, ...rest }) => (
  <Ionicons name="open-outline" size={size} color={color} style={style} {...rest} />
);

// --- Destructive / write actions -----------------------------------------

export const TrashIcon = ({ size = 20, color = colors.danger, style, ...rest }) => (
  <Ionicons name="trash-outline" size={size} color={color} style={style} {...rest} />
);

// Remove-from-folder action in FolderDetail's select bar.
export const RemoveCircleIcon = ({ size = 22, color = colors.danger, style, ...rest }) => (
  <Ionicons name="remove-circle-outline" size={size} color={color} style={style} {...rest} />
);

export const ShareIcon = ({ size = 18, color = colors.textOnPrimary, style, ...rest }) => (
  <Ionicons name="share-outline" size={size} color={color} style={style} {...rest} />
);

// --- Linking / friend code -----------------------------------------------

// Filled link glyph used in the small "this friend is linked" badge.
export const LinkIcon = ({ size = 12, color = colors.textOnPrimary, style, ...rest }) => (
  <Ionicons name="link" size={size} color={color} style={style} {...rest} />
);

// Outline link glyph used on the InputSelector "From link" picker.
export const LinkOutlineIcon = ({ style, ...rest }) => (
  <Ionicons name="link-outline" style={style} {...rest} />
);

export const ImageIcon = ({ style, ...rest }) => (
  <Ionicons name="image-outline" style={style} {...rest} />
);

export const KeyIcon = ({ size = 22, color = colors.primary, style, ...rest }) => (
  <Ionicons name="key-outline" size={size} color={color} style={style} {...rest} />
);

export const PersonAddIcon = ({ size = 22, color = colors.primary, style, ...rest }) => (
  <Ionicons name="person-add-outline" size={size} color={color} style={style} {...rest} />
);

// --- Folder (bulk action in Home select bar + folder-picker rows) --------
export const FolderIcon = ({ size = 22, color = colors.primary, style, ...rest }) => (
  <FAIcon name="folder" size={size} color={color} style={style} {...rest} />
);

// --- Stateful toggles ----------------------------------------------------

// Square checkbox: unchecked / partial / checked. Use in filter rows,
// AllergyChecklist presets, etc. `partial` only renders if the box isn't
// fully checked.
export const CheckboxIcon = ({
  checked = false,
  partial = false,
  size = 22,
  color,
  style,
  ...rest
}) => {
  const name = checked ? 'checkbox' : partial ? 'remove-circle' : 'square-outline';
  const resolvedColor = color ?? (checked || partial ? colors.primary : colors.textMuted);
  return <Ionicons name={name} size={size} color={resolvedColor} style={style} {...rest} />;
};

// Circular checkmark used on multi-select recipe tiles. Empty circle when
// not selected, filled checkmark when selected.
export const SelectCircleIcon = ({
  selected = false,
  size = 24,
  color,
  style,
  ...rest
}) => {
  const name = selected ? 'checkmark-circle' : 'ellipse-outline';
  const resolvedColor = color ?? (selected ? colors.primary : colors.iconInactive);
  return <Ionicons name={name} size={size} color={resolvedColor} style={style} {...rest} />;
};

// Radio button used in SortMenu rows.
export const RadioIcon = ({ selected = false, size = 20, color, style, ...rest }) => {
  const name = selected ? 'radio-button-on' : 'radio-button-off';
  const resolvedColor = color ?? (selected ? colors.primary : colors.textMuted);
  return <Ionicons name={name} size={size} color={resolvedColor} style={style} {...rest} />;
};

// Up/down arrow for SortMenu's asc/desc toggle.
export const SortArrowIcon = ({
  direction = 'asc',
  size = 20,
  color = colors.primary,
  style,
  ...rest
}) => {
  const name = direction === 'asc' ? 'arrow-up' : 'arrow-down';
  return <Ionicons name={name} size={size} color={color} style={style} {...rest} />;
};

// --- Bottom NavBar tabs --------------------------------------------------

// Single icon component for the bottom tab bar. Pass `name` matching the
// route name; the mapping to vendor icons lives here so NavigationBar
// doesn't need to know about FontAwesome glyph names.
const TAB_GLYPHS = {
  Home: 'home',
  Folders: 'folder',
  Add: 'plus-square-o',
  Friends: 'users',
  Settings: 'cogs',
};
export const TabIcon = ({ name, style, ...rest }) => (
  <FAIcon name={TAB_GLYPHS[name] ?? name} style={style} {...rest} />
);
