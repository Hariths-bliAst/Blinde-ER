/**
 * Blind-ER Scanner Controller Hook
 * Hardened for Accessibility Chaos QA + True Sentence-Level Pause/Resume:
 *   - Camera permission rejection -> Audible prompt guiding user to system settings.
 *   - Malformed / empty / low-confidence scan response -> Speaks:
 *     "No book text detected. Align camera and try again."
 *   - Strict 8-second network timeout -> Immediate spoken timeout error handling.
 *   - True Pause & Resume -> Pausing preserves sentence index and resumes without restarting.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { extractTextWithCrnn, contextualizeWithLlm } from '../api/scannerApi';
import {
  announceStateForAccessibility,
  speakAudiobookPassage,
  pauseSpeech,
  resumeSpeech,
  replayLastSentence,
  restartPassage,
  stopSpeech,
  triggerTtsHapticFallback,
} from './ttsService';
import { ENV } from '../config/env';

const SUPPORTED_LANGUAGES = ['English', 'Spanish', 'French', 'Malay', 'Mandarin'];
const MIN_CONFIDENCE_THRESHOLD = 0.5;

export const NO_TEXT_DETECTED_MESSAGE =
  'No book text detected. Align camera and try again.';
export const CAMERA_PERMISSION_DENIED_MESSAGE =
  'Camera permission denied. Please enable camera access in system settings.';
export const NETWORK_TIMEOUT_MESSAGE =
  'Network timeout. Please check your connection and try again.';

export function useScannerController() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [status, setStatus] = useState('IDLE');
  const [statusMessage, setStatusMessage] = useState('Ready to scan.');
  const [rawOcrText, setRawOcrText] = useState('');
  const [narratedText, setNarratedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(
    ENV.DEFAULT_TARGET_LANGUAGE
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cameraRef = useRef(null);
  const singleTapTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeScanner() {
      try {
        if (cameraPermission && cameraPermission.granted === false) {
          const permResult = requestCameraPermission
            ? await requestCameraPermission()
            : cameraPermission;

          if (!permResult?.granted) {
            if (!isMounted) return;
            setStatus('PERMISSION_DENIED');
            setStatusMessage(CAMERA_PERMISSION_DENIED_MESSAGE);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            ).catch(() => {});
            await announceStateForAccessibility(
              CAMERA_PERMISSION_DENIED_MESSAGE
            );
            return;
          }
        } else if (!cameraPermission && requestCameraPermission) {
          const permResult = await requestCameraPermission();
          if (permResult && permResult.granted === false) {
            if (!isMounted) return;
            setStatus('PERMISSION_DENIED');
            setStatusMessage(CAMERA_PERMISSION_DENIED_MESSAGE);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            ).catch(() => {});
            await announceStateForAccessibility(
              CAMERA_PERMISSION_DENIED_MESSAGE
            );
            return;
          }
        }

        if (isMounted) {
          announceStateForAccessibility('Scanner ready.');
        }
      } catch {
        if (isMounted) {
          setStatus('PERMISSION_DENIED');
          setStatusMessage(CAMERA_PERMISSION_DENIED_MESSAGE);
          announceStateForAccessibility(CAMERA_PERMISSION_DENIED_MESSAGE);
        }
      }
    }

    initializeScanner();

    return () => {
      isMounted = false;
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      stopSpeech();
    };
  }, []);

  /**
   * Executes the full scan-to-voice pipeline with strict validation & timeout handling.
   */
  const executeScanPipeline = useCallback(async () => {
    if (
      status === 'CAPTURING' ||
      status === 'EXTRACTING' ||
      status === 'CONTEXTUALIZING'
    ) {
      return;
    }

    if (cameraPermission && cameraPermission.granted === false) {
      const retryPerm = requestCameraPermission
        ? await requestCameraPermission()
        : null;
      if (!retryPerm?.granted) {
        setStatus('PERMISSION_DENIED');
        setStatusMessage(CAMERA_PERMISSION_DENIED_MESSAGE);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        await announceStateForAccessibility(CAMERA_PERMISSION_DENIED_MESSAGE);
        return;
      }
    }

    try {
      stopSpeech();
      setIsSpeaking(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => {}
      );

      setStatus('CAPTURING');
      setStatusMessage('Scanning page...');

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
          // Fallback to simulated page uri in test/emulator environments
        }
      }

      setStatus('EXTRACTING');
      const scanResult = await extractTextWithCrnn(imageUri);

      const rawText =
        typeof scanResult?.raw_text === 'string'
          ? scanResult.raw_text.trim()
          : '';
      const confidence =
        typeof scanResult?.confidence === 'number' ? scanResult.confidence : 1.0;

      if (!rawText || confidence < MIN_CONFIDENCE_THRESHOLD) {
        setStatus('IDLE');
        setStatusMessage(NO_TEXT_DETECTED_MESSAGE);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        ).catch(() => {});
        await announceStateForAccessibility(NO_TEXT_DETECTED_MESSAGE);
        return;
      }

      setRawOcrText(rawText);

      setStatus('CONTEXTUALIZING');
      const llmResult = await contextualizeWithLlm(rawText, targetLanguage);
      const cleanNarration =
        typeof llmResult?.narrated_text === 'string'
          ? llmResult.narrated_text.trim()
          : '';

      if (!cleanNarration) {
        setStatus('IDLE');
        setStatusMessage(NO_TEXT_DETECTED_MESSAGE);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        ).catch(() => {});
        await announceStateForAccessibility(NO_TEXT_DETECTED_MESSAGE);
        return;
      }

      setNarratedText(cleanNarration);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});

      // Per user requirement: Ask before start reading
      setStatus('AWAITING_CONFIRMATION');
      setStatusMessage('Page text detected. Ready to read.');
      setIsSpeaking(false);
      setIsPaused(false);

      await announceStateForAccessibility(
        'Page text detected. Would you like me to start reading? Double-tap Read to start, or double-tap Cancel.'
      );
    } catch (error) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
      setStatus('ERROR');

      const isTimeout =
        error?.code === 'ETIMEDOUT' ||
        /timed?\s*out/i.test(error?.message || '');

      const errMsg = isTimeout
        ? NETWORK_TIMEOUT_MESSAGE
        : 'Connection error. Please try again.';

      setStatusMessage(errMsg);
      await announceStateForAccessibility(errMsg);
    }
  }, [cameraPermission, requestCameraPermission, status, targetLanguage]);

  const confirmStartReading = useCallback(() => {
    if (!narratedText) return;
    setStatus('SPEAKING');
    setStatusMessage(`Reading in ${targetLanguage}`);
    setIsSpeaking(true);
    setIsPaused(false);

    speakAudiobookPassage({
      text: narratedText,
      targetLanguage,
      resume: false,
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setStatus('IDLE');
        setStatusMessage('Finished reading.');
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
      onError: () => {
        setIsSpeaking(false);
        setStatus('ERROR');
        triggerTtsHapticFallback();
      },
    });
  }, [narratedText, targetLanguage]);

  const cancelReading = useCallback(async () => {
    stopSpeech();
    setIsSpeaking(false);
    setIsPaused(false);
    setStatus('IDLE');
    setStatusMessage('Reading cancelled.');
    await announceStateForAccessibility('Reading cancelled. Ready to scan.');
  }, []);

  const resumeCurrent = useCallback(() => {
    if (!narratedText) return;
    setStatus('SPEAKING');
    setStatusMessage(`Resuming in ${targetLanguage}`);
    setIsSpeaking(true);
    setIsPaused(false);
    resumeSpeech({
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setStatus('IDLE');
        setStatusMessage('Finished reading.');
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        triggerTtsHapticFallback();
      },
    });
  }, [narratedText, targetLanguage]);

  const handleReplayLastSentence = useCallback(() => {
    if (!narratedText) return;
    setStatus('SPEAKING');
    setStatusMessage('Replaying last sentence');
    setIsSpeaking(true);
    setIsPaused(false);
    replayLastSentence({
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setStatus('IDLE');
        setStatusMessage('Finished reading.');
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        triggerTtsHapticFallback();
      },
    });
  }, [narratedText]);

  const handleRestartFromStart = useCallback(() => {
    if (!narratedText) return;
    setStatus('SPEAKING');
    setStatusMessage('Restarting from beginning');
    setIsSpeaking(true);
    setIsPaused(false);
    restartPassage({
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setStatus('IDLE');
        setStatusMessage('Finished reading.');
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        triggerTtsHapticFallback();
      },
    });
  }, [narratedText]);

  /**
   * True Pause / Resume Handler:
   * - While speaking: pauses at the current sentence and asks the user for action.
   * - While paused: resumes from the paused sentence instead of restarting.
   */
  const handleDoubleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {}
    );

    if (isSpeaking) {
      pauseSpeech();
      setIsSpeaking(false);
      setIsPaused(true);
      setStatus('PAUSED_MENU');
      setStatusMessage('Paused.');
      await announceStateForAccessibility(
        'Paused. Double-tap Resume to continue, double-tap Replay to reread the last sentence, or double-tap Restart to start from the page beginning.'
      );
      return;
    }

    if (status === 'AWAITING_CONFIRMATION') {
      confirmStartReading();
      return;
    }

    if (status === 'PAUSED_MENU' || status === 'PAUSED') {
      resumeCurrent();
      return;
    }

    if (narratedText) {
      confirmStartReading();
    } else {
      announceStateForAccessibility('Tap Capture to scan a page.');
    }
  }, [
    confirmStartReading,
    isSpeaking,
    narratedText,
    resumeCurrent,
    status,
  ]);

  const handleScreenTap = useCallback(() => {
    executeScanPipeline();
  }, [executeScanPipeline]);

  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
      () => {}
    );
    stopSpeech();
    setIsSpeaking(false);

    setTargetLanguage((prevLang) => {
      const nextIndex =
        (SUPPORTED_LANGUAGES.indexOf(prevLang) + 1) %
        SUPPORTED_LANGUAGES.length;
      const nextLang = SUPPORTED_LANGUAGES[nextIndex];
      const msg = `Language: ${nextLang}.`;
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
    isPaused: status === 'PAUSED' || status === 'PAUSED_MENU',
    confirmStartReading,
    cancelReading,
    resumeCurrent,
    replayLastSentence: handleReplayLastSentence,
    restartFromBeginning: handleRestartFromStart,
    onSingleTap: handleScreenTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
  };
}
