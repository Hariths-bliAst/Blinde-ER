/**
 * Blind-ER Screen 1: OnboardingScreen.js
 * Minimalist Apple-inspired high-contrast audio onboarding screen.
 * Auto-plays welcome instructions via Native TTS, then presents two massive
 * full-width profile selection blocks using `AccessibleTouchable`.
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

const INTRO_SPEECH =
  'Welcome to Blind-ER. This app uses a custom voice interface. Tap any item once to hear what it is. Double-tap to select it.';

const PROMPT_SPEECH =
  'Please select your level of visual impairment to optimize your experience. Top option: Partially Blind or Low Vision. Bottom option: Fully Blind.';

export default function OnboardingScreen({ navigation, onSelectProfile }) {
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Auto-play voice introduction on launch, then announce the selection prompt
    speakAssistivePrompt(INTRO_SPEECH, {
      onDone: () => {
        setIntroFinished(true);
        speakAssistivePrompt(PROMPT_SPEECH);
      },
    });
  }, []);

  const handleChooseMode = (modeKey, modeAnnouncement) => {
    if (onSelectProfile) {
      onSelectProfile(modeKey);
    }
    speakAssistivePrompt(
      `${modeAnnouncement} selected. Navigating to Home Screen.`,
      {
        onDone: () => {
          if (navigation?.navigate) {
            navigation.navigate('Home', { accessibilityMode: modeKey });
          }
        },
      }
    );
    // Navigate immediately while audio confirms transition
    if (navigation?.navigate) {
      navigation.navigate('Home', { accessibilityMode: modeKey });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Minimalist Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrowText}>BLIND-ER • VOICE-FIRST SETUP</Text>
        <Text style={styles.headlineText}>
          Select your visual experience level.
        </Text>
        <Text style={styles.subheadText}>
          {introFinished
            ? 'Tap once to hear an option. Double-tap to confirm.'
            : 'Playing audio introduction... Tap once on any option below.'}
        </Text>
      </View>

      {/* Full-Screen Vertical Option Stack */}
      <View style={styles.optionsContainer}>
        {/* Option A: Partially Blind / Low Vision */}
        <AccessibleTouchable
          label="Option A: Partially Blind or Low Vision"
          ttsHint="Sets interface to high contrast yellow on black with extra large text. Double tap to select."
          onDoubleTap={() =>
            handleChooseMode('LOW_VISION', 'Partially Blind / Low Vision mode')
          }
          style={[styles.optionCard, styles.optionCardHighContrast]}
        >
          <Text style={styles.optionTagYellow}>OPTION A • HIGH CONTRAST</Text>
          <Text style={styles.optionTitleYellow}>
            Partially Blind /{'\n'}Low Vision
          </Text>
          <Text style={styles.optionDescLight}>
            High-contrast color blocking & oversized typography
          </Text>
        </AccessibleTouchable>

        {/* Option B: Fully Blind */}
        <AccessibleTouchable
          label="Option B: Fully Blind"
          ttsHint="Optimizes interface for complete audio guidance and maximum edge to edge touch targets. Double tap to select."
          onDoubleTap={() =>
            handleChooseMode('FULLY_BLIND', 'Fully Blind audio-first mode')
          }
          style={[styles.optionCard, styles.optionCardSurface]}
        >
          <Text style={styles.optionTagWhite}>OPTION B • AUDIO-FIRST</Text>
          <Text style={styles.optionTitleWhite}>Fully Blind</Text>
          <Text style={styles.optionDescMuted}>
            Full voiceover navigation & maximum touch zones
          </Text>
        </AccessibleTouchable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000', // Apple Dark Surface
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerBlock: {
    paddingBottom: 20,
  },
  eyebrowText: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  headlineText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 42,
    marginBottom: 8,
  },
  subheadText: {
    color: '#9EA0A2',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    gap: 20,
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 11,
    borderWidth: 3,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  optionCardHighContrast: {
    backgroundColor: '#1D1D1F',
    borderColor: '#FFD600',
  },
  optionCardSurface: {
    backgroundColor: '#1B1D20',
    borderColor: '#FFFFFF',
  },
  optionTagYellow: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  optionTitleYellow: {
    color: '#FFD600',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 38,
    marginBottom: 10,
  },
  optionDescLight: {
    color: '#F5F5F7',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  optionTagWhite: {
    color: '#6086BD',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  optionTitleWhite: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '600',
    lineHeight: 40,
    marginBottom: 10,
  },
  optionDescMuted: {
    color: '#F5F5F7',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
});
