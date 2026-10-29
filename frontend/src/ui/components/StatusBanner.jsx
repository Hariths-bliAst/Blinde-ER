/**
 * StatusBanner Component (MATTHEW'S UI WORKSPACE)
 * Displays high-contrast pipeline status and announces live state transitions
 * to TalkBack / VoiceOver via `accessibilityLiveRegion="assertive"`.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './StatusBanner.styles';

export default function StatusBanner({ status, statusMessage, targetLanguage }) {
  const isError = status === 'ERROR';

  return (
    <View
      style={styles.bannerContainer}
      accessible={true}
      accessibilityRole="header"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`Status: ${status}. ${statusMessage}. Language: ${targetLanguage}`}
    >
      <View style={styles.bannerHeaderRow}>
        <Text style={styles.appBrandText}>BLIND-ER</Text>
        <View style={styles.languagePill}>
          <Text style={styles.languagePillText}>{targetLanguage}</Text>
        </View>
      </View>

      <Text style={[styles.statusBadgeText, isError && styles.statusBadgeError]}>
        STATE: {status}
      </Text>
      <Text style={styles.statusMessageText}>{statusMessage}</Text>
    </View>
  );
}

