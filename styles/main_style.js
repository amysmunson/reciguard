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
      color: '#333',
    },
});

export default styles;
