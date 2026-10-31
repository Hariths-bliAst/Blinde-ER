/**
 * Blind-ER Reusable Feature Wrapper: FeatureLayoutTemplate.js
 * Hardened 75% / 25% Spatial Safety Architecture:
 *   - Top/Middle Area (75% Hero Content): Wraps non-interactive background space
 *     with an ambient auditory boundary cue ("Navigation area: 4 buttons located along the bottom edge.").
 *   - Bottom Control Bar (25% Fixed): Edge-to-edge 4-button spatial grid (`gap: 0`,
 *     `padding: 0`, `flex: 1`, `height: '100%'`, `width: '100%'`) eliminating all dead zones.
 */

import React, { useState } from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from './AccessibleTouchable';

export const BOUNDARY_CUE_MESSAGE =
  'Navigation area: 4 buttons located along the bottom edge.';

export default function FeatureLayoutTemplate({
  featureTitle,
  onBack,
  primaryAction,
  secondaryAction,
  onNext,
  nextLabel = 'Next',
  nextHint = '',
  overflowActions = [],
  children,
}) {
  const [overflowIndex, setOverflowIndex] = useState(0);

  const handleBoundaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    speakAssistivePrompt(BOUNDARY_CUE_MESSAGE);
  };

  const handleMoreAuditoryMenu = () => {
    if (!overflowActions.length) return;
    const currentOverflow =
      overflowActions[overflowIndex % overflowActions.length];
    if (currentOverflow?.onExecute) {
      currentOverflow.onExecute();
    }
    setOverflowIndex((prev) => (prev + 1) % overflowActions.length);
  };

  const hasOverflow =
    Array.isArray(overflowActions) && overflowActions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* ================================================================= */}
      {/* TOP / MIDDLE AREA (75% HERO CONTENT + BOUNDARY SAFETY CUE)        */}
      {/* ================================================================= */}
      <Pressable
        testID="spatial-boundary-area"
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel="Non-interactive upper area"
        onPress={handleBoundaryPress}
        style={styles.heroContentArea}
      >
        {children}
      </Pressable>

      {/* ================================================================= */}
      {/* BOTTOM CONTROL BAR (25% FIXED, ZERO-GAP 4-BUTTON SPATIAL BAR)     */}
      {/* ================================================================= */}
      <View
        testID="bottom-control-bar"
        style={styles.bottomControlBar}
        accessible={true}
        accessibilityRole="menubar"
        accessibilityLabel={`${featureTitle || 'Feature'} Bottom Control Bar`}
      >
        {/* Button 1 (Far Left): Back */}
        <AccessibleTouchable
          testID="bar-btn-back"
          label="Back"
          ttsHint=""
          confirmSpeech="Back."
          onDoubleTap={onBack}
          style={[styles.barButton, styles.navButton]}
        >
          <Text style={styles.buttonIcon} accessible={false}>
            ←
          </Text>
          <Text style={styles.buttonLabelWhite}>Back</Text>
        </AccessibleTouchable>

        {/* Button 2 (Center Left): Primary Action */}
        <AccessibleTouchable
          testID="bar-btn-primary"
          label={primaryAction?.label || 'Capture'}
          ttsHint={primaryAction?.hint || ''}
          confirmSpeech={primaryAction?.confirmSpeech}
          onDoubleTap={primaryAction?.onDoubleTap}
          style={[styles.barButton, styles.primaryActionButton]}
        >
          <Text style={styles.buttonIconDark} accessible={false}>
            {primaryAction?.icon || '◎'}
          </Text>
          <Text style={styles.buttonLabelDark}>
            {primaryAction?.label || 'Capture'}
          </Text>
        </AccessibleTouchable>

        {/* Button 3 (Center Right): Secondary Action */}
        <AccessibleTouchable
          testID="bar-btn-secondary"
          label={secondaryAction?.label || 'Read'}
          ttsHint={secondaryAction?.hint || ''}
          confirmSpeech={secondaryAction?.confirmSpeech}
          onDoubleTap={secondaryAction?.onDoubleTap}
          style={[styles.barButton, styles.secondaryActionButton]}
        >
          <Text style={styles.buttonIcon} accessible={false}>
            {secondaryAction?.icon || '🔊'}
          </Text>
          <Text style={styles.buttonLabelYellow}>
            {secondaryAction?.label || 'Read'}
          </Text>
        </AccessibleTouchable>

        {/* Button 4 (Far Right): Next */}
        <AccessibleTouchable
          testID="bar-btn-next"
          label={nextLabel}
          ttsHint={nextHint}
          confirmSpeech="Next."
          onDoubleTap={onNext}
          style={[styles.barButton, styles.navButton]}
        >
          <Text style={styles.buttonIcon} accessible={false}>
            →
          </Text>
          <Text style={styles.buttonLabelWhite}>{nextLabel}</Text>
        </AccessibleTouchable>

        {hasOverflow && (
          <AccessibleTouchable
            testID="bar-btn-more"
            label="More"
            ttsHint=""
            onDoubleTap={handleMoreAuditoryMenu}
            style={[styles.barButton, styles.moreOverflowButton]}
          >
            <Text style={styles.buttonIcon} accessible={false}>
              •••
            </Text>
            <Text style={styles.buttonLabelYellow}>More</Text>
          </AccessibleTouchable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  heroContentArea: {
    flex: 7.5,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  bottomControlBar: {
    flex: 2.5,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 2,
    borderTopColor: '#FFD600',
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
  },
  barButton: {
    flex: 1,
    width: '100%',
    height: '100%',
    margin: 0,
    borderRadius: 0,
    borderWidth: 1,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#141416',
    borderColor: '#26262A',
  },
  primaryActionButton: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },
  secondaryActionButton: {
    backgroundColor: '#141416',
    borderColor: '#FFD600',
  },
  moreOverflowButton: {
    backgroundColor: '#1B1D20',
    borderColor: '#6086BD',
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonIconDark: {
    color: '#000000',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonLabelWhite: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonLabelDark: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonLabelYellow: {
    color: '#FFD600',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
