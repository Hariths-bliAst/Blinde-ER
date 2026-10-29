/**
 * TranscriptCard Component (MATTHEW'S COMPLETED UI DELIVERABLE)
 * Displays the LLM-refined audiobook narration in scalable WCAG AAA
 * high-contrast typography (24pt / 30pt XL), alongside an optional
 * "Before vs. After AI" Raw CRNN OCR inspection panel.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { styles } from './TranscriptCard.styles';

export default function TranscriptCard({
  narratedText,
  rawOcrText,
  targetLanguage,
  palette,
  onCyclePalette,
}) {
  const [isExtraLargeFont, setIsExtraLargeFont] = useState(false);
  const [showRawComparison, setShowRawComparison] = useState(true);

  const accentColor = palette?.secondaryAccent || '#00E5FF';
  const primaryColor = palette?.primaryAccent || '#FFD600';

  return (
    <View
      style={[styles.cardContainer, { borderColor: accentColor }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        narratedText
          ? `Audiobook narration in ${targetLanguage}: ${narratedText}`
          : 'No book page scanned yet. Single tap anywhere on the screen to scan a page.'
      }
    >
      {/* Low-Vision High-Contrast Controls Header */}
      <View style={styles.headerToolbarRow}>
        <Text style={[styles.sectionHeading, { color: accentColor }]}>
          🎧 AI NARRATION ({targetLanguage.toUpperCase()})
        </Text>

        <View style={styles.toolbarButtonsRow}>
          <Pressable
            onPress={() => setIsExtraLargeFont((prev) => !prev)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isExtraLargeFont
                ? 'Switch to standard large 24 point font'
                : 'Switch to extra large 30 point font for low vision'
            }
            style={[
              styles.accessibilityTogglePill,
              { borderColor: primaryColor },
            ]}
          >
            <Text
              style={[styles.accessibilityToggleText, { color: primaryColor }]}
            >
              {isExtraLargeFont ? 'FONT: 30PT XL' : 'FONT: 24PT'}
            </Text>
          </Pressable>

          {onCyclePalette && (
            <Pressable
              onPress={onCyclePalette}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Switch high contrast color theme. Current theme: ${palette?.label || 'Yellow on Black'}`}
              style={[
                styles.accessibilityTogglePill,
                { borderColor: primaryColor },
              ]}
            >
              <Text
                style={[
                  styles.accessibilityToggleText,
                  { color: primaryColor },
                ]}
              >
                🎨 CONTRAST
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {narratedText ? (
          <>
            <Text
              style={[
                styles.narratedBodyText,
                isExtraLargeFont && styles.narratedBodyTextExtraLarge,
                { color: palette?.textPrimary || '#FFFFFF' },
              ]}
            >
              {narratedText}
            </Text>

            {rawOcrText && showRawComparison ? (
              <Pressable
                onPress={() => setShowRawComparison((prev) => !prev)}
                style={styles.rawOcrComparisonBox}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Stage 1 Raw CRNN OCR extracted text before Gemini repair: ${rawOcrText}`}
              >
                <Text style={[styles.rawOcrLabel, { color: primaryColor }]}>
                  STAGE 1 RAW CRNN OCR (BEFORE GEMINI AI REPAIR):
                </Text>
                <Text
                  style={[
                    styles.rawOcrBodyText,
                    { color: palette?.textSecondary || '#FFF59D' },
                  ]}
                >
                  {rawOcrText}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text
            style={[
              styles.placeholderText,
              isExtraLargeFont && styles.narratedBodyTextExtraLarge,
              { color: palette?.textSecondary || '#FFF59D' },
            ]}
          >
            Point your phone camera at any physical book page and tap anywhere
            on the screen. Blind-ER will extract the raw text via CRNN, repair
            and translate it with Gemini 3 Flash, and speak it aloud.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
