/**
 * AccessibleTouchOverlay Component (MATTHEW'S UI WORKSPACE)
 * Turns the entire mobile screen into a single, zero-precision gesture surface.
 * Fully wired for Android TalkBack and iOS VoiceOver.
 */

import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { styles } from './AccessibleTouchOverlay.styles';

export default function AccessibleTouchOverlay({
  statusMessage,
  targetLanguage,
  isSpeaking,
  onSingleTap,
  onDoubleTap,
  onLongPress,
  children,
}) {
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
        pressed && styles.fullScreenResponderPressed,
      ]}
    >
      {children}

      <View
        style={styles.gestureFooterBar}
        accessible={true}
        accessibilityRole="summary"
      >
        <Text style={styles.gestureGuideTitle}>
          FULL-SCREEN GESTURE CONTROLS ({targetLanguage.toUpperCase()})
        </Text>
        <Text style={styles.gestureInstructionText}>
          • 1 Tap Anywhere: Scan Book Page{'\n'}
          • 2 Taps Anywhere: {isSpeaking ? 'Pause Audio' : 'Replay Audio'}{'\n'}
          • Hold Anywhere: Switch Language
        </Text>
      </View>
    </Pressable>
  );
}

