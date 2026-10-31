/**
 * Blind-ER Frontend API Service
 * Hardened with strict 8-second network timeout (`FETCH_TIMEOUT_MS = 8000`)
 * for Book Scanning, Gemini Vision Camera Mode, and AI Voice Command routing.
 */

import { ENV } from '../config/env';

export const FETCH_TIMEOUT_MS = 8000;

/**
 * Executes `fetch` with a strict 8-second timeout using both AbortController
 * and a timer race so hung connections terminate deterministically.
 */
export async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = FETCH_TIMEOUT_MS
) {
  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId = null;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (controller) {
        try {
          controller.abort();
        } catch {
          // Ignore abort errors
        }
      }
      const timeoutError = new Error('Network request timed out after 8 seconds.');
      timeoutError.code = 'ETIMEDOUT';
      reject(timeoutError);
    }, timeoutMs);
  });

  try {
    const fetchPromise = fetch(url, {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
    });
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      const abortErr = new Error('Network request timed out after 8 seconds.');
      abortErr.code = 'ETIMEDOUT';
      throw abortErr;
    }
    throw error;
  }
}

/**
 * Stage 1: Sends captured camera photo to `/api/extract-text`.
 */
export async function extractTextWithCrnn(imageUri) {
  if (!imageUri || imageUri.startsWith('mock://')) {
    const demoRes = await fetchWithTimeout(`${ENV.API_BASE_URL}/api/demo-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        target_language: 'English',
        sample_text: 'Silent Light.',
      }),
    });
    if (!demoRes.ok) {
      const errText = await demoRes.text();
      throw new Error(`Text Scan Error (${demoRes.status}): ${errText}`);
    }
    const data = await demoRes.json();
    return {
      raw_text: data?.raw_text ?? '',
      engine: data?.crnn_engine,
      confidence: data?.crnn_confidence,
    };
  }

  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'book_page.jpg',
    type: 'image/jpeg',
  });

  const response = await fetchWithTimeout(
    `${ENV.API_BASE_URL}/api/extract-text`,
    {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Text Extraction Error (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * Stage 2: Sends extracted text to `/api/contextualize` for narration and translation.
 */
export async function contextualizeWithLlm(rawText, targetLanguage) {
  const response = await fetchWithTimeout(
    `${ENV.API_BASE_URL}/api/contextualize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        raw_text: rawText,
        target_language: targetLanguage,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Narration Service Error (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * Camera AI Mode: Sends a camera frame to `/api/describe-scene` (Gemini Vision)
 * to describe what is in front of the user.
 */
export async function describeSceneWithGemini(
  imageUri,
  question = '',
  targetLanguage = 'English'
) {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri || 'mock://scene-frame.jpg',
    name: 'scene.jpg',
    type: 'image/jpeg',
  });
  formData.append('question', question);
  formData.append('target_language', targetLanguage);

  const response = await fetchWithTimeout(
    `${ENV.API_BASE_URL}/api/describe-scene`,
    {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Scene Description Error (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * AI Voice Mode: Routes a spoken user command via `/api/voice-command` (Gemini).
 */
export async function sendVoiceCommandToGemini(
  transcript,
  screen = 'home',
  targetLanguage = 'English'
) {
  const response = await fetchWithTimeout(
    `${ENV.API_BASE_URL}/api/voice-command`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        transcript,
        screen,
        target_language: targetLanguage,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voice Command Error (${response.status}): ${errText}`);
  }

  return response.json();
}
