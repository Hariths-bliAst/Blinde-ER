/**
 * Blind-ER Screen 2: HomeScreen.js
 * Minimalist 60% / 40% Layout matching the Reference Design:
 *   - Top 60% Hero Element: Solid Yellow (#F5C518) "Book Scanner / AI Audiobook"
 *   - Bottom 40% Secondary 2x2 Grid:
 *       1. Auditory Games (Pitch, Notes, Chords, Audio Match)
 *       2. More (Audiobook Library + Extensions: Meta Glasses & Be My Eyes)
 *       3. Settings (Volume, Tone, Voice, Language, Check for Updates)
 *       4. Back to Setup (Returns to Visual Impairment Onboarding)
 */

import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

export default function HomeScreen({ navigation }) {
  useEffect(() => {
    speakAssistivePrompt(
      'Home Screen. Top 60 percent is Book Scanner. Bottom grid has Auditory Games, More Library and Extensions, Settings, and Back to Setup.'
    );
  }, []);

  const navigateWithVoice = (targetScreen, spokenMessage) => {
    speakAssistivePrompt(spokenMessage);
    if (navigation?.navigate) {
      navigation.navigate(targetScreen);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.screenContainer}>
        {/* Top 60%: Massive Solid Yellow Book Scanner Button */}
        <View style={styles.heroTop60}>
          <AccessibleTouchable
            label="Book Scanner, AI Audiobook"
            ttsHint="Primary AI tool. Scans physical book pages into expressive audiobooks. Tap again to open camera."
            onDoubleTap={() =>
              navigateWithVoice('BookScanner', 'Opening Book Scanner.')
            }
            style={styles.heroScannerButton}
          >
            <Text style={styles.heroLabel}>Book Scanner</Text>
            <Text style={styles.heroLabel}>AI Audiobook</Text>
            <Text style={styles.heroSubtext}>
              1st Tap: Hear • 2nd Tap: Open
            </Text>
          </AccessibleTouchable>
        </View>

        {/* Bottom 40%: 2x2 Grid of Secondary Features */}
        <View style={styles.secondaryBottom40}>
          <View style={styles.gridRow}>
            <AccessibleTouchable
              label="Auditory Games"
              ttsHint="Play Pitch Training, Note Recognising, Chord Identifying, and Audio Pattern Match. Tap again to open."
              onDoubleTap={() =>
                navigateWithVoice('AuditoryGames', 'Opening Auditory Games Suite.')
              }
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>Auditory</Text>
              <Text style={styles.secondaryTitle}>Games</Text>
              <Text style={styles.secondarySub}>Pitch • Chords • Notes</Text>
            </AccessibleTouchable>

            <AccessibleTouchable
              label="More Hub: Audiobook Library and Extensions"
              ttsHint="Open your saved Audiobook Library, Ray-Ban Meta Smart Glasses, and Be My Eyes extension. Tap again to open."
              onDoubleTap={() =>
                navigateWithVoice(
                  'MoreHub',
                  'Opening More Hub: Audiobook Library and Extensions.'
                )
              }
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>More</Text>
              <Text style={styles.secondaryTitle}>Library & Ext</Text>
              <Text style={styles.secondarySub}>Audiobooks • Glasses</Text>
            </AccessibleTouchable>
          </View>

          <View style={styles.gridRow}>
            <AccessibleTouchable
              label="Settings"
              ttsHint="Adjust Volume Control, Tone, Narrator Voice, Language, and Check for Updates. Tap again to open."
              onDoubleTap={() =>
                navigateWithVoice('Settings', 'Opening Settings.')
              }
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>Settings</Text>
              <Text style={styles.secondarySub}>Volume • Voice • Lang</Text>
            </AccessibleTouchable>

            <AccessibleTouchable
              label="Back to Setup"
              ttsHint="Return to the Welcome visual impairment setup screen. Tap again to open."
              onDoubleTap={() =>
                navigateWithVoice(
                  'Onboarding',
                  'Returning to Welcome Visual Setup.'
                )
              }
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>Back to</Text>
              <Text style={styles.secondaryTitle}>Setup</Text>
              <Text style={styles.secondarySub}>Vision Profile</Text>
            </AccessibleTouchable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenContainer: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  heroTop60: {
    flex: 6,
    width: '100%',
  },
  heroScannerButton: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 26,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#000000',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
    textAlign: 'center',
  },
  heroSubtext: {
    color: '#1A1A1C',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  secondaryBottom40: {
    flex: 4,
    width: '100%',
    gap: 14,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  secondaryTile: {
    flex: 1,
    height: '100%',
    backgroundColor: '#141416',
    borderWidth: 1.5,
    borderColor: '#26262A',
    borderRadius: 22,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 23,
    textAlign: 'center',
  },
  secondarySub: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
