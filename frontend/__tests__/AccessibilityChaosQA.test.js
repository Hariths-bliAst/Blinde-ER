/**
 * Blind-ER Accessibility Chaos QA Automated Test Suite
 * Role: Severely Visually Impaired Tester & Accessibility Chaos QA Engineer
 *
 * Audits and verifies:
 *   1. Custom Gesture Engine (`AccessibleTouchable.js`)
 *      - 1a: Rapid accidental multi-tap debouncing
 *      - 1b: Single-tap readout vs. double-tap execution + adjustable window & expiry
 *      - 1c: Immediate TTS audio queue interruption (`Speech.stop()`)
 *      - 1d: Distinct tactile haptic patterns (Light tick on 1-tap, Medium pulse on 2-tap)
 *   2. Spatial Safety (`FeatureLayoutTemplate.js`)
 *      - 2a: Full height/width zero-gap 4-button bottom spatial bar (no dead zones)
 *      - 2b: Non-interactive upper area boundary cue:
 *            "Navigation area: 4 buttons located along the bottom edge."
 *   3. Camera & Backend Failures + True Pause/Resume (`BookScannerScreen.js`)
 *      - 3a: Muted or failed TTS -> Tactile haptic fallback
 *      - 3b: Malformed / empty / low-confidence response ->
 *            "No book text detected. Align camera and try again."
 *      - 3c: Strict 8-second network timeout on FastAPI fetch with spoken error handling
 *      - 3d: Camera permission rejection -> Audible prompt guiding user to system settings
 *      - 3e: True sentence-level Pause & Resume -> Resumes from paused sentence without restarting
 *   4. Onboarding, Camera AI Mode & Voice-Only-When-Necessary UX (`OnboardingScreen.js`, `CameraAssistantScreen.js`)
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as ExpoCamera from 'expo-camera';

import AccessibleTouchable, {
  resetAccessibleTouchableState,
  speakAssistivePrompt,
} from '../src/ui/components/AccessibleTouchable';
import FeatureLayoutTemplate, {
  BOUNDARY_CUE_MESSAGE,
} from '../src/ui/components/FeatureLayoutTemplate';
import BookScannerScreen from '../src/ui/screens/BookScannerScreen';
import CameraAssistantScreen from '../src/ui/screens/CameraAssistantScreen';
import OnboardingScreen, {
  ONBOARDING_PROMPT,
} from '../src/ui/screens/OnboardingScreen';
import {
  NO_TEXT_DETECTED_MESSAGE,
  CAMERA_PERMISSION_DENIED_MESSAGE,
  NETWORK_TIMEOUT_MESSAGE,
} from '../src/logic/useScannerController';
import {
  speakAudiobookPassage,
  pauseSpeech,
  stopSpeech,
  getSpeechPlaybackState,
} from '../src/logic/ttsService';

describe('Blind-ER Accessibility Chaos QA Suite', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetAccessibleTouchableState();
    stopSpeech();
    ExpoCamera.__mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted' },
      jest.fn(() => Promise.resolve({ granted: true, status: 'granted' })),
    ]);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // =========================================================================
  // 1. CUSTOM GESTURE ENGINE (`AccessibleTouchable.js`)
  // =========================================================================
  describe('1. Custom Gesture Engine (AccessibleTouchable.js)', () => {
    test('1a. Accidental rapid taps: debounces execution to prevent duplicate triggers', () => {
      const onDoubleTapMock = jest.fn();
      const { getByTestId } = render(
        <AccessibleTouchable
          testID="chaos-btn"
          label="Scan Page"
          ttsHint="Double tap to scan."
          onDoubleTap={onDoubleTapMock}
          doubleTapWindowMs={350}
          debounceMs={350}
        >
          <Text>Scan Page</Text>
        </AccessibleTouchable>
      );

      const btn = getByTestId('chaos-btn');

      // Simulate 6 frantic accidental taps within 100ms
      act(() => {
        fireEvent.press(btn); // Tap 1: Focus + TTS readout
        jest.advanceTimersByTime(40);
        fireEvent.press(btn); // Tap 2: Executes action + activates debounce lock
        jest.advanceTimersByTime(20);
        fireEvent.press(btn); // Tap 3: Ignored (debounced)
        fireEvent.press(btn); // Tap 4: Ignored (debounced)
        fireEvent.press(btn); // Tap 5: Ignored (debounced)
        fireEvent.press(btn); // Tap 6: Ignored (debounced)
      });

      expect(onDoubleTapMock).toHaveBeenCalledTimes(1);
    });

    test('1b. Single-tap to read, double-tap to fire; adjustable window cancels if exceeded', () => {
      const onDoubleTapMock = jest.fn();
      const customWindowMs = 320;

      const { getByTestId } = render(
        <AccessibleTouchable
          testID="window-btn"
          label="Play Audiobook"
          ttsHint="Double tap to play."
          onDoubleTap={onDoubleTapMock}
          doubleTapWindowMs={customWindowMs}
        >
          <Text>Play</Text>
        </AccessibleTouchable>
      );

      const btn = getByTestId('window-btn');

      // 1st Tap: Speaks label + hint, does NOT execute
      act(() => {
        fireEvent.press(btn);
      });
      expect(onDoubleTapMock).not.toHaveBeenCalled();
      expect(Speech.speak).toHaveBeenCalledWith(
        'Play Audiobook. Double tap to play.',
        expect.any(Object)
      );

      // Exceed the adjustable 320ms double-tap window (wait 360ms)
      act(() => {
        jest.advanceTimersByTime(360);
      });

      // Tap again AFTER window expired -> must NOT fire onDoubleTap; treats as fresh 1st tap
      act(() => {
        fireEvent.press(btn);
      });
      expect(onDoubleTapMock).not.toHaveBeenCalled();
      expect(Speech.speak).toHaveBeenCalledTimes(2);

      // Now tap a 2nd time WITHIN the 320ms window (at 150ms) -> executes onDoubleTap
      act(() => {
        jest.advanceTimersByTime(150);
        fireEvent.press(btn);
      });
      expect(onDoubleTapMock).toHaveBeenCalledTimes(1);
    });

    test('1c. Audio queue interruption: new 1-tap immediately cancels currently playing TTS speech', () => {
      const callOrder = [];
      Speech.stop.mockImplementation(() => callOrder.push('stop'));
      Speech.speak.mockImplementation(() => callOrder.push('speak'));

      const { getByTestId } = render(
        <>
          <AccessibleTouchable testID="btn-1" label="Button One">
            <Text>One</Text>
          </AccessibleTouchable>
          <AccessibleTouchable testID="btn-2" label="Button Two">
            <Text>Two</Text>
          </AccessibleTouchable>
        </>
      );

      act(() => {
        fireEvent.press(getByTestId('btn-1'));
        jest.advanceTimersByTime(100);
        fireEvent.press(getByTestId('btn-2'));
      });

      // Every tap cancels ongoing speech via Speech.stop before triggering speech
      expect(Speech.stop).toHaveBeenCalled();
      expect(Speech.speak).toHaveBeenCalledTimes(2);
      expect(callOrder[0]).toBe('stop');
      expect(callOrder[1]).toBe('speak');
      expect(callOrder[callOrder.length - 1]).toBe('speak');
    });

    test('1d. Haptic feedback: fires distinct Light tick on 1-tap and Medium pulse on 2-tap execute', () => {
      const onDoubleTapMock = jest.fn();
      const { getByTestId } = render(
        <AccessibleTouchable
          testID="haptic-btn"
          label="Settings"
          onDoubleTap={onDoubleTapMock}
        >
          <Text>Settings</Text>
        </AccessibleTouchable>
      );

      const btn = getByTestId('haptic-btn');

      // 1st Tap -> Light Haptic Tick
      act(() => {
        fireEvent.press(btn);
      });
      expect(Haptics.impactAsync).toHaveBeenLastCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );

      // 2nd Tap -> Medium Haptic Pulse
      act(() => {
        jest.advanceTimersByTime(120);
        fireEvent.press(btn);
      });
      expect(Haptics.impactAsync).toHaveBeenLastCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
      expect(onDoubleTapMock).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. SPATIAL SAFETY (`FeatureLayoutTemplate.js`)
  // =========================================================================
  describe('2. Spatial Safety (FeatureLayoutTemplate.js)', () => {
    test('2a. Bottom 4-button spatial bar spans full height/width with zero dead zones', () => {
      const { getByTestId } = render(
        <FeatureLayoutTemplate
          featureTitle="Scanner"
          onBack={jest.fn()}
          primaryAction={{ label: 'Capture', onDoubleTap: jest.fn() }}
          secondaryAction={{ label: 'Read', onDoubleTap: jest.fn() }}
          onNext={jest.fn()}
        >
          <Text>Content</Text>
        </FeatureLayoutTemplate>
      );

      const bottomBar = getByTestId('bottom-control-bar');
      const barStyle = StyleSheet.flatten(bottomBar.props.style);

      expect(barStyle.gap).toBe(0);
      expect(barStyle.padding).toBe(0);
      expect(barStyle.paddingHorizontal).toBe(0);
      expect(barStyle.paddingVertical).toBe(0);
      expect(barStyle.width).toBe('100%');
      expect(barStyle.height).toBe('100%');

      const buttonIds = [
        'bar-btn-back',
        'bar-btn-primary',
        'bar-btn-secondary',
        'bar-btn-next',
      ];
      buttonIds.forEach((id) => {
        const btn = getByTestId(id);
        const flatStyle = StyleSheet.flatten(btn.props.style);
        expect(flatStyle.flex).toBe(1);
        expect(flatStyle.height).toBe('100%');
        expect(flatStyle.width).toBe('100%');
        expect(flatStyle.margin).toBe(0);
      });
    });

    test('2b. Touching non-interactive middle/top area triggers ambient auditory boundary cue', () => {
      const { getByTestId } = render(
        <FeatureLayoutTemplate
          featureTitle="Scanner"
          onBack={jest.fn()}
          primaryAction={{ label: 'Capture', onDoubleTap: jest.fn() }}
          secondaryAction={{ label: 'Read', onDoubleTap: jest.fn() }}
          onNext={jest.fn()}
        >
          <Text>Non-interactive Hero Region</Text>
        </FeatureLayoutTemplate>
      );

      const boundaryArea = getByTestId('spatial-boundary-area');
      act(() => {
        fireEvent.press(boundaryArea);
      });

      expect(Speech.speak).toHaveBeenCalledWith(
        BOUNDARY_CUE_MESSAGE,
        expect.any(Object)
      );
      expect(BOUNDARY_CUE_MESSAGE).toBe(
        'Navigation area: 4 buttons located along the bottom edge.'
      );
    });
  });

  // =========================================================================
  // 3. CAMERA & BACKEND FAILURES + TRUE PAUSE/RESUME (`BookScannerScreen.js`)
  // =========================================================================
  describe('3. Camera & Backend Failures + True Pause/Resume (BookScannerScreen.js)', () => {
    test('3a. Muted or failed TTS: triggers tactile haptic fallback when speech synthesis fails', async () => {
      Speech.speak.mockImplementationOnce((_text, options) => {
        if (options?.onError) {
          options.onError(new Error('TTS Engine Muted or Unavailable'));
        }
      });

      act(() => {
        speakAssistivePrompt('Test prompt when TTS fails');
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    test('3b. Malformed or zero-text response: speaks "No book text detected. Align camera and try again."', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          raw_text: '   ',
          crnn_confidence: 0.12,
        }),
      });

      const { getByTestId } = render(<BookScannerScreen />);
      const captureBtn = getByTestId('bar-btn-primary');

      await act(async () => {
        fireEvent.press(captureBtn);
        jest.advanceTimersByTime(100);
        fireEvent.press(captureBtn);
      });

      await waitFor(() => {
        expect(Speech.speak).toHaveBeenCalledWith(
          NO_TEXT_DETECTED_MESSAGE,
          expect.any(Object)
        );
      });
      expect(NO_TEXT_DETECTED_MESSAGE).toBe(
        'No book text detected. Align camera and try again.'
      );
    });

    test('3c. Network timeout: enforces strict 8-second timeout on FastAPI fetch with immediate spoken error handling', async () => {
      // Simulate fetch hanging forever
      global.fetch.mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves
          })
      );

      const { getByTestId } = render(<BookScannerScreen />);
      const captureBtn = getByTestId('bar-btn-primary');

      // Double-tap Capture button to trigger executeScanPipeline
      await act(async () => {
        fireEvent.press(captureBtn);
        jest.advanceTimersByTime(100);
        fireEvent.press(captureBtn);
      });

      // Advance timers by the 8000ms fetch timeout
      await act(async () => {
        jest.advanceTimersByTime(8200);
      });

      await waitFor(() => {
        expect(Speech.speak).toHaveBeenCalledWith(
          NETWORK_TIMEOUT_MESSAGE,
          expect.any(Object)
        );
      });
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    test('3d. Camera permission rejection: provides audible prompt guiding user to system settings', async () => {
      ExpoCamera.__mockUseCameraPermissions.mockReturnValue([
        { granted: false, status: 'denied', canAskAgain: false },
        jest.fn(() => Promise.resolve({ granted: false, status: 'denied' })),
      ]);

      const { getByTestId } = render(<BookScannerScreen />);

      await waitFor(() => {
        expect(Speech.speak).toHaveBeenCalledWith(
          CAMERA_PERMISSION_DENIED_MESSAGE,
          expect.any(Object)
        );
      });

      expect(CAMERA_PERMISSION_DENIED_MESSAGE).toMatch(/system settings/i);
      expect(getByTestId('camera-status-text').props.children).toBe(
        CAMERA_PERMISSION_DENIED_MESSAGE
      );
    });

    test('3e. True sentence-level Pause & Resume: pausing preserves sentence index and resumes without restarting', () => {
      let lastSpeakOptions = null;
      Speech.speak.mockImplementation((_text, options) => {
        lastSpeakOptions = options;
      });

      const passage = 'Sentence one is here. Sentence two follows. Sentence three concludes.';

      // Start reading passage -> speaks Sentence 1
      act(() => {
        speakAudiobookPassage({ text: passage, targetLanguage: 'English' });
      });
      expect(Speech.speak).toHaveBeenLastCalledWith(
        'Sentence one is here.',
        expect.any(Object)
      );

      // Advance to Sentence 2 when Sentence 1 finishes
      act(() => {
        lastSpeakOptions.onDone();
      });
      expect(Speech.speak).toHaveBeenLastCalledWith(
        'Sentence two follows.',
        expect.any(Object)
      );

      // Pause while on Sentence 2
      act(() => {
        pauseSpeech();
      });
      expect(getSpeechPlaybackState().isPaused).toBe(true);
      expect(getSpeechPlaybackState().currentIndex).toBe(1);

      // Resume -> must speak Sentence 2 ('Sentence two follows.'), NOT restart at Sentence 1!
      act(() => {
        speakAudiobookPassage({
          text: passage,
          targetLanguage: 'English',
          resume: true,
        });
      });
      expect(Speech.speak).toHaveBeenLastCalledWith(
        'Sentence two follows.',
        expect.any(Object)
      );
    });
  });

  // =========================================================================
  // 4. ONBOARDING & GEMINI CAMERA AI (`OnboardingScreen.js`, `CameraAssistantScreen.js`)
  // =========================================================================
  describe('4. Onboarding & Gemini Camera AI Mode', () => {
    test('Onboarding speaks concise welcome prompt without technical jargon and navigates on double-tap', () => {
      const navigateMock = jest.fn();
      const onSelectModeMock = jest.fn();

      const { getByTestId } = render(
        <OnboardingScreen
          navigation={{ navigate: navigateMock }}
          onSelectMode={onSelectModeMock}
        />
      );

      expect(Speech.speak).toHaveBeenCalledWith(
        ONBOARDING_PROMPT,
        expect.any(Object)
      );
      expect(ONBOARDING_PROMPT).not.toMatch(/crnn|example/i);

      const optionA = getByTestId('onboarding-option-a');

      act(() => {
        fireEvent.press(optionA);
      });
      expect(onSelectModeMock).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(120);
        fireEvent.press(optionA);
      });
      expect(onSelectModeMock).toHaveBeenCalledWith('LOW_VISION');
    });

    test('CameraAssistantScreen describes what is in front of the user via Gemini Vision API', async () => {
      const mockDescription =
        'A wooden desk is at 12 oclock, about one meter ahead, with an open notebook.';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          description: mockDescription,
          used_live_llm: true,
        }),
      });

      const { getByTestId } = render(<CameraAssistantScreen />);
      const describeBtn = getByTestId('bar-btn-primary');

      await act(async () => {
        fireEvent.press(describeBtn);
        jest.advanceTimersByTime(100);
        fireEvent.press(describeBtn);
      });

      await waitFor(() => {
        expect(Speech.speak).toHaveBeenCalledWith(
          mockDescription,
          expect.any(Object)
        );
      });
      expect(getByTestId('camera-ai-description').props.children).toBe(
        mockDescription
      );
    });
  });
});
