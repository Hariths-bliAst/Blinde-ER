/**
 * Blind-ER — Root Application Entrypoint (App.js)
 * Wires the complete Voice-First Accessibility Architecture:
 *   1. `OnboardingScreen` (Welcome Setup: Low Vision vs Audio-First)
 *   2. `HomeScreen` (Book Scanner + Camera AI + AI Voice Mode + Library + Games + Settings)
 *   3. `BookScannerScreen` (Camera Viewfinder + Reader Overlay + True Pause/Resume)
 *   4. `CameraAssistantScreen` (Gemini Vision Camera AI: "What is in front of me?")
 *   5. `MoreHubScreen` (Audiobook Library with True Pause/Resume + Smart Wearables)
 *   6. `AuditoryGamesScreen` (Pitch Training, Note Recognising, Chord Identifying, Audio Pattern Match)
 *   7. `SettingsScreen` (Volume Control, Tone & Pacing, Change Voice, Change Language, Updates)
 *   8. `HardwareHubScreen` (Ray-Ban Meta Smart Glasses + Be My Eyes Bridge)
 */

import React, { useState } from 'react';
import OnboardingScreen from './src/ui/screens/OnboardingScreen';
import HomeScreen from './src/ui/screens/HomeScreen';
import BookScannerScreen from './src/ui/screens/BookScannerScreen';
import CameraAssistantScreen from './src/ui/screens/CameraAssistantScreen';
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

  if (activeScreen === 'CameraAssistant') {
    return (
      <CameraAssistantScreen navigation={navigation} visionMode={visionMode} />
    );
  }

  if (activeScreen === 'MoreHub') {
    return <MoreHubScreen navigation={navigation} visionMode={visionMode} />;
  }

  if (activeScreen === 'AuditoryGames') {
    return (
      <AuditoryGamesScreen navigation={navigation} visionMode={visionMode} />
    );
  }

  if (activeScreen === 'Settings') {
    return <SettingsScreen navigation={navigation} visionMode={visionMode} />;
  }

  if (activeScreen === 'HardwareHub') {
    return (
      <HardwareHubScreen navigation={navigation} visionMode={visionMode} />
    );
  }

  return <BookScannerScreen navigation={navigation} visionMode={visionMode} />;
}
