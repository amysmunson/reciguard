import { StyleSheet, Dimensions } from 'react-native';
import { colors } from './theme';

// This will need to change if you want the number of columns to be dependent on screen size
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const itemMargin = 20;
const numColumns = 2;
const itemSize = (screenWidth - (itemMargin * (numColumns + 1))) / numColumns;

const styles = StyleSheet.create({
  // === Containers ======================================================
  // Compose on the outer wrapper (View / ScrollView):
  //   [screen_base, screen_<archetype>Pad]
  // For ScrollView contentContainerStyle, use screen_baseScroll instead
  // so the container grows with content (flexGrow) rather than capping
  // at the viewport (flex). Padding presets stay the same.

  // Shared shape — flex:1 + theme background. Every screen starts here.
  screen_base: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Same but for ScrollView contentContainerStyle (uses flexGrow).
  screen_baseScroll: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },

  // Tab-screen padding — Home, Folders, Friends, Settings, FolderDetail.
  // Tight horizontal padding (lets list items reach close to the edge);
  // top clears the status bar + header; bottom clears the NavBar.
  screen_tabPad: {
    paddingHorizontal: itemMargin / 2,
    paddingTop: 70,
    paddingBottom: 20,
  },
  // Card-screen padding — Profile, FriendProfile (scrollable detail).
  // Wider horizontal padding for readable prose; generous bottom space
  // so the last content isn't covered by floating bottom actions.
  screen_cardPad: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  // Edit-screen padding — EditRecipe. Same horizontal as card, but less
  // bottom since the keyboard takes that space.
  screen_editPad: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 50,
  },
  // Auth-screen padding — Login, SignUp. Generous horizontal padding to
  // center form inputs; large top clears the auth back button at top:60.
  screen_authPad: {
    paddingHorizontal: 30,
    paddingTop: 100,
  },
  // Landing-screen padding — only horizontal; vertical is handled by
  // flex regions inside (title area + bottom action stack).
  screen_landingPad: {
    paddingHorizontal: 30,
  },
  // Policy-screen padding — applied to a ScrollView contentContainerStyle.
  // Symmetric vertical padding (no NavBar below) plus large top to clear
  // the back button.
  screen_policyPad: {
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 30,
  },

  // === Typography ======================================================
  // Compose: [text_<size>, text_bold?, text_centered?, ...]
  // Size atoms set fontSize only. Use the modifiers to add weight,
  // alignment, or style; use the header presets below for common
  // page-level headers that bundle size + weight + spacing.

  // Size atoms.
  text_display: { fontSize: 48 },
  text_h1: { fontSize: 32 },
  text_h2: { fontSize: 28 },
  text_h3: { fontSize: 24 },
  text_h4: { fontSize: 20 },
  text_h5: { fontSize: 18 },
  text_body: { fontSize: 16 },
  text_bodySmall: { fontSize: 15 },
  text_caption: { fontSize: 14 },
  text_label: { fontSize: 13 },
  text_micro: { fontSize: 12 },

  // Modifiers.
  text_bold: { fontWeight: 'bold' },
  text_italic: { fontStyle: 'italic' },
  text_centered: { textAlign: 'center' },
  text_uppercase: { textTransform: 'uppercase' },

  // === Header presets ==================================================
  // Ready-to-use header styles for common page archetypes. Each is
  // size + weight + alignment + the spacing that fits its layout.
  // For one-off headers that don't match one of these, compose
  // typography atoms directly.

  // Tab-screen page header — Home/Folders/Friends/Settings/FolderDetail.
  header_tab: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  // Card-screen page header — Profile/FriendProfile/RecipeCard, plus
  // the EditRecipe name input. Top padding clears the back button.
  header_card: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 60,
    marginBottom: 20,
  },
  // Auth screen title — Login/SignUp.
  header_auth: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Landing hero title. Sized so an 11-char product name ("RecipeGuard")
  // fits a single line inside a 360-wide LandingCard without wrapping.
  header_landing: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  // Modal title — shown at the top of a modal_card.
  header_modal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  // In-content section label — Profile/FriendProfile field labels,
  // EditRecipe section names. Add marginTop inline for extra breathing
  // room above (e.g., between major sections).
  header_section: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  // Privacy Policy main title.
  header_policyMain: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  // Privacy Policy in-content subheading.
  header_policySection: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },

  // === Top-Overlay Actions =============================================
  // Absolute-positioned action buttons at the top corners of a screen
  // (back arrow, edit toggle, etc.). Compose on the TouchableOpacity:
  //   [overlay_base, overlay_<corner>_<spacing>]
  // and use overlayIcon_sm/lg on the icon inside, or overlayText on a
  // text label like "Edit"/"Cancel".
  //
  // Corner picks left/right; spacing picks how far in/down the action
  // sits — `card` (top:20, tight to a card-screen header) vs `safe`
  // (top:60, comfortable safe-area offset for screens without a header
  // overlapping the top).

  // Shared: absolute + zIndex above scrolling content.
  overlay_base: {
    position: 'absolute',
    zIndex: 10,
  },

  // Card-screen overlay positions — small top offset; horizontal value
  // is flush to the card content edge.
  overlay_topLeft_card: {
    top: 20,
    left: -10,
    paddingTop: 5,
  },
  overlay_topRight_card: {
    top: 20,
    right: 0,
    paddingTop: 5,
  },

  // Safe-area overlay positions — for screens without a card-style
  // header above (Login, SignUp, EditRecipe, FolderDetail, Privacy).
  overlay_topLeft_safe: {
    top: 60,
    left: 10,
    padding: 10,
  },
  overlay_topRight_safe: {
    top: 60,
    right: 10,
    padding: 10,
  },

  // Icons inside an overlay action — sized to match surrounding visual
  // weight. `sm` for card screens, `lg` for auth/privacy.
  overlayIcon_sm: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  overlayIcon_lg: {
    fontSize: 24,
    color: colors.textSecondary,
  },

  // Text label inside an overlay action (e.g. "Edit", "Cancel").
  overlayText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // === Inputs ==========================================================
  // Compose: [input_base, input_<modifier>?, ...]
  // input_base gives a bordered single-line TextInput. Add modifiers for
  // layout (stacked-form margin, inline-row flex) or specialized look
  // (underline-only, monospace code entry).

  // Base shape — bordered rectangle with comfortable padding.
  input_base: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  // Stacked form input — adds bottom margin so consecutive inputs in a
  // vertical form separate without needing wrapper spacing.
  input_spaced: {
    marginBottom: 12,
  },
  // Inline row input — fills the row to the left of a trailing action
  // button (e.g. delete icon in an ingredient row).
  input_inRow: {
    flex: 1,
    marginRight: 10,
  },
  // Underline-only — used when the input doubles as a heading
  // (e.g. EditRecipe's name input on top of header_card). Apply alongside
  // a header style; no surrounding border, just a bottom rule.
  input_underline: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  // Friend-code entry — large monospace characters with letter spacing,
  // centered. Compose with [input_base, input_spaced, input_code].
  input_code: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20,
    fontFamily: 'Courier',
  },

  // === Surface Blocks ==================================================
  // Compose: [surface_<size>, surface_<modifier>?, ...]
  // Surfaces are rounded padded backgrounds for content blocks (cards,
  // info rows, modals). Pick a size; add a tint modifier if the background
  // should differ from the default neutral surface.

  // Small surface — readOnlyBlock, linkStatus_row.
  surface_sm: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  // Large surface — friendCode_card.
  surface_lg: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  // Modal card — sits on top of a scrim, fills the modal width.
  surface_modal: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
  },
  // Tint modifier — overrides surface bg with the subtle primary tint
  // (used for info/link-status rows).
  surface_tinted: {
    backgroundColor: colors.primarySubtle,
  },


  // === Buttons =========================================================
  // Compose on the TouchableOpacity:
  //   [button_base, button_fullWidth?, button_<variant>]
  // and on the Text inside:
  //   [buttonText_base, buttonText_<variant>]
  // For one-off tweaks (extra margin, smaller padding, custom color) pass
  // an inline style object as the last array element on either side.

  // Shared button shape — padding, radius, alignment.
  button_base: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  // Opt-in full-width modifier. Apply when the button should stretch to
  // its container; omit for inline/auto-width buttons.
  button_fullWidth: {
    width: '100%',
  },
  // Background variants — pick ONE per button.
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.background,
  },
  // Auth-screen primary — darker brand blue with extra bottom margin to
  // separate from the "switch to Sign in/up" link beneath it.
  button_authPrimary: {
    backgroundColor: colors.primary,
    marginTop: 10,
    marginBottom: 20,
  },

  // Shared button label shape — font size + weight.
  buttonText_base: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Label color variants — match to the background variant above.
  buttonText_onPrimary: {
    color: colors.textOnPrimary,
  },
  buttonText_onSecondary: {
    color: colors.primary,
  },
  buttonText_onAuthPrimary: {
    color: colors.textOnPrimary,
  },

  // --- Link-style buttons (text-only, no fill) -------------------------
  // Compose: [button_link] + [buttonText_link] (or buttonText_authLink).
  button_link: {
    padding: 8,
    alignSelf: 'center',
  },
  // Default link label — small, underlined, link color.
  buttonText_link: {
    color: colors.link,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // Auth "Already have an account? / Don't have one?" link — centered,
  // no underline, body-sized so it doesn't look like a footnote.
  buttonText_authLink: {
    color: colors.link,
    textAlign: 'center',
  },

  // --- Outline buttons (bordered, no fill — for secondary CTAs) -------
  // Compose: [button_outline, button_outline_<color>] on the touchable,
  // and [buttonText_outline, { color: <matching> }] on the label inside.
  button_outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  button_outline_link: { borderColor: colors.link },
  button_outline_danger: { borderColor: colors.danger },
  // Shared label shape for outline buttons — bold with margin to space
  // the text from a preceding icon.
  buttonText_outline: {
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // ===================================================================
  // === DOMAIN-SPECIFIC STYLES =========================================
  // ===================================================================
  // Everything below is tied to a specific screen, component, or
  // feature and isn't reused as a generic primitive. Many sections
  // include a short "use X" breadcrumb pointing at the consolidated
  // atom/preset for the slot in question (container, header, back
  // button, etc.) — that's intentional; the named style was removed
  // and only the breadcrumb remains.

  //   Recipe / Folder Tile (square card for the home + folder grids)
  listItem: {
    width: itemSize,
    height: itemSize,    // force square shape
    margin: itemMargin / 2,
    backgroundColor: colors.primarySubtle,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  listItemText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  home_search: {
    position: 'absolute',
    top: 45, // leave space for status bar
    right: 10,
    backgroundColor: colors.background,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  // Folders screen: sort + add buttons, aligned top-right.
  folders_topActions: {
    position: 'absolute',
    top: 45, // leave space for status bar
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  folders_topButton: {
    padding: 14,
    borderRadius: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderInput,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  navButtonText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  navButtonIcon: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  navButtonIconActive: {
    color: colors.primary,
  },
  // Active tab — only color changes. Don't add fontWeight/size here:
  // bolding shifts label widths and space-around redistributes the row,
  // causing every other icon to nudge sideways on press.
  navButtonTextActive: {
    color: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 20,
    fontStyle: 'italic',
  },


  //   Recipe Card Styles
  //   Container → [screen_base, screen_cardPad]. Page header → header_card.
  //   Back arrow → [overlay_base, overlay_topLeft_card] + overlayIcon_sm.
  //   Edit toggle → [overlay_base, overlay_topRight_card] + overlayText.
  // Centered title row; link icon (if present) sits to the right of the title.
  card_headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  card_sourceLink: {
    paddingHorizontal: 8,
    paddingBottom: 22,
    marginLeft: 4,
  },
  ingredientItems: {
    fontSize: 16,
    marginVertical: 5,
    color: colors.textSecondary,
  },
  spacing: {
    marginBottom: 10,
  },

  //   Edit Recipe Styles
  //   Container → [screen_base, screen_editPad] (View) or [screen_baseScroll,
  //     screen_editPad] (ScrollView contentContainerStyle).
  //   Name input  → [header_card, input_underline].
  //   Back arrow  → [overlay_base, overlay_topLeft_safe] + overlayIcon_sm.
  //   Ingredient inputs → [input_base, input_inRow].
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteRecipeButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    right: 10,
    zIndex: 10,
    elevation: 10,
  },
  // FolderDetail sort button — sits just left of the "Delete" button.
  folderDetail_sortButton: {
    top: 56,
    right: 80,
    padding: 10,
    zIndex: 10,
    elevation: 10,
  },
  deleteButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: colors.danger,
  },
  noItemsText: {
    fontStyle: 'italic',
    color: colors.textMuted,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.link,
    fontSize: 18,
    marginLeft: 6,
  },

  //   Input Selector Styles
  //   Container: compose [screen_base, screen_tabPad] at the call site.
  inputButton: {
    backgroundColor: colors.primarySubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ((screenHeight - 200) / 8),
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  inputButtonText: {
    color: colors.text,
    fontSize: 24,
    textAlign: 'center',
    marginLeft: 10,
  },

  //   Link Entry (InputSelector "From link" mode)
  linkEntry_container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 70, // match screen_tabPad so the header aligns with picker mode
    backgroundColor: colors.background,
  },
  linkEntry_hint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  linkEntry_input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  linkEntry_error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
  },
  linkEntry_fetchButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  linkEntry_fetchButtonText: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: 'bold',
  },

  //   Landing Styles
  //   Container → [screen_base, screen_landingPad].
  //   Title     → [header_landing, { color: colors.text }].
  //   Subtitle  → [text_body, text_centered, { color: colors.text }].
  landing_overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayLight,
  },
  landing_titleArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landing_actions: {
    paddingBottom: 40,
    width: '100%',
  },

  //   Auth Styles (Login, SignUp)
  //   Container   → [screen_base, screen_authPad].
  //   Back arrow  → [overlay_base, overlay_topLeft_safe] + overlayIcon_lg.
  //   Title       → header_auth.
  //   Form inputs → [input_base, input_spaced].
  //   Primary CTA → [button_base, button_fullWidth, button_authPrimary]
  //                 + [buttonText_base, buttonText_onAuthPrimary].
  //   Switch link → [button_link] + [buttonText_authLink].

  //   Privacy Policy Styles
  //   Container        → screen_policyPad (apply to ScrollView contentContainerStyle).
  //   Back arrow       → [overlay_base, overlay_topLeft_safe] + overlayIcon_lg.
  //   Page title       → header_policyMain.
  //   Section heading  → header_policySection.
  policy_updated: {
    color: colors.textMuted,
    marginBottom: 20,
  },
  policy_body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  //  Settings-specific styles
  settings_email: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: colors.textTertiary,
  },

  //   List Row Styles — shared by Settings and Friends.
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  //   Modal Styles
  //   Card body  → surface_modal.   Title → header_modal.
  modal_backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modal_button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modal_buttonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  //   Selection Mode Styles
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectBar_cancel: {
    fontSize: 16,
    color: colors.link,
  },
  selectBar_count: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  listItem_selected: {
    borderWidth: 2,
    borderColor: colors.link,
    backgroundColor: colors.primarySubtle,
  },
  selectCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  //   Per-Person Allergy Dots (on recipe tiles in Home / FolderDetail)
  allergyDotRow: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  allergyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 3,
    borderWidth: 1,
    borderColor: colors.shadowSubtle,
  },

  //   Severity Chip (next to allergy name in Profile / FriendProfile)
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.shadowSubtle,
  },
  severityChipLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  //   Severity Picker (for new-allergy entry: Mild / Moderate / Severe)
  severityPicker: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  severityPickerChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderInput,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  severityPickerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  //   Allergy Row (allergy name + severity chip + optional trash)
  allergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  //   Ingredient Highlight + Popup (in RecipeCard for matching ingredients)
  ingredientHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginVertical: 3,
  },
  allergyPopup: {
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 10,
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  allergyPopup_severity: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  allergyPopup_names: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  //   Home Action Bar (inline: [search input] sort filter)
  home_actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  home_actionBar_searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  home_actionBar_searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 4,
    marginLeft: 6,
  },
  home_actionBar_iconButton: {
    padding: 8,
    marginLeft: 2,
  },
  home_actionBar_iconDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  //   Sort Popdown (drops from the sort button in the action bar)
  sort_popdown_backdrop: {
    flex: 1,
  },
  sort_popdown: {
    position: 'absolute',
    top: 170,
    right: 14,
    minWidth: 220,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 6,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  sort_popdown_row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sort_popdown_rowText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
  },
  sort_popdown_divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
    marginHorizontal: 14,
  },

  //   Allergy Checklist — inline picker rows (on Profile & FriendProfile in edit mode)
  preset_sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textTertiary,
    marginTop: 6,
    marginBottom: 4,
  },
  preset_row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preset_groupTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  preset_groupDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  preset_itemName: {
    fontSize: 15,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  preset_addedHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginLeft: 8,
  },

  //   Filter / Folder Picker Modal Rows
  filter_row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  filter_rowText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
  },

  //   Friends Screen
  //   Apply friends_list to the <FlatList> itself — negative horizontal
  //   margin pulls the list's content area out to the screen edges while the
  //   surrounding container keeps its padding (so the nav bar + "+" button
  //   stay inset like Home/Folders/Settings).
  friends_list: {
    marginHorizontal: -itemMargin / 2,
  },
  friends_meRow: {
    backgroundColor: colors.surface,
  },

  //   Friend Code Card (Profile): [surface_lg, { marginVertical: 10, alignItems: 'center' }]
  friendCode_label: {
    fontSize: 13,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  friendCode_value: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: colors.primary,
    fontFamily: 'Courier',
    marginBottom: 8,
  },
  friendCode_hint: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  friendCode_shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  friendCode_shareText: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },

  //   Friend Code Input (for entering someone else's): combine
  //   [input_base, input_spaced, input_code] (defined in Inputs block).

  //   Link Badge (small inline badge next to a friend's name)
  linkBadge: {
    backgroundColor: colors.link,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  //   Link Status Row (FriendProfile when linked):
  //   [surface_sm, surface_tinted, { flexDirection:'row', alignItems:'center', marginBottom:8 }]
  linkStatus_text: {
    flex: 1,
    marginLeft: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkStatus_action: {
    color: colors.link,
    fontWeight: 'bold',
    fontSize: 14,
  },

  //   "Link to Real Account" Button (FriendProfile when not linked):
  //   [button_outline, button_outline_link, { marginBottom: 8 }]
  //   + [buttonText_outline, { color: colors.link }]

  //   Add-Friend Choice Buttons (in Friends modal)
  addChoice_button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  addChoice_title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  addChoice_subtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },

  //   Display-mode Field Values (plain text rendered where TextInput lives in edit mode)
  display_fieldValue: {
    fontSize: 16,
    color: colors.textSecondary,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  display_fieldEmpty: {
    fontStyle: 'italic',
    color: colors.textMuted,
  },

  //   Bottom destructive "Remove Friend" button on FriendProfile:
  //   [button_outline, button_outline_danger, { marginTop: 20 }]
  //   + [buttonText_outline, { color: colors.danger }]

  //   Read-Only Display Blocks (linked friend's public notes):
  //   [surface_sm, { marginBottom: 4 }]
  readOnlyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  readOnly_hint: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
});

export default styles;
