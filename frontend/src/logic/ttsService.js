/**
 * Blind-ER Native Text-to-Speech & TalkBack/VoiceOver Service (CORE LOGIC)
 * Coordinates screen reader announcements (`AccessibilityInfo`) and expressive
 * native audiobook narration (`expo-speech`).
 */

import { AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';

const LANGUAGE_TO_LOCALE = {
  English: 'en-US',
  Spanish: 'es-ES',
  French: 'fr-FR',
  Malay: 'ms-MY',
  Mandarin: 'zh-CN',
};

/**
 * Announces state changes directly to Android TalkBack / iOS VoiceOver
 * and also speaks short status cues if a screen reader is not active.
 */
export async function announceStateForAccessibility(message, speakFallback = true) {
  try {
    AccessibilityInfo.announceForAccessibility(message);
    const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    if (!isScreenReaderEnabled && speakFallback) {
      Speech.stop();
      Speech.speak(message, {
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0,
      });
    }
  } catch {
    // Fallback to native TTS if AccessibilityInfo query fails
    if (speakFallback) {
      Speech.speak(message, { language: 'en-US', rate: 1.0 });
    }
  }
}

/**
 * Stage 3: Speaks the LLM-contextualized audiobook passage using native mobile TTS.
 */
export function speakAudiobookPassage({
  text,
  targetLanguage = 'English',
  onStart,
  onDone,
  onStopped,
  onError,
}) {
  Speech.stop();
  const locale = LANGUAGE_TO_LOCALE[targetLanguage] || 'en-US';

  Speech.speak(text, {
    language: locale,
    pitch: 0.98, // Warm, natural audiobook narration pitch
    rate: 0.92,  // Slightly measured pacing for literary clarity
    onStart,
    onDone,
    onStopped,
    onError,
  });
}

/**
 * Stops active TTS playback immediately.
 */
export function stopSpeech() {
  Speech.stop();
}

