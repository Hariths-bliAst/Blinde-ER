/**
 * Blind-ER Frontend Environment Configuration
 * SECURITY MANDATE: Reads public API endpoints strictly from .env variables.
 */

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8000',
  DEFAULT_SPEECH_LOCALE: process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE || 'en-US',
  DEFAULT_TARGET_LANGUAGE:
    process.env.EXPO_PUBLIC_DEFAULT_TARGET_LANGUAGE || 'English',
};

