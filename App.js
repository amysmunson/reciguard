import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from './lib/auth-context';

import Landing from './screens/Landing';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import PrivacyPolicy from './screens/PrivacyPolicy';

import Home from './screens/Home';
import RecipeCard from './screens/RecipeCard';
import EditRecipe from './screens/EditRecipe';
import InputSelector from './screens/InputSelector';
import Settings from './screens/Settings';
import Folders from './screens/Folders';
import FolderDetail from './screens/FolderDetail';
import Friends from './screens/Friends';
import FriendProfile from './screens/FriendProfile';
import Profile from './screens/Profile';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={Landing} />
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="SignUp" component={SignUp} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={Home} options={{ animation: 'none' }} />
    <Stack.Screen name="RecipeCard" component={RecipeCard} />
    <Stack.Screen name="EditRecipe" component={EditRecipe} />
    <Stack.Screen name="InputSelector" component={InputSelector} />
    <Stack.Screen name="Folders" component={Folders} options={{ animation: 'none' }} />
    <Stack.Screen name="FolderDetail" component={FolderDetail} />
    <Stack.Screen name="Friends" component={Friends} options={{ animation: 'none' }} />
    <Stack.Screen name="FriendProfile" component={FriendProfile} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="Settings" component={Settings} options={{ animation: 'none' }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
