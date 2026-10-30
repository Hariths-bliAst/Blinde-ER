/**
 * Blind-ER Custom Accessibility Engine: AccessibleTouchable.js
 * Intercepts all touch interactions across the app:
 *   - ONE TAP: Does NOT execute the action. Speaks `label` + `ttsHint` via Native TTS.
 *   - DOUBLE TAP (within 340ms): Announces confirmation and executes `onDoubleTap()`.
 */

import React, { useRef, useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

const DOUBLE_TAP_WINDOW_MS = 340;

/**
 * Centralized Native TTS helper (wireable to any Native TTS / TalkBack engine).
 */
export function speakAssistivePrompt(text, options = {}) {
  try {
    Speech.stop();
    Speech.speak(text, {
      language: options.language || 'en-US',
      pitch: options.pitch || 1.0,
      rate: options.rate || 0.96,
      onDone: options.onDone,
      onStopped: options.onStopped,
      onError: options.onError,
    });
  } catch (err) {
    console.warn('TTS Playback Error:', err);
    if (options.onDone) options.onDone();
  }
}

let activeFocusedId = null;
let nextInstanceId = 1;

export default function AccessibleTouchable({
  label,
  ttsHint = 'Double tap to activate.',
  confirmSpeech,
  onDoubleTap,
  style,
  focusedStyle,
  children,
  disabled = false,
  accessibilityRole = 'button',
}) {
  const instanceIdRef = useRef(nextInstanceId++);
  const singleTapTimerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = useCallback(() => {
    if (disabled) return;

    if (activeFocusedId === instanceIdRef.current) {
      // SECOND TAP ON FOCUSED ITEM (Rapid Double-Tap OR 2nd Tap after TTS Readout) -> Execute Action
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      activeFocusedId = null;
      setIsFocused(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (confirmSpeech) {
        speakAssistivePrompt(confirmSpeech);
      }
      if (onDoubleTap) {
        onDoubleTap();
      }
    } else {
      // FIRST TAP -> Focus element & read label + hint aloud via Native TTS
      activeFocusedId = instanceIdRef.current;
      setIsFocused(true);

      singleTapTimerRef.current = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        speakAssistivePrompt(`${label}. ${ttsHint}`);
        singleTapTimerRef.current = null;
      }, 180);
    }
  }, [confirmSpeech, disabled, label, onDoubleTap, ttsHint]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={ttsHint}
      style={({ pressed }) => [
        styles.baseTouchable,
        style,
        (pressed || isFocused) && styles.appleFocusRing,
        (pressed || isFocused) && focusedStyle,
        pressed && styles.pressedScale,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleFocusRing: {
    borderColor: '#0071E3',
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
});

