/**
 * Blind-ER Scanner Controller Hook (CORE LOGIC - DO NOT EDIT FOR STYLING)
 * Manages the voice-first gesture responder state machine:
 *   - Single Tap Anywhere: Capture page -> CRNN Extract -> LLM Contextualize -> TTS Narrate
 *   - Double Tap Anywhere: Stop / Replay current audiobook narration
 *   - Long Press Anywhere: Cycle target narration language with auditory confirmation
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { extractTextWithCrnn, contextualizeWithLlm } from '../api/scannerApi';
import {
  announceStateForAccessibility,
  speakAudiobookPassage,
  stopSpeech,
} from './ttsService';
import { ENV } from '../config/env';

const SUPPORTED_LANGUAGES = ['English', 'Spanish', 'French', 'Malay', 'Mandarin'];
const DOUBLE_TAP_DELAY_MS = 320;

export function useScannerController() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [status, setStatus] = useState('IDLE');
  const [statusMessage, setStatusMessage] = useState(
    'Ready to scan. Single tap anywhere to scan page. Double tap to pause or replay. Long press to switch language.'
  );
  const [rawOcrText, setRawOcrText] = useState('');
  const [narratedText, setNarratedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(ENV.DEFAULT_TARGET_LANGUAGE);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cameraRef = useRef(null);
  const lastTapTimestampRef = useRef(0);
  const singleTapTimeoutRef = useRef(null);

  // Request camera permission and greet user via TalkBack/TTS on mount
  useEffect(() => {
    async function initializeScanner() {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      announceStateForAccessibility(
        'Blind-ER Book Scanner ready. Single tap anywhere on the screen to capture a page. Double tap to pause or replay audio. Long press to change translation language.'
      );
    }
    initializeScanner();

    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      stopSpeech();
    };
  }, []);

  /**
   * Executes the full 3-step AI pipeline (CRNN -> Gemini LLM -> Native TTS)
   */
  const executeScanPipeline = useCallback(async () => {
    if (status === 'CAPTURING' || status === 'EXTRACTING' || status === 'CONTEXTUALIZING') {
      announceStateForAccessibility('Scan already in progress. Please wait.');
      return;
    }

    try {
      stopSpeech();
      setIsSpeaking(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Step 0: Capture Document Image
      setStatus('CAPTURING');
      const captureMsg = 'Capturing book page. Hold steady.';
      setStatusMessage(captureMsg);
      announceStateForAccessibility(captureMsg);

      let imageUri = 'mock://captured-book-page.jpg';
      if (cameraRef.current && cameraPermission?.granted) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.85,
            skipProcessing: false,
          });
          if (photo?.uri) {
            imageUri = photo.uri;
          }
        } catch {
          // Allows testing in emulators without physical camera feed
        }
      }

      // Step 1: CRNN Raw Text Extraction
      setStatus('EXTRACTING');
      const extractMsg = 'Extracting text with CRNN scanner...';
      setStatusMessage(extractMsg);
      announceStateForAccessibility(extractMsg);

      const crnnResult = await extractTextWithCrnn(imageUri);
      setRawOcrText(crnnResult.raw_text);

      // Step 2: Gemini LLM Contextualization & Translation
      setStatus('CONTEXTUALIZING');
      const llmMsg = `Contextualizing and translating into ${targetLanguage}...`;
      setStatusMessage(llmMsg);
      announceStateForAccessibility(llmMsg);

      const llmResult = await contextualizeWithLlm(
        crnnResult.raw_text,
        targetLanguage
      );
      setNarratedText(llmResult.narrated_text);

      // Step 3: Native Audiobook TTS Playback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('SPEAKING');
      setStatusMessage(`Narrating in ${targetLanguage}. Double tap anywhere to pause.`);
      setIsSpeaking(true);

      speakAudiobookPassage({
        text: llmResult.narrated_text,
        targetLanguage,
        onStart: () => setIsSpeaking(true),
        onDone: () => {
          setIsSpeaking(false);
          setStatus('IDLE');
          setStatusMessage('Narration finished. Single tap to scan next page, or double tap to replay.');
        },
        onStopped: () => {
          setIsSpeaking(false);
        },
        onError: () => {
          setIsSpeaking(false);
          setStatus('ERROR');
        },
      });
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus('ERROR');
      const errMsg = `Scan failed. Please check backend connection. ${error.message || ''}`;
      setStatusMessage(errMsg);
      announceStateForAccessibility(errMsg);
    }
  }, [cameraPermission, status, targetLanguage]);

  /**
   * Double-Tap Handler: Pauses active narration OR replays the last narrated passage.
   */
  const handleDoubleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      setStatus('PAUSED');
      const pauseMsg = 'Narration paused. Double tap to replay, or single tap to scan a new page.';
      setStatusMessage(pauseMsg);
      announceStateForAccessibility(pauseMsg);
      return;
    }

    if (narratedText) {
      setStatus('SPEAKING');
      setStatusMessage(`Replaying narration in ${targetLanguage}.`);
      setIsSpeaking(true);
      speakAudiobookPassage({
        text: narratedText,
        targetLanguage,
        onStart: () => setIsSpeaking(true),
        onDone: () => {
          setIsSpeaking(false);
          setStatus('IDLE');
        },
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } else {
      announceStateForAccessibility('No passage scanned yet. Single tap anywhere to scan a book page.');
    }
  }, [isSpeaking, narratedText, targetLanguage]);

  /**
   * Unified Tap Dispatcher distinguishing Single Tap vs. Double Tap anywhere on screen.
   */
  const handleScreenTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTimestampRef.current < DOUBLE_TAP_DELAY_MS) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapTimestampRef.current = 0;
      handleDoubleTap();
    } else {
      lastTapTimestampRef.current = now;
      singleTapTimeoutRef.current = setTimeout(() => {
        executeScanPipeline();
        singleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY_MS);
    }
  }, [executeScanPipeline, handleDoubleTap]);

  /**
   * Long-Press Handler: Cycles target language with haptic + spoken confirmation.
   */
  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopSpeech();
    setIsSpeaking(false);

    setTargetLanguage((prevLang) => {
      const nextIndex =
        (SUPPORTED_LANGUAGES.indexOf(prevLang) + 1) % SUPPORTED_LANGUAGES.length;
      const nextLang = SUPPORTED_LANGUAGES[nextIndex];
      const msg = `Target audiobook language set to ${nextLang}. Single tap to scan.`;
      setStatusMessage(msg);
      announceStateForAccessibility(msg);
      return nextLang;
    });
  }, []);

  return {
    cameraRef,
    cameraPermission,
    requestCameraPermission,
    status,
    statusMessage,
    rawOcrText,
    narratedText,
    targetLanguage,
    isSpeaking,
    onSingleTap: handleScreenTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
  };
}

