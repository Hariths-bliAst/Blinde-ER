/**
 * Blind-ER Screen 1: OnboardingScreen.js
 * Clean AI Voice Assistant Onboarding:
 *   - Concise voice prompt ("Welcome to Blind-ER. Tap once to hear, double tap to select.")
 *   - Option A: Low Vision (High Contrast)
 *   - Option B: Audio First (Full Voice)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

export const ONBOARDING_PROMPT =
  'Welcome to Blind-ER. Tap once to hear, double tap to select.';

export default function OnboardingScreen({ navigation, onSelectMode }) {
  const [statusCaption, setStatusCaption] = useState('AI Assistant Ready');

  useEffect(() => {
    speakAssistivePrompt(ONBOARDING_PROMPT, {
      onDone: () => setStatusCaption('Tap once to hear • Double tap to select'),
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
        {/* Top Centered Header + AI Orb Indicator */}
        <View style={styles.headerBlock}>
          <View style={styles.aiOrbOuter}>
            <View style={styles.aiOrbInner} />
          </View>
          <Text style={styles.titleText}>Blind-ER</Text>
          <Text style={styles.subtitleText}>
            Select your voice assistant profile
          </Text>
        </View>

        {/* Center Rounded Option Cards */}
        <View style={styles.optionsList}>
          <AccessibleTouchable
            testID="onboarding-option-a"
            label="Option A: Low Vision"
            ttsHint="Double tap to select."
            onDoubleTap={() =>
              handleSelectProfile('LOW_VISION', 'Low Vision active.')
            }
            style={styles.optionACard}
          >
            <Text style={styles.optionALine}>Option A</Text>
            <Text style={styles.optionALine}>Low Vision</Text>
            <Text style={styles.optionASub}>High Contrast</Text>
          </AccessibleTouchable>

          <AccessibleTouchable
            testID="onboarding-option-b"
            label="Option B: Audio First"
            ttsHint="Double tap to select."
            onDoubleTap={() =>
              handleSelectProfile('FULLY_BLIND', 'Audio First active.')
            }
            style={styles.optionBCard}
          >
            <Text style={styles.optionBLine}>Option B</Text>
            <Text style={styles.optionBLine}>Audio First</Text>
            <Text style={styles.optionBSub}>Full Voice</Text>
          </AccessibleTouchable>
        </View>

        {/* Bottom AI Voice Footer + Waveform */}
        <View style={styles.audioFooter}>
          <Text testID="onboarding-status-caption" style={styles.audioCaption}>
            {statusCaption}
          </Text>
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
  aiOrbOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 197, 24, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiOrbInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F5C518',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#D1D1D6',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  optionsList: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 14,
  },
  optionACard: {
    flex: 1,
    maxHeight: 215,
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 26,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBCard: {
    flex: 1,
    maxHeight: 215,
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
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    textAlign: 'center',
  },
  optionASub: {
    color: '#141416',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  optionBLine: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    textAlign: 'center',
  },
  optionBSub: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  audioFooter: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 6,
  },
  audioCaption: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#F5C518',
    borderRadius: 99,
  },
});
