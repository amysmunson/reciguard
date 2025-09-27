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
    home_addButton: {
      position: 'absolute',
      top: 45, // leave space for status bar
      right: 10,
      backgroundColor: '#ffffffff',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
    },
    home_addButtonText: {
      color: '#333',
      fontSize: 24,
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
      padding: 20,
      backgroundColor: '#fff',
    },
    card_header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      paddingTop: 20,
    },
    card_backButton: {
      top: 50, // leave space for status bar
      // padding: 10,
      zIndex: 10,
      // backgroundColor: '#e0e0e0',
      borderRadius: 6,
      alignSelf: 'flex-start',   // aligns it to the left
      // marginTop: 10,
      // marginBottom: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      // backgroundColor: '#e0e0e0',
      // borderRadius: 4,
    },
    card_backButtonText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
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
      padding: 20,
      paddingTop: 80,
      backgroundColor: '#fff',
    },
    edit_header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
    },
    edit_backButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      padding: 10,
      zIndex: 10,
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
    deleteButton: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
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
