/**
 * Blind-ER Screen 2: HomeScreen.js
 * Minimalist, color-blocked Apple-inspired Home Screen:
 *   - Top 60% Hero Element: Massive single "Book Scanner" button.
 *     One tap: "Book Scanner. Double tap to open camera."
 *     Double tap: Navigates to BookScannerScreen.
 *   - Bottom 40% Secondary Grid: 2x2 grid of massive hitboxes ("Auditory Games",
 *     "Smart Home IoT", "Saved Library", "Settings").
 */

import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

export default function HomeScreen({ navigation, route }) {
  const accessibilityMode = route?.params?.accessibilityMode || 'LOW_VISION';

  useEffect(() => {
    speakAssistivePrompt(
      'Home Screen. Top sixty percent is Book Scanner. Bottom forty percent contains Auditory Games, Smart Home I O T, Saved Library, and Settings. Tap once to hear any button, double tap to open.'
    );
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      {/* ================================================================= */}
      {/* TOP 60%: MASSIVE HERO ELEMENT ("Book Scanner")                    */}
      {/* ================================================================= */}
      <View style={styles.heroSection}>
        <AccessibleTouchable
          label="Book Scanner"
          ttsHint="Double tap to open camera."
          confirmSpeech="Opening Book Scanner."
          onDoubleTap={() =>
            navigation?.navigate &&
            navigation.navigate('BookScanner', { accessibilityMode })
          }
          style={styles.heroButton}
        >
          <Text style={styles.heroEyebrow}>PRIMARY AI TOOL • 60% ZONE</Text>
          <Text style={styles.heroIcon} accessible={false}>
            📖
          </Text>
          <Text style={styles.heroTitle}>Book Scanner</Text>
          <Text style={styles.heroSub}>
            1 Tap: Hear Label • 2 Taps: Open Camera
          </Text>
        </AccessibleTouchable>
      </View>

      {/* ================================================================= */}
      {/* BOTTOM 40%: SPACIOUS 2x2 SECONDARY FEATURE GRID                   */}
      {/* ================================================================= */}
      <View style={styles.secondarySection}>
        <View style={styles.gridRow}>
          <AccessibleTouchable
            label="Auditory Games"
            ttsHint="Pitch training and spatial echolocation exercises. Double tap to open."
            confirmSpeech="Opening Auditory Games."
            onDoubleTap={() =>
              speakAssistivePrompt('Auditory Pitch Training Game ready.')
            }
            style={styles.secondaryTile}
          >
            <Text style={styles.tileIcon} accessible={false}>
              🎯
            </Text>
            <Text style={styles.tileTitle}>Auditory Games</Text>
          </AccessibleTouchable>

          <AccessibleTouchable
            label="Smart Home Cameras"
            ttsHint="Check kitchen stove and room object finder. Double tap to open."
            confirmSpeech="Checking Smart Home IoT Cameras."
            onDoubleTap={() =>
              speakAssistivePrompt(
                'Smart Home Status: Living room clear. Keys are at 10 o clock on the dining table.'
              )
            }
            style={styles.secondaryTile}
          >
            <Text style={styles.tileIcon} accessible={false}>
              🏠
            </Text>
            <Text style={styles.tileTitle}>Smart Home</Text>
          </AccessibleTouchable>
        </View>

        <View style={styles.gridRow}>
          <AccessibleTouchable
            label="Saved Library"
            ttsHint="Listen to previously scanned book chapters. Double tap to open."
            confirmSpeech="Opening Saved Audiobook Library."
            onDoubleTap={() =>
              speakAssistivePrompt(
                'Saved Library: Chapter Four, The Silent Lighthouse.'
              )
            }
            style={styles.secondaryTile}
          >
            <Text style={styles.tileIcon} accessible={false}>
              📚
            </Text>
            <Text style={styles.tileTitle}>Library</Text>
          </AccessibleTouchable>

          <AccessibleTouchable
            label="Accessibility Settings"
            ttsHint="Return to visual impairment profile setup. Double tap to open."
            confirmSpeech="Returning to Accessibility Setup."
            onDoubleTap={() =>
              navigation?.navigate && navigation.navigate('Onboarding')
            }
            style={styles.secondaryTile}
          >
            <Text style={styles.tileIcon} accessible={false}>
              ⚙️
            </Text>
            <Text style={styles.tileTitle}>Settings</Text>
          </AccessibleTouchable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    gap: 20,
  },
  heroSection: {
    flex: 6, // Top 60% of the screen
    width: '100%',
  },
  heroButton: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFD600', // High-Contrast Safety Yellow on Pure Black
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEyebrow: {
    color: '#1D1D1F',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  heroIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#000000',
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSub: {
    color: '#1D1D1F',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondarySection: {
    flex: 4, // Bottom 40% of the screen
    width: '100%',
    gap: 16,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  secondaryTile: {
    flex: 1,
    backgroundColor: '#1D1D1F', // Apple Dark Primary Surface
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#F5F5F7',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
});
