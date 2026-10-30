/**
 * Blind-ER Root Navigation Entrypoint (App.js)
 * Connects the 4 core accessible screens:
 *   1. OnboardingScreen (Voice-first visual impairment setup)
 *   2. HomeScreen (60% Hero Book Scanner + 40% Secondary Grid with Meta Glasses & Be My Eyes)
 *   3. BookScannerScreen (75% Hero Content + 25% 5-Button FeatureLayoutTemplate)
 *   4. HardwareHubScreen (Ray-Ban Meta Smart Glasses Live POV & Be My Eyes Extension Bridge)
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from './src/ui/screens/OnboardingScreen';
import HomeScreen from './src/ui/screens/HomeScreen';
import BookScannerScreen from './src/ui/screens/BookScannerScreen';
import HardwareHubScreen from './src/ui/screens/HardwareHubScreen';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('Onboarding');
  const [routeParams, setRouteParams] = useState({
    accessibilityMode: 'LOW_VISION',
  });

  const navigation = {
    navigate: (screenName, params = {}) => {
      setRouteParams((prev) => ({ ...prev, ...params }));
      setCurrentRoute(screenName);
    },
    goBack: () => {
      setCurrentRoute('Home');
    },
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      {currentRoute === 'Onboarding' && (
        <OnboardingScreen
          navigation={navigation}
          onSelectProfile={(mode) =>
            setRouteParams((prev) => ({ ...prev, accessibilityMode: mode }))
          }
        />
      )}
      {currentRoute === 'Home' && (
        <HomeScreen navigation={navigation} route={{ params: routeParams }} />
      )}
      {currentRoute === 'BookScanner' && (
        <BookScannerScreen
          navigation={navigation}
          route={{ params: routeParams }}
        />
      )}
      {currentRoute === 'HardwareHub' && (
        <HardwareHubScreen
          navigation={navigation}
          route={{ params: routeParams }}
        />
      )}
    </>
  );
}
