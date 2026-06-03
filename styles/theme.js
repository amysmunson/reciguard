import { useColorScheme } from 'react-native';

// ---------------------------------------------------------------------------
// Palette — the raw colors. Don't reference these directly from components;
// reference the semantic tokens below (colors.background, colors.text, ...).
// ---------------------------------------------------------------------------
const palette = {
  // Brand blues
  primaryBlue:        '#004c72',  // main brand blue
  secondaryBlue:     '#c5edff',  // secondary, soft blue
  linkBlue:    '#0085cc',    // standard blue used for interactive text + UI accents
  softBlue:    '#aecbe7',    // soft blue fill for prominent picker buttons
  tintBlue:    '#e8f0fa',    // palest blue — selected tile / info-row background

  // Surfaces (page backgrounds)
  white:       '#ffffff',
  black:       '#000000',
  nearBlack:   '#0e1116',

  // Ink (body text)
  ink:         '#090909',
  inkSecondary: '#333333',
  inkTertiary:  '#666666',
  inkInverse:  '#f5f5f5',

  // Status
  red:         '#c13729',  // danger
  orange:      '#ff9539',  // warning FFAF54
  yellow:      '#ffe371',  // caution
  green:       '#28a745',  // success / save action

  // Allergy severity — semantic, distinct from generic danger/warning so
  // the severity scale stays self-consistent across foreground + bg tints.
  severityHigh:    '#c0392b',
  severityMedium:  '#e67e22',
  severityLow:     '#f1c40f',
  severityNone:    '#999999',
  severityHighBg:   'rgba(192, 57, 43, 0.18)',
  severityMediumBg: 'rgba(230, 126, 34, 0.22)',
  severityLowBg:    'rgba(241, 196, 15, 0.28)',
  severityNoneBg:   'rgba(160, 160, 160, 0.18)',

  // Neutrals
  muted:       '#888888',
  iconInactive: '#999999',
  iconDisabled: '#bbbbbb',
  border:      '#eeeeee',  // divider lines / row borders (light mode)
  borderInput: '#cccccc',  // input outlines
  borderDark:  '#2a2f36',
  surfaceAlt:  '#f4f4f4',  // cards / list-item backgrounds in light mode
  surfaceAltDark: '#1c1f24',

  // Translucent
  shadow:        'rgba(0,0,0,0.1)',
  shadowSubtle:  'rgba(0,0,0,0.15)',
  scrim:         'rgba(0,0,0,0.4)',
  overlayLight:  'rgba(255,255,255,0.05)',  // subtle wash over Landing background
};

// ---------------------------------------------------------------------------
// Semantic themes — what components should consume.
// Each key has the same meaning in both modes; only the underlying color
// changes. Add a new key here whenever you add a new "role" the UI needs.
// ---------------------------------------------------------------------------
const lightTheme = {
  background:    palette.white,
  surface:       palette.surfaceAlt,
  text:          palette.ink,
  textSecondary: palette.inkSecondary,
  textTertiary:  palette.inkTertiary,
  textMuted:     palette.muted,
  textInverse:  palette.inkInverse,
  textLink:      palette.linkBlue,
  textOnPrimary: palette.white,

  primary:       palette.primaryBlue,
  secondary:     palette.secondaryBlue,
  tertiary:      palette.surfaceAlt,
  primarySubtle: palette.tintBlue,    // selected/info-row background
  primarySoft:   palette.softBlue,    // soft prominent button fill
  link:          palette.linkBlue,

  border:        palette.border,        // light divider (#eee)
  borderInput:   palette.borderInput,   // input outline (#ccc)

  iconInactive:  palette.iconInactive,  // inactive icon (#999)
  iconDisabled:  palette.iconDisabled,  // disabled icon (#bbb)

  danger:        palette.red,
  warning:       palette.orange,
  caution:       palette.yellow,
  success:       palette.green,

  severityHigh:     palette.severityHigh,
  severityMedium:   palette.severityMedium,
  severityLow:      palette.severityLow,
  severityNone:     palette.severityNone,
  severityHighBg:   palette.severityHighBg,
  severityMediumBg: palette.severityMediumBg,
  severityLowBg:    palette.severityLowBg,
  severityNoneBg:   palette.severityNoneBg,

  shadowColor:   palette.black,
  shadow:        palette.shadow,
  shadowSubtle:  palette.shadowSubtle,
  scrim:         palette.scrim,
  overlayLight:  palette.overlayLight,
};

const darkTheme = {
  background:    palette.nearBlack,
  surface:       palette.surfaceAltDark,
  text:          palette.inkInverse,
  textSecondary: palette.inkInverse,
  textTertiary:  palette.muted,
  textMuted:     palette.muted,
  textLink:      palette.linkBlue,
  textOnPrimary: palette.white,

  primary:       palette.primaryBlue,
  secondary:     palette.secondaryBlue,
  tertiary:      palette.surfaceAltDark,
  primarySubtle: palette.tintBlue,
  primarySoft:   palette.softBlue,
  link:          palette.linkBlue,

  border:        palette.borderDark,
  borderInput:   palette.borderDark,

  iconInactive:  palette.iconInactive,
  iconDisabled:  palette.iconDisabled,

  danger:        palette.red,
  warning:       palette.orange,
  caution:       palette.yellow,
  success:       palette.green,

  severityHigh:     palette.severityHigh,
  severityMedium:   palette.severityMedium,
  severityLow:      palette.severityLow,
  severityNone:     palette.severityNone,
  severityHighBg:   palette.severityHighBg,
  severityMediumBg: palette.severityMediumBg,
  severityLowBg:    palette.severityLowBg,
  severityNoneBg:   palette.severityNoneBg,

  shadowColor:   palette.black,
  shadow:        palette.shadow,
  shadowSubtle:  palette.shadowSubtle,
  scrim:         palette.scrim,
  overlayLight:  palette.overlayLight,
};

// ---------------------------------------------------------------------------
// Default static export — usable inside StyleSheet.create() at module load
// time. This is light mode. Use this for the existing shared StyleSheet.
//
//   import { colors } from '../styles/theme';
//   StyleSheet.create({ box: { backgroundColor: colors.background } });
// ---------------------------------------------------------------------------
export const colors = lightTheme;

// ---------------------------------------------------------------------------
// Hook for components that should respect system dark mode at runtime.
// Use this inside a component, then build inline styles (or memoized
// StyleSheet.create()) from the returned object.
//
//   const c = useColors();
//   <View style={{ backgroundColor: c.background }} />
// ---------------------------------------------------------------------------
export const useColors = () => (useColorScheme() === 'dark' ? darkTheme : lightTheme);

export { palette, lightTheme, darkTheme };
