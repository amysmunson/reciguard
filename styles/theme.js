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
    // Status
  severityHigh:    '#a61436',
  severityMedium:  '#e37214',
  severityLow:     '#ffd000',
  // severityNone:    '#465b6d',
  // new one matches primaryBlue 
  severityNone:    '#004c72',
  severityHighBg: 'rgba(166, 20, 54, 0.16)',
  severityMediumBg: 'rgba(227, 114, 20, 0.18)', 
  severityLowBg:    'rgba(255, 228, 107, 0.24)',
  // severityNoneBg:   'rgba(80, 110, 125, 0.16)',
  severityNoneBg:   'rgba(0, 76, 114, 0.16)',

  // Neutrals
  muted:       '#888888',
  iconInactive: '#999999',
  iconDisabled: '#bbbbbb',
  border:      '#eeeeee',  // divider lines / row borders (light mode)
  borderInput: '#cccccc',  // input outlines
  borderDark:  '#2a2f36',
  surfaceAlt:  '#f8f8f8',  // cards / list-item backgrounds in light mode
  surfaceAltDark: '#1c1f24',

  // Translucent
  shadow:        'rgba(0,0,0,0.1)',
  shadowSubtle:  'rgba(0,0,0,0.15)',
  scrim:         'rgba(0,0,0,0.4)',
  overlayLight:  'rgba(255,255,255,0.05)',  // subtle wash over Landing background

  // Dark-mode variants — lighter/brighter so they read on nearBlack.
  // Contrast vs nearBlack: primaryBlueDark 4.7:1 (white text on it 4.0:1),
  // linkBlueDark 6.1:1, redDark 5.1:1.
  primaryBlueDark: '#0085cc',
  linkBlueDark:    '#3a9ad9',
  tileBlueDark:    '#1d3247',  // selected tile / info-row background
  softBlueDark:    '#24476a',
  redDark:         '#e5534b',
  severityHighDark: '#e0476a',
  severityNoneDark: '#6b9cc0',
  borderInputDark:  '#4a525c',  // input outlines (visible on nearBlack)
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
  textLink:      palette.primaryBlue,
  textOnPrimary: palette.white,

  primary:       palette.primaryBlue,
  secondary:     palette.secondaryBlue,
  tertiary:      palette.surfaceAlt,
  primarySubtle: palette.tintBlue,    // selected/info-row background
  primarySoft:   palette.softBlue,    // soft prominent button fill
  link:          palette.primaryBlue,
  favorite:      palette.primaryBlue,  // filled favorite star

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

  primary:       palette.primaryBlueDark,
  secondary:     palette.secondaryBlue,
  tertiary:      palette.surfaceAltDark,
  primarySubtle: palette.tileBlueDark,
  primarySoft:   palette.softBlueDark,
  link:          palette.linkBlueDark,
  favorite:      palette.white,        // filled favorite star

  border:        palette.borderDark,
  borderInput:   palette.borderInputDark,

  iconInactive:  palette.iconInactive,
  iconDisabled:  palette.borderDark,

  danger:        palette.redDark,
  warning:       palette.orange,
  caution:       palette.yellow,
  success:       palette.green,

  severityHigh:     palette.severityHighDark,
  severityMedium:   palette.severityMedium,
  severityLow:      palette.severityLow,
  severityNone:     palette.severityNoneDark,
  severityHighBg:   palette.severityHighBg,
  severityMediumBg: palette.severityMediumBg,
  severityLowBg:    palette.severityLowBg,
  severityNoneBg:   palette.severityNoneBg,

  shadowColor:   palette.black,
  shadow:        palette.shadow,
  shadowSubtle:  palette.shadowSubtle,
  scrim:         'rgba(0,0,0,0.6)',
  overlayLight:  palette.overlayLight,
};

// ---------------------------------------------------------------------------
// The live token set every component reads: `colors.background`, etc. It
// starts as light mode and is switched IN PLACE by setColorTokens() (called
// from applyColorScheme in lib/theme-context.js), so existing
// `import { colors }` call sites pick up dark mode without changes. Always
// read tokens at render/build time — never copy one into a module-level
// constant, or it won't follow the scheme.
//
//   import { colors } from '../styles/theme';
//   StyleSheet.create({ box: { backgroundColor: colors.background } });
// ---------------------------------------------------------------------------
export const colors = { ...lightTheme };

export const setColorTokens = (scheme) =>
  Object.assign(colors, scheme === 'dark' ? darkTheme : lightTheme);

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
