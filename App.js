import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './lib/auth-context';
import { useCacheWarmup } from './lib/useCacheWarmup';
import { ThemeProvider, useTheme } from './lib/theme-context';
import { colors } from './styles/theme';
import DialogHost from './components/DialogHost';
import StatusBarBackdrop from './components/StatusBarBackdrop';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Landing from './screens/Landing';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import PrivacyPolicy from './screens/PrivacyPolicy';
import TermsOfService from './screens/TermsOfService';
import ForgotPassword from './screens/ForgotPassword';

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
import EditAllergies from './screens/EditAllergies';
import AllergyOverview from './screens/AllergyOverview';
import Accessibility from './screens/Accessibility';
import SharingWith from './screens/SharingWith';
import BlockedUsers from './screens/BlockedUsers';
import Feedback from './screens/Feedback';

// Native stack (platform UINavigationController / Fragment transitions via
// react-native-screens). Replaced @react-navigation/stack, whose JS card
// animations call the deprecated InteractionManager on every transition.
const Stack = createNativeStackNavigator();

// Nav-bar (tab) screens: switching tabs pushes them onto the stack, but they
// should behave like tabs — no slide animation and no swipe-back to the
// previous tab. Screens opened from them (a folder, recipe, profile) keep
// swipe-back, so a folder swipes back to Folders.
const TAB_SCREEN_OPTIONS = { animation: 'none', gestureEnabled: false };

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={Landing} />
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="SignUp" component={SignUp} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
    <Stack.Screen name="TermsOfService" component={TermsOfService} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
  </Stack.Navigator>
);

const AppStack = () => {
  // Quietly refresh other screens' caches in the background on launch/sign-in.
  const { user } = useAuth();
  useCacheWarmup(user);

  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} options={TAB_SCREEN_OPTIONS} />
      <Stack.Screen name="RecipeCard" component={RecipeCard} />
      {/* No swipe-back while editing: the ≡ drag handles sit at the left
          edge, where the swipe gesture starts. Back button / Android back
          still work and still ask before discarding unsaved changes. */}
      <Stack.Screen name="EditRecipe" component={EditRecipe} options={{ gestureEnabled: false }} />
      <Stack.Screen name="InputSelector" component={InputSelector} />
      <Stack.Screen name="Folders" component={Folders} options={TAB_SCREEN_OPTIONS} />
      <Stack.Screen name="FolderDetail" component={FolderDetail} />
      <Stack.Screen name="Friends" component={Friends} options={TAB_SCREEN_OPTIONS} />
      <Stack.Screen name="FriendProfile" component={FriendProfile} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="EditAllergies" component={EditAllergies} />
      <Stack.Screen name="AllergyOverview" component={AllergyOverview} />
      <Stack.Screen name="SharingWith" component={SharingWith} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsers} />
      <Stack.Screen name="Settings" component={Settings} options={TAB_SCREEN_OPTIONS} />
      <Stack.Screen name="Accessibility" component={Accessibility} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name="TermsOfService" component={TermsOfService} />
      <Stack.Screen name="Feedback" component={Feedback} />
    </Stack.Navigator>
  );
};

// Last navigation state, so a theme switch (which remounts the navigator,
// see lib/theme-context.js) puts the user back on the same screen. A module
// variable rather than a ref: it's only read when the container mounts.
// Tagged with the auth state so a signed-out remount never restores
// signed-in screens.
let lastNavState = { signedIn: false, state: undefined };

const RootNavigator = () => {
  const { session, loading } = useAuth();
  const { scheme } = useTheme();
  // Current route name — the status-bar backdrop is hidden on Landing.
  const [routeName, setRouteName] = useState(null);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer
        key={scheme}
        theme={navTheme}
        initialState={lastNavState.signedIn === !!session ? lastNavState.state : undefined}
        onStateChange={(state) => {
          lastNavState = { signedIn: !!session, state };
          setRouteName(state?.routes?.[state.index]?.name ?? null);
        }}
      >
        {session ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
      {/* Solid strip behind the clock/battery so scrolled content never
          overlaps them. Not on Landing (its photo runs under the status bar);
          with no session and no route yet, Landing is the first screen. */}
      {(routeName ?? (session ? 'Home' : 'Landing')) !== 'Landing' && <StatusBarBackdrop />}
      {/* Root host for appAlert() dialogs (lib/dialog.js); in-app modals
          add their own via AppModal. */}
      <DialogHost />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
