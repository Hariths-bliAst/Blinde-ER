/**
 * Blind-ER Screen: CameraAssistantScreen.js
 * Gemini-Powered Camera AI Mode & Voice Assistant:
 *   - Uses the phone camera to describe what is in front of the user via `/api/describe-scene`
 *   - Supports voice-guided questions and reading visible signs/text aloud
 *   - Handles camera permission rejection and 8-second network timeouts safely
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable from '../components/AccessibleTouchable';
import { describeSceneWithGemini } from '../../api/scannerApi';
import { announceStateForAccessibility, stopSpeech } from '../../logic/ttsService';
import {
  CAMERA_PERMISSION_DENIED_MESSAGE,
  NETWORK_TIMEOUT_MESSAGE,
} from '../../logic/useScannerController';

export default function CameraAssistantScreen({ navigation }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [status, setStatus] = useState('READY');
  const [descriptionText, setDescriptionText] = useState(
    'Point your phone camera ahead and double-tap Describe.'
  );
  const cameraRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      if (cameraPermission && cameraPermission.granted === false) {
        const perm = requestCameraPermission
          ? await requestCameraPermission()
          : cameraPermission;
        if (!perm?.granted && mounted) {
          setStatus('PERMISSION_DENIED');
          setDescriptionText(CAMERA_PERMISSION_DENIED_MESSAGE);
          announceStateForAccessibility(CAMERA_PERMISSION_DENIED_MESSAGE);
          return;
        }
      }
      if (mounted) {
        announceStateForAccessibility('Camera AI ready.');
      }
    }
    initCamera();
    return () => {
      mounted = false;
      stopSpeech();
    };
  }, []);

  const handleDescribeScene = useCallback(
    async (question = '') => {
      if (status === 'LOOKING') return;

      if (cameraPermission && cameraPermission.granted === false) {
        setStatus('PERMISSION_DENIED');
        setDescriptionText(CAMERA_PERMISSION_DENIED_MESSAGE);
        await announceStateForAccessibility(CAMERA_PERMISSION_DENIED_MESSAGE);
        return;
      }

      try {
        stopSpeech();
        setStatus('LOOKING');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
          () => {}
        );

        let imageUri = 'mock://scene-frame.jpg';
        if (cameraRef.current && cameraPermission?.granted) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.8,
            });
            if (photo?.uri) imageUri = photo.uri;
          } catch {
            // Fallback in simulator
          }
        }

        const result = await describeSceneWithGemini(
          imageUri,
          question,
          'English'
        );
        const desc =
          typeof result?.description === 'string' && result.description.trim()
            ? result.description.trim()
            : 'I could not see anything clearly. Try again.';

        setDescriptionText(desc);
        setStatus('DONE');
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
        await announceStateForAccessibility(desc);
      } catch (error) {
        setStatus('ERROR');
        const isTimeout =
          error?.code === 'ETIMEDOUT' ||
          /timed?\s*out/i.test(error?.message || '');
        const msg = isTimeout
          ? NETWORK_TIMEOUT_MESSAGE
          : 'Could not describe scene. Please try again.';
        setDescriptionText(msg);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        await announceStateForAccessibility(msg);
      }
    },
    [cameraPermission, status]
  );

  const isPermissionDenied =
    cameraPermission && cameraPermission.granted === false;

  return (
    <FeatureLayoutTemplate
      featureTitle="Camera AI Assistant"
      onBack={() =>
        navigation?.goBack ? navigation.goBack() : navigation?.navigate?.('Home')
      }
      primaryAction={{
        label: 'Describe',
        icon: '👁',
        hint: 'Double tap to describe what is in front of you.',
        confirmSpeech: 'Looking.',
        onDoubleTap: () => handleDescribeScene(''),
      }}
      secondaryAction={{
        label: 'Read Signs',
        icon: 'Aa',
        hint: 'Double tap to read visible signs and labels.',
        confirmSpeech: 'Reading signs.',
        onDoubleTap: () =>
          handleDescribeScene(
            'Read out all visible text, signs, or labels in front of me.'
          ),
      }}
      nextLabel="Repeat"
      nextHint="Double tap to repeat description."
      onNext={() => announceStateForAccessibility(descriptionText)}
    >
      <View style={styles.heroWrapper}>
        <AccessibleTouchable
          testID="camera-ai-viewfinder"
          label={
            isPermissionDenied
              ? CAMERA_PERMISSION_DENIED_MESSAGE
              : 'Camera AI Viewfinder'
          }
          ttsHint="Double tap to describe what is in front of you."
          onDoubleTap={() => handleDescribeScene('')}
          style={styles.cameraContainer}
        >
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraFeed}
              facing="back"
              autofocus="on"
            />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraBadge}>GEMINI VISION ASSISTANT</Text>
              <Text style={styles.cameraStatusText}>
                {isPermissionDenied
                  ? CAMERA_PERMISSION_DENIED_MESSAGE
                  : 'Double-tap Describe to analyze surroundings'}
              </Text>
            </View>
          )}
        </AccessibleTouchable>

        <View style={styles.textOverlayCard}>
          <View style={styles.overlayHeaderRow}>
            <Text style={styles.overlayLabel}>AI SCENE DESCRIPTION</Text>
            <Text testID="camera-ai-state-pill" style={styles.statePill}>
              {status}
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text testID="camera-ai-description" style={styles.largeReaderText}>
              {descriptionText}
            </Text>
          </ScrollView>
        </View>
      </View>
    </FeatureLayoutTemplate>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    flex: 1,
    gap: 14,
  },
  cameraContainer: {
    flex: 4.2,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 2,
    borderColor: '#B26BFF',
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFeed: {
    flex: 1,
    width: '100%',
  },
  cameraFallback: {
    padding: 20,
    alignItems: 'center',
  },
  cameraBadge: {
    color: '#F5C518',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.0,
    marginBottom: 8,
  },
  cameraStatusText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  textOverlayCard: {
    flex: 5.8,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 1.5,
    borderColor: '#26262A',
    borderRadius: 22,
    padding: 18,
  },
  overlayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overlayLabel: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statePill: {
    color: '#000000',
    backgroundColor: '#F5C518',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
  },
  largeReaderText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 32,
  },
});

