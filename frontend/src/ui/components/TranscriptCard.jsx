/**
 * TranscriptCard Component (MATTHEW'S UI WORKSPACE)
 * Displays the LLM-refined audiobook narration in extra-large, high-contrast
 * typography for partially sighted users.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from './TranscriptCard.styles';

export default function TranscriptCard({ narratedText, targetLanguage }) {
  return (
    <View
      style={styles.cardContainer}
      accessible={true}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        narratedText
          ? `Audiobook narration in ${targetLanguage}: ${narratedText}`
          : 'No book page scanned yet. Tap anywhere on the screen to scan a page.'
      }
    >
      <Text style={styles.sectionHeading}>
        AUDIOBOOK NARRATION ({targetLanguage.toUpperCase()})
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {narratedText ? (
          <Text style={styles.narratedBodyText}>{narratedText}</Text>
        ) : (
          <Text style={styles.placeholderText}>
            Point your phone camera at any physical book page and tap anywhere
            on the screen. Blind-ER will extract the text, repair formatting,
            and narrate it aloud with natural emotion.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

