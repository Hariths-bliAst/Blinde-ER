/**
 * Blind-ER Screen 1: OnboardingScreen.js
 * Matches the Apple-Minimalist Voice-First Reference Design:
 *   - Centered "Welcome to Blind-ER" + "Let's set up your experience. This tutorial will guide you."
 *   - Option A: Solid Yellow (#F5C518) rounded card -> "Option A / Low Vision / WCAG AAA"
 *   - Option B: Matte Dark (#141416) rounded card -> "Option B / Fully Blind / Audio-First"
 *   - Bottom Footer: "Audio tutorial is playing..." + Waveform Visualizer
 */

import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

const ONBOARDING_PROMPT =
  'Welcome to Blind-ER. Let us set up your experience. Tap any item once to hear what it is. Tap it a second time to select it. Choose Option A for Low Vision, or Option B for Fully Blind Audio-First.';

export default function OnboardingScreen({ navigation, onSelectMode }) {
  const [statusCaption, setStatusCaption] = useState(
    'Audio tutorial is playing...'
  );

  useEffect(() => {
    speakAssistivePrompt(ONBOARDING_PROMPT, {
      onDone: () => setStatusCaption('Tap once to hear • Tap again to select'),
    });
  }, []);

  const handleSelectProfile = (modeKey, spokenConfirmation) => {
    setStatusCaption(spokenConfirmation);
    if (onSelectMode) {
      onSelectMode(modeKey);
    }
    speakAssistivePrompt(spokenConfirmation, {
      onDone: () => {
        if (navigation?.navigate) {
          navigation.navigate('Home', { visionMode: modeKey });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.container}>
        {/* Top Centered Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleText}>Welcome to Blind-ER</Text>
          <Text style={styles.subtitleText}>
            Let’s set up your experience.{'\n'}This tutorial will guide you.
          </Text>
        </View>

        {/* Center Rounded Option Cards */}
        <View style={styles.optionsList}>
          <AccessibleTouchable
            label="Option A: Low Vision, W C A G Triple A"
            ttsHint="High contrast yellow on black with oversized text. Tap again to select."
            onDoubleTap={() =>
              handleSelectProfile(
                'LOW_VISION',
                'Option A: Low Vision mode active. Opening Home Screen.'
              )
            }
            style={styles.optionACard}
          >
            <Text style={styles.optionALine}>Option A</Text>
            <Text style={styles.optionALine}>Low Vision</Text>
            <Text style={styles.optionALine}>WCAG AAA</Text>
          </AccessibleTouchable>

          <AccessibleTouchable
            label="Option B: Fully Blind, Audio-First"
            ttsHint="Complete voice guidance and maximum touch targets. Tap again to select."
            onDoubleTap={() =>
              handleSelectProfile(
                'FULLY_BLIND',
                'Option B: Fully Blind Audio-First mode active. Opening Home Screen.'
              )
            }
            style={styles.optionBCard}
          >
            <Text style={styles.optionBLine}>Option B</Text>
            <Text style={styles.optionBLine}>Fully Blind</Text>
            <Text style={styles.optionBLine}>Audio-First</Text>
          </AccessibleTouchable>
        </View>

        {/* Bottom Audio Tutorial Footer + Waveform */}
        <View style={styles.audioFooter}>
          <Text style={styles.audioCaption}>{statusCaption}</Text>
          <View style={styles.waveformRow}>
            {[6, 12, 18, 9, 20, 14, 8, 22, 15, 10, 19, 12, 7, 16, 11, 6].map(
              (h, idx) => (
                <View key={idx} style={[styles.waveBar, { height: h }]} />
              )
            )}
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
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#D1D1D6',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  optionsList: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    gap: 22,
    paddingVertical: 16,
  },
  optionACard: {
    flex: 1,
    maxHeight: 220,
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 26,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBCard: {
    flex: 1,
    maxHeight: 220,
    width: '100%',
    backgroundColor: '#141416',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#26262A',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionALine: {
    color: '#000000',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
  },
  optionBLine: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
  },
  audioFooter: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 6,
  },
  audioCaption: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#8E8E93',
    borderRadius: 99,
  },
});
