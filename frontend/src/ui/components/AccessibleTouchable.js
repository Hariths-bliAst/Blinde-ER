/**
 * Blind-ER Custom Accessibility Engine: AccessibleTouchable.js
 * Hardened against Accessibility Chaos QA scenarios:
 *   - ONE TAP: Immediately stops prior TTS (`Speech.stop()`), fires Light Haptic tick,
 *     speaks concise label/hint, and opens an adjustable double-tap window (default 350ms).
 *   - DOUBLE TAP (within `doubleTapWindowMs`): Cancels window timer, stops TTS, fires
 *     Medium Haptic pulse, debounces rapid accidental multi-taps, and executes `onDoubleTap()`.
 *   - WINDOW EXPIRY: If `doubleTapWindowMs` elapses without a second tap, focus resets
 *     so late taps never accidentally fire the action.
 *   - TTS FAILURE FALLBACK: Triggers warning haptics if native speech synthesis fails.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { stopSpeech } from '../../logic/ttsService';

export const DEFAULT_DOUBLE_TAP_WINDOW_MS = 350;
export const DEFAULT_DEBOUNCE_MS = 350;

/**
 * Centralized Native TTS helper with immediate queue interruption and haptic fallback.
 */
export function speakAssistivePrompt(text, options = {}) {
  if (!text) return;
  try {
    Speech.stop();
    Speech.speak(text, {
      language: options.language || 'en-US',
      pitch: options.pitch || 1.0,
      rate: options.rate || 0.98,
      onDone: options.onDone,
      onStopped: options.onStopped,
      onError: (err) => {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        ).catch(() => {});
        if (options.onError) options.onError(err);
      },
    });
  } catch (err) {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});
    if (options.onError) options.onError(err);
    if (options.onDone) options.onDone();
  }
}

let activeFocusedId = null;
let nextInstanceId = 1;

export function resetAccessibleTouchableState() {
  activeFocusedId = null;
}

export default function AccessibleTouchable({
  label,
  ttsHint = '',
  confirmSpeech,
  onDoubleTap,
  doubleTapWindowMs = DEFAULT_DOUBLE_TAP_WINDOW_MS,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  style,
  focusedStyle,
  children,
  disabled = false,
  accessibilityRole = 'button',
  testID,
}) {
  const instanceIdRef = useRef(nextInstanceId++);
  const doubleTapTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isDebouncingRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    return () => {
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (activeFocusedId === instanceIdRef.current) {
        activeFocusedId = null;
      }
    };
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || isDebouncingRef.current) return;

    if (activeFocusedId === instanceIdRef.current) {
      // SECOND TAP WITHIN WINDOW -> Execute Action & Debounce Rapid Taps
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
        doubleTapTimerRef.current = null;
      }
      activeFocusedId = null;
      setIsFocused(false);

      isDebouncingRef.current = true;
      debounceTimerRef.current = setTimeout(() => {
        isDebouncingRef.current = false;
        debounceTimerRef.current = null;
      }, debounceMs);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      if (confirmSpeech) {
        speakAssistivePrompt(confirmSpeech);
      } else {
        Speech.stop();
      }
      if (onDoubleTap) {
        onDoubleTap();
      }
    } else {
      // FIRST TAP -> Interrupt TTS, fire Light Haptic tick, speak concise label, start window
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
      }
      activeFocusedId = instanceIdRef.current;
      setIsFocused(true);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const spokenPrompt = ttsHint ? `${label}. ${ttsHint}` : `${label}`;
      speakAssistivePrompt(spokenPrompt);

      doubleTapTimerRef.current = setTimeout(() => {
        if (activeFocusedId === instanceIdRef.current) {
          activeFocusedId = null;
        }
        setIsFocused(false);
        doubleTapTimerRef.current = null;
      }, doubleTapWindowMs);
    }
  }, [
    confirmSpeech,
    debounceMs,
    disabled,
    doubleTapWindowMs,
    label,
    onDoubleTap,
    ttsHint,
  ]);

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={ttsHint || 'Double tap to activate.'}
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
