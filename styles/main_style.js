import { StyleSheet, Dimensions } from 'react-native';
import { colors } from './theme';

// This will need to change if you want the number of columns to be dependent on screen size
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const itemMargin = 20;
const numColumns = 2;
const itemSize = (screenWidth - (itemMargin * (numColumns + 1))) / numColumns;

const styles = StyleSheet.create({
    // Home Screen Styles
    container: {
      flex: 1,
      padding: itemMargin / 2,
      paddingTop: 70,
      paddingBottom: 20,
      backgroundColor: colors.background,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 20,
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
      backgroundColor: colors.tertiary,
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
    











































    listItem: {
      width: itemSize,
      height: itemSize,    // force square shape
      margin: itemMargin / 2,
      backgroundColor: colors.surface,
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
    home_searchIcon: {
      color: colors.textSecondary,
      fontSize: 20,
      fontWeight: 'bold',
    },
    bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderInput,
    },
    navButton: {
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
    card_container: {
      flex: 1,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 40,
      paddingBottom: 100,
      backgroundColor: colors.background,
    },
    card_header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      paddingTop: 60,
    },
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
    card_backButton: {
      zIndex: 10,
      paddingTop: 5,
      position: 'absolute',
      top: 20,
      left: -10,
    },
    card_backIcon: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    card_edit: {
      zIndex: 10,
      paddingTop: 5,
      position: 'absolute',
      top: 20,
      right: 0,
    },
    card_editText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    // Placeholders
    ingredientItems: {
      fontSize: 16,
      marginVertical: 5,
      color: colors.textSecondary,
    },
    subheading: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'left',
      marginBottom: 5,
    },
    spacing: {
      marginBottom: 10,
    },

//   Edit Recipe Styles
    edit_container: {
      flexGrow: 1,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 40,
      paddingBottom: 50,
      backgroundColor: colors.background,
    },
    edit_header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      paddingTop: 60,
    },
    edit_nameInput: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 6,
    },
    edit_backButton: {
      zIndex: 10,
      paddingTop: 10,
      position: 'absolute',
      top: 60,
      left: 10,
    },
    edit_backButtonIcon: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    ingredients: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderInput,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 6,
      fontSize: 16,
      marginRight: 10,
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
    sectionHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 10,
    },

//   Input Selector Styles
    inputContainer: {
      flex: 1,
      padding: itemMargin / 2,
      backgroundColor: colors.background,
      justifyContent: 'center',
    },
    inputButton: {
        backgroundColor: colors.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: ((screenHeight - 200) / 4),
        margin: 10,
        padding: 20,
        borderRadius: 10,
    },
    inputButtonText: {
        color: colors.text,
      fontSize: 24,
      textAlign: 'center',
    },
    cancelButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 75,
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    cancelButtonText: {
        color: colors.textOnPrimary,
        fontSize: 24,
        textAlign: 'center',
    },

//   Link Entry (InputSelector "From link" mode)
    linkEntry_container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 80,
      backgroundColor: colors.background,
    },
    linkEntry_title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
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
    linkEntry_backButton: {
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    linkEntry_backText: {
      color: colors.link,
      fontSize: 15,
    },

//   Landing Styles
    landing_container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 30,
    },
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
    landing_title: {
      fontSize: 48,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
      textAlign: 'center',
    },
    landing_subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },

//   Auth (Login / SignUp) Styles
    auth_container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 30,
      paddingTop: 100,
    },
    auth_backButton: {
      position: 'absolute',
      top: 60,
      left: 10,
      padding: 10,
      zIndex: 10,
    },
    auth_backIcon: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    auth_title: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 30,
      textAlign: 'center',
    },
    auth_input: {
      borderWidth: 1,
      borderColor: colors.borderInput,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 16,
      marginBottom: 12,
    },
    // Auth-specific button/link styles live in the Buttons block above:
    //   primary CTA  → [button_base, button_fullWidth, button_authPrimary]
    //                  + [buttonText_base, buttonText_onAuthPrimary]
    //   switch link  → [button_link] + [buttonText_authLink]

//   Privacy Policy Styles
    policy_container: {
      padding: 30,
      paddingTop: 100,
    },
    policy_title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    policy_updated: {
      color: colors.textMuted,
      marginBottom: 20,
    },
    policy_heading: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 6,
    },
    policy_body: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },

//   Settings Row Styles
    settings_email: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      color: colors.textTertiary,
    },
    settings_row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settings_rowText: {
      fontSize: 16,
      color: colors.textSecondary,
    },

//   Modal Styles
    modal_backdrop: {
      flex: 1,
      backgroundColor: colors.scrim,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    modal_card: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
    },
    modal_title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    modal_button: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    modal_buttonText: {
      fontSize: 16,
      color: '#333',
    },
});

export default styles;
