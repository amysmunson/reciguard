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
});

export default styles;
