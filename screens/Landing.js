import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import styles from '../styles/main_style';
import LandingCard from '../components/LandingCard';
import colors from '../styles/theme';


const Landing = ({ navigation }) => (
  <ImageBackground
    source={require('../assets/images/watermelon.webp')}
    style={styles.landing_container}
    resizeMode="cover"
  >
    <View style={styles.landing_overlay} />

    {/* Title block — vertically centered in the upper area */}
    <View style={styles.landing_titleArea}>
      <LandingCard width={300}>
        <Text style={styles.landing_title}>RecipeGuard</Text>
        <Text style={styles.landing_subtitle}>Your shared recipe book.</Text>
      </LandingCard>
    </View>

    {/* Action stack — pinned to the bottom */}
    <View style={styles.landing_actions}>
      <TouchableOpacity
        style={[styles.button_base, styles.button_fullWidth, styles.button_primary]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={[styles.buttonText_base, styles.buttonText_onPrimary]}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button_base, styles.button_fullWidth, styles.button_secondary]}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={[styles.buttonText_base, styles.buttonText_onSecondary]}>Create Account</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>
);

export default Landing;
