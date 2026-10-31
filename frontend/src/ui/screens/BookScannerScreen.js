/**
 * Blind-ER Screen 3: BookScannerScreen.js
 * Hardened Book-to-Audio Scanner Screen:
 *   - Top 75% Hero Content: Camera Viewfinder + High-Contrast Reader Overlay.
 *   - Bottom 25% Spatial Bar: 4 full-bleed buttons (Back, Capture, Read/Pause/Resume, Next).
 *   - Supports true sentence-level Pause & Resume so pausing never restarts from the beginning.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable from '../components/AccessibleTouchable';
import {
  useScannerController,
  CAMERA_PERMISSION_DENIED_MESSAGE,
} from '../../logic/useScannerController';

export default function BookScannerScreen({ navigation }) {
  const {
    cameraRef,
    cameraPermission,
    status,
    statusMessage,
    narratedText,
    targetLanguage,
    isSpeaking,
    isPaused,
    confirmStartReading,
    cancelReading,
    resumeCurrent,
    replayLastSentence,
    restartFromBeginning,
    onSingleTap,
    onDoubleTap,
  } = useScannerController();

  const isPermissionDenied =
    cameraPermission && cameraPermission.granted === false;

  const isConfirming = status === 'AWAITING_CONFIRMATION';
  const isPausedMenu = status === 'PAUSED_MENU';

  const secondaryLabel = isSpeaking ? 'Pause' : isPaused ? 'Resume' : 'Read';
  const secondaryIcon = isSpeaking ? '⏸' : '▶';
  const secondaryHint = isSpeaking
    ? 'Double tap to pause.'
    : isPaused
      ? 'Double tap to resume reading.'
      : 'Double tap to read aloud.';

  let primaryAction = {
    label: 'Capture',
    icon: '◎',
    hint: 'Double tap to scan page.',
    confirmSpeech: 'Scanning.',
    onDoubleTap: onSingleTap,
  };

  let secondaryAction = {
    label: secondaryLabel,
    icon: secondaryIcon,
    hint: secondaryHint,
    onDoubleTap: onDoubleTap,
  };

  let nextLabel = 'Next';
  let nextHint = 'Double tap for next page.';
  let onNext = onSingleTap;

  if (isConfirming) {
    primaryAction = {
      label: 'Read',
      icon: '▶',
      hint: 'Double tap to start reading.',
      confirmSpeech: 'Reading.',
      onDoubleTap: confirmStartReading,
    };
    secondaryAction = {
      label: 'Cancel',
      icon: '✕',
      hint: 'Double tap to cancel reading.',
      confirmSpeech: 'Cancelled.',
      onDoubleTap: cancelReading,
    };
    nextLabel = 'Read';
    nextHint = 'Double tap to start reading.';
    onNext = confirmStartReading;
  } else if (isPausedMenu) {
    primaryAction = {
      label: 'Resume',
      icon: '▶',
      hint: 'Double tap to resume from current position.',
      confirmSpeech: 'Resuming.',
      onDoubleTap: resumeCurrent,
    };
    secondaryAction = {
      label: 'Replay',
      icon: '↺',
      hint: 'Double tap to reread last sentence.',
      confirmSpeech: 'Replaying.',
      onDoubleTap: replayLastSentence,
    };
    nextLabel = 'Restart';
    nextHint = 'Double tap to restart page from beginning.';
    onNext = restartFromBeginning;
  }

  return (
    <FeatureLayoutTemplate
      featureTitle="Book Scanner"
      onBack={() =>
        isConfirming
          ? cancelReading()
          : navigation?.goBack
            ? navigation.goBack()
            : navigation?.navigate?.('Home')
      }
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      nextLabel={nextLabel}
      nextHint={nextHint}
      onNext={onNext}
    >
      <View style={styles.heroWrapper}>
        {/* Camera Viewfinder */}
        <AccessibleTouchable
          testID="camera-viewfinder"
          label={
            isPermissionDenied
              ? CAMERA_PERMISSION_DENIED_MESSAGE
              : `Camera Viewfinder. ${statusMessage}`
          }
          ttsHint="Double tap to scan page."
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
                {isPermissionDenied
                  ? 'SYSTEM SETTINGS REQUIRED'
                  : `LENS • ${targetLanguage.toUpperCase()}`}
              </Text>
              <Text
                testID="camera-status-text"
                style={styles.cameraStatusText}
              >
                {isPermissionDenied
                  ? CAMERA_PERMISSION_DENIED_MESSAGE
                  : statusMessage}
              </Text>
            </View>
          )}
        </AccessibleTouchable>

        {/* High-Contrast Reader Card */}
        <View style={styles.textOverlayCard}>
          <View style={styles.overlayHeaderRow}>
            <Text style={styles.overlayLabel}>
              VOICE READER ({targetLanguage.toUpperCase()})
            </Text>
            <Text testID="scanner-state-pill" style={styles.statePill}>
              {status}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text testID="narrated-reader-text" style={styles.largeReaderText}>
              {narratedText || 'Point camera at a page and double-tap Capture.'}
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
    gap: 14,
  },
  cameraContainer: {
    flex: 4.2,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 2,
    borderColor: '#FFD600',
    borderRadius: 22,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginBottom: 8,
  },
  cameraStatusText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  textOverlayCard: {
    flex: 5.8,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 1.5,
    borderColor: '#26262A',
    borderRadius: 22,
    padding: 18,
  },
  overlayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overlayLabel: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statePill: {
    color: '#000000',
    backgroundColor: '#FFD600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
  },
  largeReaderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
  },
});
