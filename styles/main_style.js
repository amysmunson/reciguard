import { StyleSheet, Dimensions } from 'react-native';

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
      backgroundColor: '#fff',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 20,
    },
    listItem: {
      width: itemSize,
      height: itemSize,    // force square shape
      margin: itemMargin / 2,
      backgroundColor: '#f4f4f4',
      borderRadius: 5,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
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
      backgroundColor: '#ffffffff',
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    home_searchIcon: {
      color: '#333',
      fontSize: 20,
      fontWeight: 'bold',
    },
    bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    },
    navButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 5,
    },
    navButtonText: {
        fontSize: 10,
        color: '#333',
        textAlign: 'center',
    },
    navButtonIcon: {
        fontSize: 24,
        color: '#333',
    },
    navButtonIconActive: {
        color: '#0066cc',
    },
    navButtonTextActive: {
        color: '#0066cc',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
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
      backgroundColor: '#fff',
    },
    card_header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      paddingTop: 60,
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
      color: '#333',
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
      color: '#333',
    },
    // Placeholders
    ingredientItems: {
      fontSize: 16,
      marginVertical: 5,
      color: '#333',
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
      backgroundColor: '#fff',
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
      borderBottomColor: '#eee',
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
      color: '#333',
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
      borderColor: '#ccc',
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
       color: '#900',
    },
    noItemsText: {
      fontStyle: 'italic',
      color: '#888',
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
      color: '#0066cc',
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
      backgroundColor: '#fff',
      justifyContent: 'center',
    },
    inputButton: {
        backgroundColor: '#aecbe7ff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: ((screenHeight - 200) / 4),
        margin: 10,
        padding: 20,
        borderRadius: 10,
    },
    inputButtonText: {
        color: '#000000ff',
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
        backgroundColor: '#0e264dff',
    },
    cancelButtonText: {
        color: '#ffffffff',
        fontSize: 24,
        textAlign: 'center',
    },

//   Landing Styles
    landing_container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    landing_title: {
      fontSize: 48,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#0e264dff',
    },
    landing_subtitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 60,
    },
    landing_primaryButton: {
      width: '100%',
      backgroundColor: '#0e264dff',
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 12,
    },
    landing_primaryButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    landing_secondaryButton: {
      width: '100%',
      backgroundColor: '#f4f4f4',
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 24,
    },
    landing_secondaryButtonText: {
      color: '#0e264dff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    landing_link: {
      padding: 8,
    },
    landing_linkText: {
      color: '#666',
      fontSize: 14,
      textDecorationLine: 'underline',
    },

//   Auth (Login / SignUp) Styles
    auth_container: {
      flex: 1,
      backgroundColor: '#fff',
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
      color: '#333',
    },
    auth_title: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 30,
      textAlign: 'center',
    },
    auth_input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 16,
      marginBottom: 12,
    },
    auth_primaryButton: {
      backgroundColor: '#0e264dff',
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    auth_primaryButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    auth_link: {
      color: '#0066cc',
      textAlign: 'center',
      paddingVertical: 8,
    },

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
      color: '#888',
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
      color: '#333',
    },

//   Settings Row Styles
    settings_email: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      color: '#666',
    },
    settings_row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    settings_rowText: {
      fontSize: 16,
      color: '#333',
    },

//   Modal Styles
    modal_backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    modal_card: {
      width: '100%',
      backgroundColor: '#fff',
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

//   Home Search Bar (replaces top icons when search is active)
    searchBar: {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 20,
      elevation: 20,
    },
    searchBar_input: {
      flex: 1,
      fontSize: 16,
      color: colors.textSecondary,
      paddingVertical: 6,
    },
    searchBar_cancel: {
      fontSize: 16,
      color: colors.link,
      marginLeft: 12,
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

//   Friend Code Card (on Profile screen)
    friendCode_card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 10,
      marginBottom: 10,
      alignItems: 'center',
    },
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
      backgroundColor: colors.link,
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

//   Friend Code Input (for entering someone else's)
    codeInput: {
      textAlign: 'center',
      letterSpacing: 4,
      fontSize: 20,
      fontFamily: 'Courier',
    },

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

//   Link Status Row (on FriendProfile when linked)
    linkStatus_row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySubtle,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
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

//   "Link to Real Account" Button (on FriendProfile when not linked)
    linkAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.link,
      borderRadius: 8,
      paddingVertical: 12,
      marginBottom: 8,
    },
    linkAccountButton_text: {
      color: colors.link,
      fontWeight: 'bold',
      marginLeft: 8,
    },

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

//   Bottom destructive "Remove Friend" button on FriendProfile
    removeFriendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 12,
      marginTop: 20,
    },
    removeFriendButton_text: {
      color: colors.danger,
      fontWeight: 'bold',
      marginLeft: 8,
    },

//   Read-Only Display Blocks (linked friend's public notes)
    readOnlyBlock: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 4,
    },
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
