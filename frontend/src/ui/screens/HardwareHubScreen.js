/**
 * Blind-ER Screen 8: HardwareHubScreen.js
 * Clean Smart Glasses & Assistive Wearables Hub without cluttered technical jargon.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';
import {
  connectWearableHardwarePlaceholder,
  sendHardwareFramePlaceholder,
} from '../../logic/hardwarePlaceholder';

const WEARABLE_MODES = [
  {
    id: 'META_GLASSES',
    slotBadge: 'SMART GLASSES • LIVE AUDIO',
    title: 'Ray-Ban Meta Smart Glasses',
    subtitle: 'Hands-free camera and spatial bone-conduction voice guidance',
    sceneId: 'CROSSWALK',
  },
  {
    id: 'BE_MY_EYES',
    slotBadge: 'LIVE ASSISTANCE • VIDEO BRIDGE',
    title: 'Be My Eyes Live Bridge',
    subtitle: 'Instant visual assistance with volunteer and AI voice support',
    sceneId: 'PHARMACY',
  },
  {
    id: 'SMART_CANE_IOT',
    slotBadge: 'MOBILITY SENSOR • HAPTIC CUE',
    title: 'Smart Cane Sensor',
    subtitle: 'Obstacle distance alerts and hands-free reading guidance',
    sceneId: 'BOOKSTORE',
  },
];

export default function HardwareHubScreen({ navigation }) {
  const [slotIdx, setSlotIdx] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    'Ready. Double-tap Scan View to hear live environmental guidance.'
  );

  const currentSlot = WEARABLE_MODES[slotIdx];

  useEffect(() => {
    speakAssistivePrompt('Smart Glasses and Wearables.');
  }, []);

  const handlePairDevice = async () => {
    const res = await connectWearableHardwarePlaceholder(currentSlot.id);
    setStatusMessage(res.message);
    speakAssistivePrompt(res.message);
  };

  const handleScanEnvironment = async () => {
    const data = await sendHardwareFramePlaceholder({
      deviceMode:
        currentSlot.id === 'BE_MY_EYES' ? 'BE_MY_EYES' : 'META_GLASSES',
      sceneId: currentSlot.sceneId,
      targetLanguage: 'English',
    });
    setStatusMessage(data.spoken_guidance);
    speakAssistivePrompt(data.spoken_guidance);
  };

  const handleNextDevice = () => {
    const next = (slotIdx + 1) % WEARABLE_MODES.length;
    setSlotIdx(next);
    const nextSlot = WEARABLE_MODES[next];
    setStatusMessage(`${nextSlot.title} selected.`);
    speakAssistivePrompt(nextSlot.title);
  };

  return (
    <FeatureLayoutTemplate
      featureTitle="Smart Wearables"
      onBack={() => navigation?.navigate?.('MoreHub')}
      primaryAction={{
        label: 'Connect',
        icon: '🔌',
        hint: 'Double tap to connect.',
        onDoubleTap: handlePairDevice,
      }}
      secondaryAction={{
        label: 'Scan View',
        icon: '🕶️',
        hint: 'Double tap to describe view.',
        onDoubleTap: handleScanEnvironment,
      }}
      nextLabel="Switch"
      nextHint="Double tap for next device."
      onNext={handleNextDevice}
    >
      <View style={styles.wrapper}>
        <AccessibleTouchable
          label={currentSlot.title}
          ttsHint="Double tap to describe view."
          onDoubleTap={handleScanEnvironment}
          style={styles.placeholderSlotCard}
        >
          <Text style={styles.slotEyebrow}>{currentSlot.slotBadge}</Text>
          <Text style={styles.slotTitle}>{currentSlot.title}</Text>
          <Text style={styles.slotSubtitle}>{currentSlot.subtitle}</Text>
        </AccessibleTouchable>

        <View style={styles.outputCard}>
          <Text style={styles.outputEyebrow}>VOICE ASSISTANT GUIDANCE</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.outputBody}>{statusMessage}</Text>
          </ScrollView>
        </View>
      </View>
    </FeatureLayoutTemplate>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 14,
  },
  placeholderSlotCard: {
    flex: 4.6,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 2,
    borderColor: '#F5C518',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotEyebrow: {
    color: '#F5C518',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  slotTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 8,
  },
  slotSubtitle: {
    color: '#D1D1D6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  outputCard: {
    flex: 5.4,
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 1.5,
    borderColor: '#26262A',
    borderRadius: 22,
    padding: 18,
  },
  outputEyebrow: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  outputBody: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 27,
  },
});
