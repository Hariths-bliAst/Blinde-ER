/**
 * ScannerScreen Component (MATTHEW'S UI WORKSPACE)
 * Pure presentational layout for the Voice-First Book-to-Audiobook Scanner.
 * Receives all state and gesture handlers via props from `useScannerController`.
 */

import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import AccessibleTouchOverlay from '../components/AccessibleTouchOverlay';
import StatusBanner from '../components/StatusBanner';
import TranscriptCard from '../components/TranscriptCard';
import { styles } from './ScannerScreen.styles';

export default function ScannerScreen({
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
}) {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <AccessibleTouchOverlay
        statusMessage={statusMessage}
        targetLanguage={targetLanguage}
        isSpeaking={isSpeaking}
        onSingleTap={onSingleTap}
        onDoubleTap={onDoubleTap}
        onLongPress={onLongPress}
      >
        {/* Top High-Contrast Live Status Banner */}
        <StatusBanner
          status={status}
          statusMessage={statusMessage}
          targetLanguage={targetLanguage}
        />

        {/* Native Document Camera Preview */}
        <View
          style={styles.cameraPreviewWrapper}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="Document scanner camera viewfinder. Point at a book page and single tap anywhere to capture."
        >
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing="back"
              autofocus="on"
            />
          ) : (
            <Text style={styles.cameraPermissionFallbackText}>
              Camera Viewfinder Ready (Demo / Emulator Mode Active)
            </Text>
          )}
          <View style={styles.cameraOverlayBadge}>
            <Text style={styles.cameraOverlayText}>DOCUMENT SCANNER LENS</Text>
          </View>
        </View>

        {/* Large-Print Audiobook Narration Reader Card */}
        <TranscriptCard
          narratedText={narratedText}
          targetLanguage={targetLanguage}
        />
      </AccessibleTouchOverlay>
    </SafeAreaView>
  );
}

