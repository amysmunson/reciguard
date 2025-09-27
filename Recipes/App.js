import React, { useEffect , useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './components/HomeScreen';
import RecipeCard from './components/RecipeCard';
import EditRecipe from './components/EditRecipe';
import InputSelector from './components/InputSelector';
import Settings from './components/Settings';
import { createTables, seedDatabase, deleteDatabase } from './database/db';

export default function App() {
  const Stack = createStackNavigator();
  const userId = "1234"; // TODO: Replace with real auth later

  const [dbReady, setDbReady] = useState(false); 


  useEffect(() => {
  const initDB = async () => {
    try {
      await deleteDatabase();
      console.log("🔹 Initializing DB...");
      await createTables();
      
      await seedDatabase(userId); // test user
      setDbReady(true); 
      console.log("✅ DB ready");
    } catch (err) {
      console.log("❌ DB init error:", err);
    }
  };
    initDB();
  }, []);

  if (!dbReady) {
    // Simple loading screen
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Loading"
            component={() => <></>}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }



  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} initialParams={{ userId }} options={{ headerShown: false, animation: 'none'  }} />
        <Stack.Screen name="RecipeCard" component={RecipeCard} initialParams={{ userId }} options={{ headerShown: false }}/>
        <Stack.Screen name="EditRecipe" component={EditRecipe} initialParams={{ userId }} options={{ headerShown: false }}/>
        <Stack.Screen name="InputSelector" component={InputSelector} initialParams={{ userId }} options={{ headerShown: false }}/>
        <Stack.Screen name="Settings" component={Settings} initialParams={{ userId }} options={{ headerShown: false, animation: 'none' }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
