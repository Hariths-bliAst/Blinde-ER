/**
 * StatusBanner Component (MATTHEW'S COMPLETED UI DELIVERABLE)
 * Displays WCAG AAA high-contrast pipeline status, a 3-Step AI Pipeline
 * visual progress stepper (1. CRNN OCR -> 2. Gemini LLM -> 3. Native TTS),
 * and live TalkBack / VoiceOver announcements.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { PIPELINE_STATE_COLORS } from '../theme/theme';
import { styles } from './StatusBanner.styles';

const PIPELINE_STEPS = [
  { id: 1, label: '1. CRNN OCR' },
  { id: 2, label: '2. GEMINI AI' },
  { id: 3, label: '3. TTS AUDIO' },
];

export default function StatusBanner({
  status,
  statusMessage,
  targetLanguage,
  palette,
}) {
  const stateConfig =
    PIPELINE_STATE_COLORS[status] || PIPELINE_STATE_COLORS.IDLE;
  const activeBorderColor = palette?.borderPrimary || stateConfig.borderColor;
  const activeBrandColor = palette?.primaryAccent || '#FFD600';

  return (
    <View
      style={[styles.bannerContainer, { borderColor: activeBorderColor }]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`Blind-ER Status: ${stateConfig.shortLabel}. ${statusMessage}. Active output language: ${targetLanguage}.`}
    >
      <View style={styles.bannerHeaderRow}>
        <View style={styles.brandRow}>
          <View
            style={[
              styles.highContrastDot,
              { backgroundColor: activeBrandColor },
            ]}
          />
          <Text style={[styles.appBrandText, { color: activeBrandColor }]}>
            BLIND-ER
          </Text>
        </View>

        <View
          style={styles.languagePill}
          accessible={true}
          accessibilityLabel={`Selected language ${targetLanguage}. Long press anywhere to switch language.`}
        >
          <Text style={styles.languagePillText}>
            🌐 {targetLanguage.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.stateBadgePill,
          { backgroundColor: stateConfig.badgeBg },
        ]}
      >
        <Text
          style={[styles.stateBadgeText, { color: stateConfig.badgeText }]}
        >
          {stateConfig.shortLabel}
        </Text>
      </View>

      <Text style={styles.statusMessageText}>{statusMessage}</Text>

      {/* 3-Step AI Pipeline Progress Stepper */}
      <View
        style={styles.pipelineStepperRow}
        accessible={true}
        accessibilityLabel={`AI Pipeline Progress: Step ${stateConfig.stepIndex} of 3 active.`}
      >
        {PIPELINE_STEPS.map((step) => {
          const isCurrent = stateConfig.stepIndex === step.id;
          const isCompleted = stateConfig.stepIndex > step.id;
          return (
            <View
              key={step.id}
              style={[
                styles.pipelineStepPill,
                isCompleted && styles.pipelineStepPillDone,
                isCurrent && styles.pipelineStepPillActive,
              ]}
            >
              <Text
                style={[
                  styles.pipelineStepText,
                  isCompleted && styles.pipelineStepTextDone,
                  isCurrent && styles.pipelineStepTextActive,
                ]}
              >
                {isCompleted ? `✓ ${step.label}` : step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
