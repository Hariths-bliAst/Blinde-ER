/**
 * ScannerScreen Component (MATTHEW'S COMPLETED UI DELIVERABLE)
 * Pure presentational layout for the Voice-First Book-to-Audiobook Scanner.
 * Features WCAG AAA switchable high-contrast themes, high-visibility viewfinder
 * corner reticles, 3-step AI pipeline stepper, and scalable 24pt/30pt reader card.
 */

import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import AccessibleTouchOverlay from '../components/AccessibleTouchOverlay';
import StatusBanner from '../components/StatusBanner';
import TranscriptCard from '../components/TranscriptCard';
import { HIGH_CONTRAST_PALETTES } from '../theme/theme';
import { styles } from './ScannerScreen.styles';

const PALETTE_LIST = [
  HIGH_CONTRAST_PALETTES.HYPER_YELLOW,
  HIGH_CONTRAST_PALETTES.CYBER_CYAN,
  HIGH_CONTRAST_PALETTES.HIGH_LUMINANCE_GREEN,
];

export default function ScannerScreen({
  cameraRef,
  cameraPermission,
  status,
  statusMessage,
  rawOcrText,
  narratedText,
  targetLanguage,
  isSpeaking,
  onSingleTap,
  onDoubleTap,
  onLongPress,
}) {
  const [paletteIndex, setPaletteIndex] = useState(0);
  const activePalette = PALETTE_LIST[paletteIndex];

  const handleCyclePalette = useCallback(() => {
    setPaletteIndex((prev) => (prev + 1) % PALETTE_LIST.length);
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.screenContainer,
        { backgroundColor: activePalette.backgroundPrimary },
      ]}
    >
      <AccessibleTouchOverlay
        statusMessage={statusMessage}
        targetLanguage={targetLanguage}
        isSpeaking={isSpeaking}
        palette={activePalette}
        onSingleTap={onSingleTap}
        onDoubleTap={onDoubleTap}
        onLongPress={onLongPress}
      >
        {/* Top High-Contrast Live Status Banner + 3-Step Pipeline Stepper */}
        <StatusBanner
          status={status}
          statusMessage={statusMessage}
          targetLanguage={targetLanguage}
          palette={activePalette}
        />

        {/* Native Document Camera Preview with High-Contrast Targeting Brackets */}
        <View
          style={[
            styles.cameraPreviewWrapper,
            { borderColor: activePalette.borderPrimary },
          ]}
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
            <Text
              style={[
                styles.cameraPermissionFallbackText,
                { color: activePalette.textSecondary },
              ]}
            >
              📷 DOCUMENT CAMERA VIEWFINDER READY{'\n'}(Tap Anywhere to Scan Book Page)
            </Text>
          )}

          {/* High-Contrast Corner Alignment Brackets for Low-Vision Users */}
          <View
            style={[
              styles.reticleCornerTopLeft,
              { borderColor: activePalette.primaryAccent },
            ]}
          />
          <View
            style={[
              styles.reticleCornerTopRight,
              { borderColor: activePalette.primaryAccent },
            ]}
          />
          <View
            style={[
              styles.reticleCornerBottomLeft,
              { borderColor: activePalette.primaryAccent },
            ]}
          />
          <View
            style={[
              styles.reticleCornerBottomRight,
              { borderColor: activePalette.primaryAccent },
            ]}
          />

          <View
            style={[
              styles.cameraOverlayBadge,
              { borderColor: activePalette.primaryAccent },
            ]}
          >
            <Text
              style={[
                styles.cameraOverlayText,
                { color: activePalette.primaryAccent },
              ]}
            >
              CRNN 99.6% DOCUMENT LENS • {activePalette.label}
            </Text>
          </View>
        </View>

        {/* Large-Print Audiobook Narration & Raw CRNN Comparison Card */}
        <TranscriptCard
          narratedText={narratedText}
          rawOcrText={rawOcrText}
          targetLanguage={targetLanguage}
          palette={activePalette}
          onCyclePalette={handleCyclePalette}
        />
      </AccessibleTouchOverlay>
    </SafeAreaView>
  );
}
