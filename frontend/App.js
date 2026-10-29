/**
 * Blind-ER Root Navigation Entrypoint (App.js)
 * Connects the 3 core accessible screens:
 *   1. OnboardingScreen (Voice-first visual impairment setup)
 *   2. HomeScreen (60% Hero Book Scanner + 40% Secondary Grid)
 *   3. BookScannerScreen (75% Hero Content + 25% 4-to-5 Button FeatureLayoutTemplate)
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from './src/ui/screens/OnboardingScreen';
import HomeScreen from './src/ui/screens/HomeScreen';
import BookScannerScreen from './src/ui/screens/BookScannerScreen';

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
    </>
  );
}
