/**
 * Blind-ER Screen 2: HomeScreen.js
 * Minimalist Layout with Book Scanner, Gemini Camera AI Mode, and AI Voice Mode:
 *   - Hero 1: Book Scanner (Turn pages into audiobooks)
 *   - Hero 2: Camera AI ("What is in front of me?" powered by Gemini Vision)
 *   - Bottom 2x2 Grid: AI Voice Mode | Library & More | Auditory Games | Settings
 */

import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useMicrophonePermissions } from 'expo-camera';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';
import { sendVoiceCommandToGemini } from '../../api/scannerApi';

export default function HomeScreen({ navigation }) {
  const [aiVoiceActive, setAiVoiceActive] = useState(false);
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    speakAssistivePrompt('Home.');
  }, []);

  const navigateWithVoice = (targetScreen, spokenMessage) => {
    speakAssistivePrompt(spokenMessage);
    if (navigation?.navigate) {
      navigation.navigate(targetScreen);
    }
  };

  const toggleAiVoiceMode = async () => {
    if (!aiVoiceActive) {
      // Prompt for native microphone permission on mobile if not already granted
      if (!micPermission?.granted) {
        const permResult = await requestMicPermission();
        if (!permResult?.granted) {
          speakAssistivePrompt(
            'Microphone permission is required for AI Voice Mode. Please enable microphone access in settings.'
          );
          return;
        }
      }
      setAiVoiceActive(true);
      speakAssistivePrompt(
        'AI Voice Mode active. Say open camera, scan book, library, or settings.'
      );
      try {
        await sendVoiceCommandToGemini('help', 'home', 'English');
      } catch {
        // Offline voice command fallback
      }
    } else {
      setAiVoiceActive(false);
      speakAssistivePrompt('AI Voice Mode off.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.screenContainer}>
        {/* Primary Hero: Book Scanner */}
        <View style={styles.heroScannerBox}>
          <AccessibleTouchable
            testID="home-book-scanner-btn"
            label="Book Scanner"
            ttsHint="Double tap to open."
            onDoubleTap={() =>
              navigateWithVoice('BookScanner', 'Book Scanner.')
            }
            style={styles.heroScannerButton}
          >
            <Text style={styles.heroLabel}>Book Scanner</Text>
            <Text style={styles.heroSubtext}>Turn pages into audiobooks</Text>
          </AccessibleTouchable>
        </View>

        {/* Secondary Hero: Gemini Camera AI ("What is in front of me?") */}
        <View style={styles.cameraAiBox}>
          <AccessibleTouchable
            testID="home-camera-ai-btn"
            label="Camera AI: What is in front of me"
            ttsHint="Double tap to describe surroundings."
            onDoubleTap={() =>
              navigateWithVoice('CameraAssistant', 'Camera AI.')
            }
            style={styles.cameraAiButton}
          >
            <View style={styles.cameraOrb} />
            <View>
              <Text style={styles.cameraAiTitle}>Camera AI</Text>
              <Text style={styles.cameraAiSub}>What is in front of me?</Text>
            </View>
          </AccessibleTouchable>
        </View>

        {/* Bottom 2x2 Grid: AI Voice Mode | Library | Games | Settings */}
        <View style={styles.secondaryBottomGrid}>
          <View style={styles.gridRow}>
            <AccessibleTouchable
              testID="home-ai-voice-btn"
              label={`AI Voice Mode: ${aiVoiceActive ? 'Listening' : 'Off'}`}
              ttsHint="Double tap to toggle voice navigation."
              onDoubleTap={toggleAiVoiceMode}
              style={[
                styles.secondaryTile,
                aiVoiceActive && styles.aiActiveTile,
              ]}
            >
              <Text style={styles.secondaryTitle}>AI Voice</Text>
              <Text style={styles.secondarySub}>
                {aiVoiceActive ? 'Listening • On' : 'Tap to Speak'}
              </Text>
            </AccessibleTouchable>

            <AccessibleTouchable
              testID="home-library-btn"
              label="Library and More"
              ttsHint="Double tap to open."
              onDoubleTap={() => navigateWithVoice('MoreHub', 'Library.')}
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>Library</Text>
              <Text style={styles.secondarySub}>Books • Wearables</Text>
            </AccessibleTouchable>
          </View>

          <View style={styles.gridRow}>
            <AccessibleTouchable
              testID="home-games-btn"
              label="Auditory Games"
              ttsHint="Double tap to open."
              onDoubleTap={() =>
                navigateWithVoice('AuditoryGames', 'Auditory Games.')
              }
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>Games</Text>
              <Text style={styles.secondarySub}>Pitch • Chords</Text>
            </AccessibleTouchable>

            <AccessibleTouchable
              testID="home-settings-btn"
              label="Settings"
              ttsHint="Double tap to open."
              onDoubleTap={() => navigateWithVoice('Settings', 'Settings.')}
              style={styles.secondaryTile}
            >
              <Text style={styles.secondaryTitle}>Settings</Text>
              <Text style={styles.secondarySub}>Voice • Language</Text>
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
    padding: 18,
    gap: 14,
  },
  heroScannerBox: {
    flex: 3.6,
    width: '100%',
  },
  heroScannerButton: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 26,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'center',
  },
  heroSubtext: {
    color: '#1A1A1C',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  cameraAiBox: {
    flex: 1.8,
    width: '100%',
  },
  cameraAiButton: {
    flex: 1,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 2,
    borderColor: '#B26BFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cameraOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#B26BFF',
    borderWidth: 4,
    borderColor: '#F5C518',
  },
  cameraAiTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  cameraAiSub: {
    color: '#D1D1D6',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  secondaryBottomGrid: {
    flex: 3.4,
    width: '100%',
    gap: 12,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryTile: {
    flex: 1,
    height: '100%',
    backgroundColor: '#141416',
    borderWidth: 1.5,
    borderColor: '#26262A',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiActiveTile: {
    borderColor: '#B26BFF',
    backgroundColor: '#1E162B',
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
