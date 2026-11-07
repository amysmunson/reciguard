// Central collection of icons
//   1. SVG icons from HeroIcons in files
//   2. Vector-icon wrappers defined inline below

// Stateful icons like CheckboxIcon take a state prop and pick the right glyph internally.
// Callers don't have to keep two icon strings in sync.

import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import FAIcon from '@expo/vector-icons/FontAwesome';
import { colors } from '../../styles/theme';

// SVG icons
export { default as PlusIcon } from './PlusIcon';
export { default as SearchIcon } from './SearchIcon';
export { default as SortIcon } from './SortIcon';
export { default as FilterIcon } from './FilterIcon';
export { default as EditIcon } from './EditIcon';
export { default as StarIcon } from './StarIcon';

// Vector icons

// Uses styles.overlayIcon_sm or styles.overlayIcon_lg for size/color
export const BackIcon = ({ style, ...rest }) => (
  <Ionicons name="chevron-back" style={style} {...rest} />
);

export const ExternalLinkIcon = ({ size = 20, color = colors.primary, style, ...rest }) => (
  <Ionicons name="open-outline" size={size} color={color} style={style} {...rest} />
);

export const TrashIcon = ({ size = 20, color = colors.danger, style, ...rest }) => (
  <Ionicons name="trash-outline" size={size} color={color} style={style} {...rest} />
);

export const CopyIcon = ({ size = 18, color = colors.textSecondary, style, ...rest }) => (
  <Ionicons name="copy-outline" size={size} color={color} style={style} {...rest} />
);

// Restore from Trash.
export const RestoreIcon = ({ size = 18, color = colors.primary, style, ...rest }) => (
  <Ionicons name="arrow-undo-outline" size={size} color={color} style={style} {...rest} />
);

export const RemoveCircleIcon = ({ size = 22, color = colors.danger, style, ...rest }) => (
  <Ionicons name="remove-circle-outline" size={size} color={color} style={style} {...rest} />
);

// Filled minus badge on the corner of an EditRecipe row's input (RemoveBadge).
export const RemoveBadgeIcon = ({ size = 20, color = colors.danger, style, ...rest }) => (
  <Ionicons name="remove-circle" size={size} color={color} style={style} {...rest} />
);

export const EllipsisIcon = ({ size = 20, color = colors.textSecondary, style, ...rest }) => (
  <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} style={style} {...rest} />
);

export const CheckIcon = ({ size = 20, color = colors.primary, style, ...rest }) => (
  <Ionicons name="checkmark" size={size} color={color} style={style} {...rest} />
);

export const ShareIcon = ({ size = 18, color = colors.textOnPrimary, style, ...rest }) => (
  <Ionicons name="share-outline" size={size} color={color} style={style} {...rest} />
);

// Two Links
export const LinkIcon = ({ size = 12, color = colors.textOnPrimary, style, ...rest }) => (
  <Ionicons name="link" size={size} color={color} style={style} {...rest} />
);

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

export const AllergyListIcon = ({ size = 22, color = colors.textSecondary, style, ...rest }) => (
  <Ionicons name="list-outline" size={size} color={color} style={style} {...rest} />
);

export const FolderIcon = ({ size = 22, color = colors.primary, style, ...rest }) => (
  <FAIcon name="folder" size={size} color={color} style={style} {...rest} />
);

// Drag handle on reorderable EditRecipe rows.
export const DragHandleIcon = ({ size = 22, color = colors.iconInactive, style, ...rest }) => (
  <Ionicons name="reorder-three-outline" size={size} color={color} style={style} {...rest} />
);

// Stateful icons

// Checkbox that can be checked/unchecked 
export const CheckboxIcon = ({ checked = false, size = 22, color, style, ...rest }) => {
  const name = checked ? 'checkbox' : 'square-outline';
  const resolvedColor = color ?? (checked ? colors.primary : colors.textMuted);
  return <Ionicons name={name} size={size} color={resolvedColor} style={style} {...rest} />;
};

// Circular checkbox
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

// Radio button for SortMenu options
export const RadioIcon = ({ selected = false, size = 20, color, style, ...rest }) => {
  const name = selected ? 'radio-button-on' : 'radio-button-off';
  const resolvedColor = color ?? (selected ? colors.primary : colors.textMuted);
  return <Ionicons name={name} size={size} color={resolvedColor} style={style} {...rest} />;
};

// Arrows for the SortMenu asc/desc
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

// NavBar icons, requires passed route name
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
