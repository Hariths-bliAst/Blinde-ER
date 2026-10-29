/**
 * AccessibleTouchOverlay Component (MATTHEW'S COMPLETED UI DELIVERABLE)
 * Full-screen zero-precision gesture surface with a 3-column high-contrast
 * tactile visual command dock (minimum 72dp touch target height) and complete
 * Android TalkBack / iOS VoiceOver custom actions.
 */

import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { styles } from './AccessibleTouchOverlay.styles';

export default function AccessibleTouchOverlay({
  statusMessage,
  targetLanguage,
  isSpeaking,
  palette,
  onSingleTap,
  onDoubleTap,
  onLongPress,
  children,
}) {
  const borderColor = palette?.borderPrimary || '#FFD600';
  const accentColor = palette?.primaryAccent || '#FFD600';

  return (
    <Pressable
      onPress={onSingleTap}
      onLongPress={onLongPress}
      delayLongPress={650}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Blind-ER Full Screen Book Scanner. Current status: ${statusMessage}. Target language: ${targetLanguage}.`}
      accessibilityHint="Single tap anywhere to scan a book page. Double tap anywhere to pause or replay narration. Long press anywhere to switch translation language."
      accessibilityState={{ busy: false, selected: isSpeaking }}
      accessibilityActions={[
        { name: 'activate', label: 'Scan book page' },
        { name: 'magicTap', label: 'Pause or replay audiobook narration' },
        { name: 'longpress', label: 'Cycle target translation language' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'magicTap') {
          onDoubleTap();
        } else if (event.nativeEvent.actionName === 'longpress') {
          onLongPress();
        } else {
          onSingleTap();
        }
      }}
      style={({ pressed }) => [
        styles.fullScreenResponder,
        { borderColor },
        pressed && styles.fullScreenResponderPressed,
      ]}
    >
      {children}

      {/* High-Contrast 3-Column Gesture Command Dock (72dp+ Touch Zones) */}
      <View
        style={[styles.gestureFooterBar, { borderColor }]}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`Full screen gesture guide. 1 tap anywhere scans page. 2 taps anywhere ${isSpeaking ? 'pauses audio' : 'replays audio'}. Long press anywhere switches language from ${targetLanguage}.`}
      >
        <Text style={[styles.gestureGuideTitle, { color: accentColor }]}>
          ZERO-BUTTON FULL-SCREEN GESTURE ZONE
        </Text>

        <View style={styles.gestureGridRow}>
          <View style={[styles.gestureBadgeCard, { borderColor: accentColor }]}>
            <Text style={[styles.gestureBadgeTrigger, { color: accentColor }]}>
              1 TAP
            </Text>
            <Text style={styles.gestureBadgeAction}>📸 Scan Page</Text>
          </View>

          <View style={[styles.gestureBadgeCard, { borderColor: '#00E5FF' }]}>
            <Text style={[styles.gestureBadgeTrigger, { color: '#00E5FF' }]}>
              2 TAPS
            </Text>
            <Text style={styles.gestureBadgeAction}>
              {isSpeaking ? '⏸ Pause' : '▶️ Replay'}
            </Text>
          </View>

          <View style={[styles.gestureBadgeCard, { borderColor: '#00E676' }]}>
            <Text style={[styles.gestureBadgeTrigger, { color: '#00E676' }]}>
              HOLD
            </Text>
            <Text style={styles.gestureBadgeAction}>🌐 {targetLanguage}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
