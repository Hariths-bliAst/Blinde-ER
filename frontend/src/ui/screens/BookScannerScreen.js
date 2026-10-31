/**
 * Blind-ER Screen 3: BookScannerScreen.js
 * Specific implementation of the "Book-to-Audio" scanner built on top of
 * `FeatureLayoutTemplate.js` and `AccessibleTouchable.js`.
 *
 * - Top 75% Hero Content: Native CameraView + High-Contrast Large Text Overlay.
 * - Bottom 25% Control Bar:
 *     1. Back (Returns to HomeScreen)
 *     2. Capture (Snaps photo -> Custom PyTorch CRNN -> Gemini 3 Flash -> TTS)
 *     3. Stop / Read (Pauses or replays audiobook narration)
 *     4. Next (Advances to the next book page)
 *     5. More (Overflow auditory menu to switch translation language)
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable from '../components/AccessibleTouchable';
import { useScannerController } from '../../logic/useScannerController';

export default function BookScannerScreen({ navigation }) {
  const {
    cameraRef,
    cameraPermission,
    status,
    statusMessage,
    narratedText,
    targetLanguage,
    isSpeaking,
    onSingleTap,
    onDoubleTap,
    onLongPress,
  } = useScannerController();

  return (
    <FeatureLayoutTemplate
      featureTitle="Book to Audio Scanner"
      onBack={() =>
        navigation?.goBack ? navigation.goBack() : navigation?.navigate?.('Home')
      }
      primaryAction={{
        label: 'Capture',
        icon: '📸',
        hint: 'Double tap to capture book page and run AI narration.',
        confirmSpeech: 'Capturing book page.',
        onDoubleTap: onSingleTap,
      }}
      secondaryAction={{
        label: isSpeaking ? 'Stop' : 'Read',
        icon: isSpeaking ? '⏹' : '🔊',
        hint: isSpeaking
          ? 'Double tap to stop audio playback.'
          : 'Double tap to read the scanned page aloud.',
        onDoubleTap: onDoubleTap,
      }}
      nextLabel="Next"
      nextHint="Double tap to scan the next page."
      onNext={onSingleTap}
      overflowActions={[
        {
          label: `Switch Language (Current: ${targetLanguage})`,
          onExecute: onLongPress,
        },
      ]}
    >
      {/* ================================================================= */}
      {/* TOP 75% HERO AREA: CAMERA VIEWFINDER + LARGE TEXT OVERLAY         */}
      {/* ================================================================= */}
      <View style={styles.heroWrapper}>
        {/* Camera Viewfinder */}
        <AccessibleTouchable
          label={`Camera Viewfinder. Status: ${status}. ${statusMessage}`}
          ttsHint="Double tap to capture this book page."
          onDoubleTap={onSingleTap}
          style={styles.cameraContainer}
        >
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraFeed}
              facing="back"
              autofocus="on"
            />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraBadge}>
                CAMERA LENS • {targetLanguage.toUpperCase()}
              </Text>
              <Text style={styles.cameraStatusText}>{statusMessage}</Text>
            </View>
          )}
        </AccessibleTouchable>

        {/* Large High-Contrast Audiobook Text Display Overlay */}
        <View style={styles.textOverlayCard}>
          <View style={styles.overlayHeaderRow}>
            <Text style={styles.overlayLabel}>
              AUDIOBOOK OUTPUT ({targetLanguage.toUpperCase()})
            </Text>
            <Text style={styles.statePill}>{status}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.largeReaderText}>
              {narratedText ||
                'Point camera at a book page and double-tap "Capture" in the bottom bar. Tap any button once to hear its name.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </FeatureLayoutTemplate>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    flex: 1,
    gap: 16,
  },
  cameraContainer: {
    flex: 4.2,
    width: '100%',
    backgroundColor: '#1D1D1F',
    borderWidth: 3,
    borderColor: '#FFD600',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFeed: {
    flex: 1,
    width: '100%',
  },
  cameraFallback: {
    padding: 20,
    alignItems: 'center',
  },
  cameraBadge: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  cameraStatusText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  textOverlayCard: {
    flex: 5.8,
    width: '100%',
    backgroundColor: '#1D1D1F',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    padding: 20,
  },
  overlayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overlayLabel: {
    color: '#FFD600',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.9,
  },
  statePill: {
    color: '#000000',
    backgroundColor: '#FFD600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
  largeReaderText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 36,
  },
});

