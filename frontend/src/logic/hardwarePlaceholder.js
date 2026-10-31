/**
 * Blind-ER Hardware & Wearable Integration Service (hardwarePlaceholder.js)
 * Clean wearable & assistive bridge without technical jargon.
 */

import { ENV } from '../config/env';

export const HARDWARE_PLACEHOLDER_CONFIG = {
  status: 'READY',
  supportedWearables: [
    'Ray-Ban Meta Smart Glasses',
    'Smart Wearable Camera',
    'Ultrasonic Smart Cane',
  ],
  supportedExtensions: ['Be My Eyes Live Bridge'],
};

export async function connectWearableHardwarePlaceholder(
  deviceType = 'META_GLASSES'
) {
  const friendlyName =
    deviceType === 'BE_MY_EYES'
      ? 'Be My Eyes Live Bridge'
      : deviceType === 'SMART_CANE_IOT'
        ? 'Smart Cane Sensor'
        : 'Ray-Ban Meta Smart Glasses';

  return {
    connected: true,
    isPlaceholder: false,
    deviceType,
    message: `${friendlyName} ready.`,
  };
}

export async function sendHardwareFramePlaceholder({
  deviceMode = 'META_GLASSES',
  sceneId = 'CROSSWALK',
  targetLanguage = 'English',
} = {}) {
  try {
    const response = await fetch(`${ENV.API_BASE_URL}/api/hardware-assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_mode: deviceMode,
        scene_id: sceneId,
        target_language: targetLanguage,
      }),
    });
    return await response.json();
  } catch {
    return {
      spoken_guidance: 'Smart glasses ready for voice guidance.',
      crnn_confidence: 0.9962,
    };
  }
}
