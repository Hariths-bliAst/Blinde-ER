/**
 * Blind-ER Hardware & Extension Integration Placeholder (hardwarePlaceholder.js)
 * -----------------------------------------------------------------------------
 * Provides clean, modular integration hooks for connecting external wearable
 * hardware (e.g., Ray-Ban Meta Smart Glasses, ESP32-CAM, Ultrasonic Smart Cane,
 * Refreshable Braille Display) and third-party assistive app extensions
 * (e.g., Be My Eyes) without cluttering the core mobile UI.
 */

import { ENV } from '../config/env';

export const HARDWARE_PLACEHOLDER_CONFIG = {
  status: 'PLACEHOLDER_READY',
  supportedWearables: [
    'Ray-Ban Meta Smart Glasses (BLE / Meta Wearables DAT SDK)',
    'ESP32-CAM / Raspberry Pi Zero Wearable Stream (Wi-Fi WebSocket)',
    'Bluetooth LE Ultrasonic Smart Cane (Haptic Obstacle Alerts)',
  ],
  supportedExtensions: [
    'Be My Eyes Assistive App Extension (Deep-Link + CRNN Telemetry)',
  ],
};

/**
 * [HARDWARE INTEGRATION PLACEHOLDER 1]: Connect Wearable Hardware via BLE / SDK
 * Replace the body of this function with your hardware vendor SDK initialization
 * (e.g., Meta Wearables DAT SDK, react-native-ble-plx, or WebSocket camera URL).
 */
export async function connectWearableHardwarePlaceholder(deviceType = 'META_GLASSES') {
  // TODO: [HARDWARE_SDK_HOOK] Plug in real Bluetooth LE / Wi-Fi wearable pairing here
  return {
    connected: false,
    isPlaceholder: true,
    deviceType,
    message: `[Hardware Placeholder]: ${deviceType} SDK slot ready. Connect physical BLE/RTSP stream in hardwarePlaceholder.js.`,
  };
}

/**
 * [HARDWARE INTEGRATION PLACEHOLDER 2]: Capture POV Frame from External Wearable
 * When physical hardware is paired, pass its JPEG/Base64 frame bytes to `/api/hardware-assist`.
 */
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
      spoken_guidance:
        '[Hardware Placeholder Active]: External wearable stream slot is ready for SDK integration.',
      crnn_confidence: 0.9962,
    };
  }
}
