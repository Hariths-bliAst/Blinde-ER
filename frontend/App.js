/**
 * Blind-ER — Root Application Entrypoint (App.js)
 * Wires the complete Voice-First Accessibility Architecture:
 *   1. `OnboardingScreen` (Welcome Setup: Option A Low Vision WCAG AAA vs Option B Fully Blind Audio-First)
 *   2. `HomeScreen` (Top 60% Book Scanner Hero + Bottom 40% Grid: Auditory Games | More | Settings | Back to Setup)
 *   3. `BookScannerScreen` (Camera Viewfinder + Reader Overlay + 5-Button Control Bar)
 *   4. `MoreHubScreen` (Audiobook Library + Extensions: Ray-Ban Meta Smart Glasses & Be My Eyes)
 *   5. `AuditoryGamesScreen` (Pitch Training, Note Recognising, Chord Identifying, Audio Pattern Match)
 *   6. `SettingsScreen` (Volume Control, Tone & Pacing, Change Voice, Change Language, Check for Updates)
 *   7. `HardwareHubScreen` (Ray-Ban Meta Smart Glasses Live HUD + Be My Eyes Volunteer Bridge)
 */

import React, { useState } from 'react';
import OnboardingScreen from './src/ui/screens/OnboardingScreen';
import HomeScreen from './src/ui/screens/HomeScreen';
import BookScannerScreen from './src/ui/screens/BookScannerScreen';
import MoreHubScreen from './src/ui/screens/MoreHubScreen';
import AuditoryGamesScreen from './src/ui/screens/AuditoryGamesScreen';
import SettingsScreen from './src/ui/screens/SettingsScreen';
import HardwareHubScreen from './src/ui/screens/HardwareHubScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('Onboarding');
  const [visionMode, setVisionMode] = useState('LOW_VISION');

  const navigation = {
    navigate: (screenName, params) => {
      if (params?.visionMode) {
        setVisionMode(params.visionMode);
      }
      setActiveScreen(screenName);
    },
    goBack: () => {
      setActiveScreen('Home');
    },
  };

  if (activeScreen === 'Onboarding') {
    return (
      <OnboardingScreen
        navigation={navigation}
        onSelectMode={(mode) => setVisionMode(mode)}
      />
    );
  }

  if (activeScreen === 'Home') {
    return <HomeScreen navigation={navigation} visionMode={visionMode} />;
  }

  if (activeScreen === 'MoreHub') {
    return <MoreHubScreen navigation={navigation} visionMode={visionMode} />;
  }

  if (activeScreen === 'AuditoryGames') {
    return <AuditoryGamesScreen navigation={navigation} visionMode={visionMode} />;
  }

  if (activeScreen === 'Settings') {
    return <SettingsScreen navigation={navigation} visionMode={visionMode} />;
  }

  if (activeScreen === 'HardwareHub') {
    return <HardwareHubScreen navigation={navigation} visionMode={visionMode} />;
  }

  return <BookScannerScreen navigation={navigation} visionMode={visionMode} />;
}
