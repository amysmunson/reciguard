import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import styles from '../styles/main_style';
import LandingCard from '../components/LandingCard';
import { colors } from '../styles/theme';


const Landing = ({ navigation }) => (
  <ImageBackground
    source={require('../assets/images/cookie-variety.webp')}
    style={[styles.screen_base, styles.screen_landingPad]}
    resizeMode="cover"
  >
    {/* <View style={styles.landing_overlay} /> */}
    <View />

    {/* Title block — vertically centered in the upper area */}
    <View style={styles.landing_titleArea}>
      <LandingCard width={360} height={210}>
        <Text style={[styles.header_landing, { color: colors.textOnPrimary }]}>ReciGuard</Text>
        <Text style={[styles.text_body, styles.text_centered, { color: colors.textOnPrimary }]}>
          Your recipe book.
        </Text>
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
