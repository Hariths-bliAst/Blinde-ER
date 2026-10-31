/**
 * Blind-ER Screen 8: HardwareHubScreen.js
 * Clean Hardware & Assistive Extension Integration Placeholder Screen
 * Accessed via `More -> Extensions`.
 * Provides modular placeholder slots for:
 *   1. [HARDWARE PLACEHOLDER 1]: Ray-Ban Meta Smart Glasses (BLE / Meta DAT SDK)
 *   2. [HARDWARE PLACEHOLDER 2]: External Wearable Camera / Ultrasonic Smart Cane (RTSP / WebSocket)
 *   3. [EXTENSION PLACEHOLDER 3]: Be My Eyes Assistive App Extension Bridge
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

const PLACEHOLDER_SLOTS = [
  {
    id: 'META_GLASSES',
    slotBadge: 'HARDWARE PLACEHOLDER 01 • BLE / SDK SLOT',
    title: 'Ray-Ban Meta Smart Glasses',
    subtitle: 'Placeholder for Meta Wearables DAT SDK (POV Camera + Bone-Conduction Audio)',
    sceneId: 'CROSSWALK',
  },
  {
    id: 'BE_MY_EYES',
    slotBadge: 'EXTENSION PLACEHOLDER 02 • APP BRIDGE SLOT',
    title: 'Be My Eyes App Extension',
    subtitle: 'Placeholder for Volunteer Video Bridge + CRNN OCR Telemetry Handoff',
    sceneId: 'PHARMACY',
  },
  {
    id: 'SMART_CANE_IOT',
    slotBadge: 'HARDWARE PLACEHOLDER 03 • BLE SENSOR SLOT',
    title: 'Ultrasonic Smart Cane & ESP32-CAM',
    subtitle: 'Placeholder for External BLE Obstacle Sensor & RTSP Wearable Stream',
    sceneId: 'BOOKSTORE',
  },
];

export default function HardwareHubScreen({ navigation }) {
  const [slotIdx, setSlotIdx] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    '[Hardware Integration Placeholder]: Select a hardware or app extension slot above. Double-tap "Test Hook" to run a simulated payload through POST /api/hardware-assist, or wire your physical SDK in src/logic/hardwarePlaceholder.js.'
  );

  const currentSlot = PLACEHOLDER_SLOTS[slotIdx];

  useEffect(() => {
    speakAssistivePrompt(
      'Hardware and Extension Integration Placeholder opened. Slot 1: Ray-Ban Meta Smart Glasses SDK Placeholder.'
    );
  }, []);

  const handlePairPlaceholder = async () => {
    const res = await connectWearableHardwarePlaceholder(currentSlot.id);
    setStatusMessage(res.message);
    speakAssistivePrompt(res.message);
  };

  const handleTestPlaceholderHook = async () => {
    speakAssistivePrompt(`Testing placeholder hook for ${currentSlot.title}.`);
    const data = await sendHardwareFramePlaceholder({
      deviceMode: currentSlot.id === 'BE_MY_EYES' ? 'BE_MY_EYES' : 'META_GLASSES',
      sceneId: currentSlot.sceneId,
      targetLanguage: 'English',
    });
    const out = `[Placeholder Test Output — ${currentSlot.title}]: ${data.spoken_guidance}`;
    setStatusMessage(out);
    speakAssistivePrompt(data.spoken_guidance);
  };

  const handleNextSlot = () => {
    const next = (slotIdx + 1) % PLACEHOLDER_SLOTS.length;
    setSlotIdx(next);
    const nextSlot = PLACEHOLDER_SLOTS[next];
    const msg = `Switched to ${nextSlot.slotBadge}: ${nextSlot.title}.`;
    setStatusMessage(msg);
    speakAssistivePrompt(msg);
  };

  return (
    <FeatureLayoutTemplate
      featureTitle="Hardware and Extension Integration Placeholder"
      onBack={() => navigation?.navigate?.('MoreHub')}
      primaryAction={{
        label: 'Pair SDK',
        icon: '🔌',
        hint: 'Tap again to check the hardware SDK placeholder connection.',
        onDoubleTap: handlePairPlaceholder,
      }}
      secondaryAction={{
        label: 'Test Hook',
        icon: '⚡',
        hint: 'Tap again to send a test frame from this placeholder slot to the backend.',
        onDoubleTap: handleTestPlaceholderHook,
      }}
      nextLabel="Next Slot"
      nextHint="Tap again to cycle through hardware and extension placeholder slots."
      onNext={handleNextSlot}
    >
      <View style={styles.wrapper}>
        {/* Hardware / Extension Placeholder Slot Card */}
        <AccessibleTouchable
          label={`${currentSlot.slotBadge}. ${currentSlot.title}. ${currentSlot.subtitle}`}
          ttsHint="Tap again to test this hardware integration placeholder."
          onDoubleTap={handleTestPlaceholderHook}
          style={styles.placeholderSlotCard}
        >
          <Text style={styles.slotEyebrow}>{currentSlot.slotBadge}</Text>
          <Text style={styles.slotTitle}>{currentSlot.title}</Text>
          <Text style={styles.slotSubtitle}>{currentSlot.subtitle}</Text>
        </AccessibleTouchable>

        {/* SDK Hook Output & Developer Instructions Card */}
        <View style={styles.outputCard}>
          <Text style={styles.outputEyebrow}>
            🛠️ SDK INTEGRATION HOOK (src/logic/hardwarePlaceholder.js)
          </Text>
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
    borderStyle: 'dashed',
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
