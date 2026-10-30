/**
 * Blind-ER Screen 4: HardwareHubScreen.js
 * Wearable Hardware (Ray-Ban Meta Smart Glasses Real-Time POV Monitoring) &
 * Assistive App Extension Bridge ("Be My Eyes" Live AI + Volunteer Escalation).
 * Built using `FeatureLayoutTemplate.js` and `AccessibleTouchable.js`.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';
import { ENV } from '../../config/env';

const SCENES = [
  {
    id: 'CROSSWALK',
    title: 'Urban Crosswalk & Traffic Signal',
    hudTag: '🚸 WALK SIGNAL: 12 SEC • CURB 1.2M AT 12 O’CLOCK',
  },
  {
    id: 'PHARMACY',
    title: 'Prescription Medicine Bottle',
    hudTag: '💊 AMOXICILLIN 500MG • TAKE 1 EVERY 8 HOURS',
  },
  {
    id: 'BOOKSTORE',
    title: 'Hands-Free Book Reading via Meta Glasses',
    hudTag: '📖 CHAPTER IV: THE SILENT LIGHTHOUSE (CRNN 99.6%)',
  },
];

export default function HardwareHubScreen({ navigation }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [activeBridge, setActiveBridge] = useState('META_GLASSES');
  const [guidanceText, setGuidanceText] = useState(
    'Ray-Ban Meta Smart Glasses paired via Bluetooth LE (94% Battery). Double-tap "Meta Live" in the bottom bar for real-time POV monitoring, or double-tap "Be My Eyes" to bridge with a live visual assistant.'
  );
  const [continuousMode, setContinuousMode] = useState(false);

  const currentScene = SCENES[sceneIdx];

  useEffect(() => {
    speakAssistivePrompt(
      'Wearable Hardware and Be My Eyes Extension Hub. Ray-Ban Meta Smart Glasses connected. Bottom bar has Back, Meta Live, Be My Eyes, Next Scene, and More.'
    );
  }, []);

  const triggerHardwareAssist = async (mode) => {
    setActiveBridge(mode);
    const scene = SCENES[sceneIdx];
    speakAssistivePrompt(
      mode === 'BE_MY_EYES'
        ? `Connecting Be My Eyes extension bridge for ${scene.title}.`
        : `Streaming Ray-Ban Meta Glasses POV for ${scene.title}.`
    );

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/hardware-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_mode: mode,
          scene_id: scene.id,
          target_language: 'English',
        }),
      });
      const data = await response.json();
      if (data?.spoken_guidance) {
        setGuidanceText(data.spoken_guidance);
        speakAssistivePrompt(data.spoken_guidance);
      }
    } catch {
      const fallback =
        mode === 'BE_MY_EYES'
          ? `Be My Eyes Extension Bridge Active: Sharing your Meta Glasses live stream and CRNN text scan for ${scene.title}.`
          : `Meta Glasses Bone-Conduction Audio: ${scene.hudTag}. Path ahead monitored.`;
      setGuidanceText(fallback);
      speakAssistivePrompt(fallback);
    }
  };

  const handleNextScene = () => {
    const next = (sceneIdx + 1) % SCENES.length;
    setSceneIdx(next);
    const nextScene = SCENES[next];
    const msg = `Switched hardware simulation scene to ${nextScene.title}. Double tap Meta Live or Be My Eyes to analyze.`;
    setGuidanceText(msg);
    speakAssistivePrompt(msg);
  };

  const toggleContinuousMonitoring = () => {
    setContinuousMode((prev) => {
      const nextState = !prev;
      speakAssistivePrompt(
        nextState
          ? 'Real-time continuous Meta Glasses monitoring enabled.'
          : 'Continuous monitoring paused.'
      );
      return nextState;
    });
  };

  return (
    <FeatureLayoutTemplate
      featureTitle="Meta Glasses and Be My Eyes Hub"
      onBack={() =>
        navigation?.goBack ? navigation.goBack() : navigation?.navigate?.('Home')
      }
      primaryAction={{
        label: 'Meta Live',
        icon: '🕶️',
        hint: 'Double tap to stream real-time Ray-Ban Meta Glasses POV monitoring.',
        onDoubleTap: () => triggerHardwareAssist('META_GLASSES'),
      }}
      secondaryAction={{
        label: 'Be My Eyes',
        icon: '🤝',
        hint: 'Double tap to connect the Be My Eyes assistive app extension bridge.',
        onDoubleTap: () => triggerHardwareAssist('BE_MY_EYES'),
      }}
      nextLabel="Scene"
      nextHint="Double tap to switch the simulated hardware camera environment."
      onNext={handleNextScene}
      overflowActions={[
        {
          label: continuousMode
            ? 'Pause Continuous Stream'
            : 'Enable Continuous Stream',
          onExecute: toggleContinuousMonitoring,
        },
      ]}
    >
      <View style={styles.heroWrapper}>
        {/* Ray-Ban Meta Smart Glasses Live HUD Card */}
        <AccessibleTouchable
          label={`Ray-Ban Meta Smart Glasses HUD. Current scene: ${currentScene.title}. ${currentScene.hudTag}`}
          ttsHint="Double tap to trigger real-time Meta Glasses spatial audio guidance."
          onDoubleTap={() => triggerHardwareAssist('META_GLASSES')}
          style={styles.glassesHudCard}
        >
          <View style={styles.hudTopRow}>
            <Text style={styles.hudEyebrow}>
              🕶️ RAY-BAN META SMART GLASSES • BLE 94%
            </Text>
            <Text style={styles.liveStreamBadge}>
              {continuousMode ? '● AUTO-MONITOR' : '● 12ms HUD'}
            </Text>
          </View>
          <Text style={styles.sceneTitleText}>{currentScene.title}</Text>
          <Text style={styles.hudTelemetryText}>{currentScene.hudTag}</Text>
        </AccessibleTouchable>

        {/* Be My Eyes & Live Assistive Output Card */}
        <View style={styles.bridgeOutputCard}>
          <View style={styles.hudTopRow}>
            <Text style={styles.bridgeHeading}>
              {activeBridge === 'BE_MY_EYES'
                ? '🤝 BE MY EYES EXTENSION BRIDGE'
                : '🔊 BONE-CONDUCTION SPATIAL AUDIO'}
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.guidanceBodyText}>{guidanceText}</Text>
          </ScrollView>
        </View>
      </View>
    </FeatureLayoutTemplate>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    flex: 1,
    gap: 16,
  },
  glassesHudCard: {
    flex: 4.5,
    width: '100%',
    backgroundColor: '#1D1D1F',
    borderWidth: 3,
    borderColor: '#FFD600',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  hudTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hudEyebrow: {
    color: '#FFD600',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  liveStreamBadge: {
    backgroundColor: '#FFD600',
    color: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '600',
  },
  sceneTitleText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 8,
  },
  hudTelemetryText: {
    color: '#F5F5F7',
    fontSize: 16,
    fontWeight: '600',
  },
  bridgeOutputCard: {
    flex: 5.5,
    width: '100%',
    backgroundColor: '#1D1D1F',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    padding: 20,
  },
  bridgeHeading: {
    color: '#6086BD',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.9,
  },
  guidanceBodyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 34,
  },
});
