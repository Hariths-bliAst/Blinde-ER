/**
 * Blind-ER Native Text-to-Speech & TalkBack/VoiceOver Service
 * Features:
 *   - Sentence-chunked audiobook playback with true Pause & Resume (never loses reading position)
 *   - Automatic queue interruption (`Speech.stop()`)
 *   - Tactile haptic fallback whenever speech synthesis fails or is muted
 */

import { AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

const LANGUAGE_TO_LOCALE = {
  English: 'en-US',
  Spanish: 'es-ES',
  French: 'fr-FR',
  Malay: 'ms-MY',
  Mandarin: 'zh-CN',
};

let passageState = {
  fullText: '',
  sentences: [],
  currentIndex: 0,
  targetLanguage: 'English',
  isPlaying: false,
  isPaused: false,
  generation: 0,
  callbacks: {},
};

export function splitIntoSentences(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const matches = clean.match(/[^.!?。！？]+[.!?。！？]+["'”’)]*|[^.!?。！？]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [clean];
}

export async function triggerTtsHapticFallback() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Ignore haptic hardware absence in simulator
  }
}

/**
 * Announces state changes directly to Android TalkBack / iOS VoiceOver
 * and speaks short status cues if a screen reader is not active.
 * If an audiobook is currently playing, pauses it cleanly so position is preserved.
 */
export async function announceStateForAccessibility(
  message,
  speakFallback = true
) {
  if (!message) return;
  if (passageState.isPlaying) {
    pauseSpeech();
  }
  try {
    if (AccessibilityInfo?.announceForAccessibility) {
      AccessibilityInfo.announceForAccessibility(message);
    }
    const isScreenReaderEnabled = AccessibilityInfo?.isScreenReaderEnabled
      ? await AccessibilityInfo.isScreenReaderEnabled()
      : false;

    if (!isScreenReaderEnabled && speakFallback) {
      Speech.stop();
      Speech.speak(message, {
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        onError: () => {
          triggerTtsHapticFallback();
        },
      });
    }
  } catch {
    if (speakFallback) {
      try {
        Speech.stop();
        Speech.speak(message, {
          language: 'en-US',
          rate: 1.0,
          onError: () => {
            triggerTtsHapticFallback();
          },
        });
      } catch {
        await triggerTtsHapticFallback();
      }
    } else {
      await triggerTtsHapticFallback();
    }
  }
}

function speakCurrentSentence() {
  const gen = ++passageState.generation;
  if (passageState.currentIndex >= passageState.sentences.length) {
    passageState.isPlaying = false;
    passageState.isPaused = false;
    passageState.currentIndex = 0;
    if (passageState.callbacks.onDone) {
      passageState.callbacks.onDone();
    }
    return;
  }

  const sentence = passageState.sentences[passageState.currentIndex];
  const locale = LANGUAGE_TO_LOCALE[passageState.targetLanguage] || 'en-US';

  try {
    Speech.stop();
    Speech.speak(sentence, {
      language: locale,
      pitch: 0.98,
      rate: 0.95,
      onStart: () => {
        if (gen === passageState.generation && passageState.callbacks.onStart) {
          passageState.callbacks.onStart(passageState.currentIndex);
        }
      },
      onDone: () => {
        if (gen !== passageState.generation || !passageState.isPlaying) return;
        passageState.currentIndex += 1;
        speakCurrentSentence();
      },
      onStopped: () => {
        if (gen !== passageState.generation) return;
        if (passageState.callbacks.onStopped) {
          passageState.callbacks.onStopped(passageState.currentIndex);
        }
      },
      onError: (err) => {
        if (gen !== passageState.generation) return;
        passageState.isPlaying = false;
        passageState.isPaused = true;
        triggerTtsHapticFallback();
        if (passageState.callbacks.onError) {
          passageState.callbacks.onError(err);
        }
      },
    });
  } catch (err) {
    passageState.isPlaying = false;
    passageState.isPaused = true;
    triggerTtsHapticFallback();
    if (passageState.callbacks.onError) {
      passageState.callbacks.onError(err);
    }
  }
}

/**
 * Speaks or resumes the audiobook passage sentence-by-sentence.
 * Pass `resume: true` (or call when paused on the same text) to continue from the paused sentence.
 */
export function speakAudiobookPassage({
  text,
  targetLanguage = 'English',
  resume = false,
  onStart,
  onDone,
  onStopped,
  onError,
}) {
  const isSamePassage =
    passageState.fullText === text &&
    passageState.targetLanguage === targetLanguage &&
    passageState.sentences.length > 0;

  if (!resume || !isSamePassage) {
    passageState.fullText = text;
    passageState.sentences = splitIntoSentences(text);
    passageState.currentIndex = 0;
    passageState.targetLanguage = targetLanguage;
  }

  passageState.callbacks = { onStart, onDone, onStopped, onError };
  passageState.isPlaying = true;
  passageState.isPaused = false;

  speakCurrentSentence();
}

/**
 * Pauses active audiobook playback while preserving the current sentence index.
 */
export function pauseSpeech() {
  passageState.generation += 1;
  passageState.isPlaying = false;
  passageState.isPaused = passageState.sentences.length > 0;
  try {
    Speech.stop();
  } catch {
    // Ignore stop errors
  }
}

/**
 * Resumes a paused audiobook passage from the exact sentence where it was paused.
 */
export function resumeSpeech(callbacks = {}) {
  if (!passageState.sentences.length) return false;
  passageState.callbacks = { ...passageState.callbacks, ...callbacks };
  passageState.isPlaying = true;
  passageState.isPaused = false;
  speakCurrentSentence();
  return true;
}

/**
 * Replays the last read sentence (steps back one sentence and resumes).
 */
export function replayLastSentence(callbacks = {}) {
  if (!passageState.sentences.length) return false;
  passageState.currentIndex = Math.max(0, passageState.currentIndex - 1);
  passageState.callbacks = { ...passageState.callbacks, ...callbacks };
  passageState.isPlaying = true;
  passageState.isPaused = false;
  speakCurrentSentence();
  return true;
}

/**
 * Restarts audiobook playback from the beginning of the passage (sentence 0).
 */
export function restartPassage(callbacks = {}) {
  if (!passageState.sentences.length) return false;
  passageState.currentIndex = 0;
  passageState.callbacks = { ...passageState.callbacks, ...callbacks };
  passageState.isPlaying = true;
  passageState.isPaused = false;
  speakCurrentSentence();
  return true;
}

/**
 * Stops active TTS playback and resets sentence position to the beginning.
 */
export function stopSpeech() {
  passageState.generation += 1;
  passageState.isPlaying = false;
  passageState.isPaused = false;
  passageState.currentIndex = 0;
  try {
    Speech.stop();
  } catch {
    // Ignore stop errors
  }
}

export function getSpeechPlaybackState() {
  return {
    isPlaying: passageState.isPlaying,
    isPaused: passageState.isPaused,
    currentIndex: passageState.currentIndex,
    totalSentences: passageState.sentences.length,
    fullText: passageState.fullText,
  };
}
