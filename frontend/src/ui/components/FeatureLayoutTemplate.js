/**
 * Blind-ER Reusable Feature Wrapper: FeatureLayoutTemplate.js
 * Implements the standard 75% / 25% UI/UX Architecture for all core features:
 *   - Top/Middle Area (75% Hero Content): Dynamic feature area (Camera + Large Text).
 *   - Bottom Control Bar (25% Fixed): Edge-to-edge Flexbox row of massive
 *     `AccessibleTouchable` buttons.
 *   - Button Layout Logic:
 *       1. Far Left: "Back" (Returns to previous screen)
 *       2. Center Left: Contextual Action 1 (e.g., "Capture")
 *       3. Center Right: Contextual Action 2 (e.g., "Read" / "Stop")
 *       4. Far Right: "Next" (Moves to next step or page)
 *   - Overflow Rule: If `overflowActions` has items (>2 center actions needed),
 *     renders a 5th button labeled "More" that triggers an auditory menu.
 *     Never exceeds 5 buttons in the bottom bar.
 */

import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from './AccessibleTouchable';

export default function FeatureLayoutTemplate({
  featureTitle,
  onBack,
  primaryAction, // { label: 'Capture', hint: '...', onDoubleTap: fn, active?: bool }
  secondaryAction, // { label: 'Read' | 'Stop', hint: '...', onDoubleTap: fn }
  onNext,
  nextLabel = 'Next',
  nextHint = 'Double tap to move to the next page.',
  overflowActions = [], // Optional array of extra actions -> triggers 5th "More" button
  children,
}) {
  const [overflowIndex, setOverflowIndex] = useState(0);

  const handleMoreAuditoryMenu = () => {
    if (!overflowActions.length) return;
    const currentOverflow = overflowActions[overflowIndex % overflowActions.length];
    if (currentOverflow?.onExecute) {
      currentOverflow.onExecute();
    }
    setOverflowIndex((prev) => (prev + 1) % overflowActions.length);
  };

  const hasOverflow = Array.isArray(overflowActions) && overflowActions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* ================================================================= */}
      {/* TOP / MIDDLE AREA (75% HERO CONTENT)                              */}
      {/* ================================================================= */}
      <View style={styles.heroContentArea}>{children}</View>

      {/* ================================================================= */}
      {/* BOTTOM CONTROL BAR (25% FIXED, MASSIVE FLEXBOX BUTTONS, MAX 5)    */}
      {/* ================================================================= */}
      <View
        style={styles.bottomControlBar}
        accessible={true}
        accessibilityRole="menubar"
        accessibilityLabel={`${featureTitle || 'Feature'} Bottom Control Bar`}
      >
        {/* Button 1 (Far Left): Back / Before */}
        <AccessibleTouchable
          label="Back"
          ttsHint="Double tap to return to the previous screen."
          confirmSpeech="Going back."
          onDoubleTap={onBack}
          style={[styles.barButton, styles.navButton]}
        >
          <Text style={styles.buttonIcon} accessible={false}>
            ←
          </Text>
          <Text style={styles.buttonLabelWhite}>Back</Text>
        </AccessibleTouchable>

        {/* Button 2 (Center Left): Contextual Action 1 (e.g. Capture) */}
        <AccessibleTouchable
          label={primaryAction?.label || 'Action 1'}
          ttsHint={
            primaryAction?.hint || 'Double tap to trigger primary feature action.'
          }
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

        {/* Button 3 (Center Right): Contextual Action 2 (e.g. Read / Stop) */}
        <AccessibleTouchable
          label={secondaryAction?.label || 'Action 2'}
          ttsHint={
            secondaryAction?.hint ||
            'Double tap to trigger secondary feature action.'
          }
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

        {/* Button 4: Next */}
        <AccessibleTouchable
          label={nextLabel}
          ttsHint={nextHint}
          confirmSpeech="Moving to next page."
          onDoubleTap={onNext}
          style={[styles.barButton, styles.navButton]}
        >
          <Text style={styles.buttonIcon} accessible={false}>
            →
          </Text>
          <Text style={styles.buttonLabelWhite}>{nextLabel}</Text>
        </AccessibleTouchable>

        {/* Button 5 (Dynamic Overflow Rule — Never Exceeds 5 Buttons) */}
        {hasOverflow && (
          <AccessibleTouchable
            label="More Options"
            ttsHint={`Auditory menu for additional settings such as ${overflowActions
              .map((a) => a.label)
              .join(', ')}. Double tap to cycle option.`}
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
    flex: 7.5, // Top 75% of screen
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  bottomControlBar: {
    flex: 2.5, // Bottom 25% of screen
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 3,
    borderTopColor: '#FFD600',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
  },
  barButton: {
    flex: 1, // Massive Flexbox hitboxes filling the entire bottom bar evenly
    height: '100%',
    borderRadius: 8,
    borderWidth: 3,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#1D1D1F',
    borderColor: '#FFFFFF',
  },
  primaryActionButton: {
    backgroundColor: '#FFD600',
    borderColor: '#FFFFFF',
  },
  secondaryActionButton: {
    backgroundColor: '#1D1D1F',
    borderColor: '#FFD600',
  },
  moreOverflowButton: {
    backgroundColor: '#1B1D20',
    borderColor: '#6086BD',
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 6,
  },
  buttonIconDark: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 6,
  },
  buttonLabelWhite: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonLabelDark: {
    color: '#000000',
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonLabelYellow: {
    color: '#FFD600',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
