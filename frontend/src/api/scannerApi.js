/**
 * Blind-ER Frontend API Service (CORE LOGIC - DO NOT EDIT FOR STYLING)
 * Communicates with the Python FastAPI backend for Stage 1 (CRNN) and Stage 2 (Gemini LLM).
 */

import { ENV } from '../config/env';

/**
 * Stage 1: Sends captured camera photo to `/api/extract-text` (CRNN endpoint).
 * @param {string} imageUri Local file URI from Expo Camera
 * @returns {Promise<{ raw_text: string, engine: string, confidence: number }>}
 */
export async function extractTextWithCrnn(imageUri) {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'book_page.jpg',
    type: 'image/jpeg',
  });

  const response = await fetch(`${ENV.API_BASE_URL}/api/extract-text`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`CRNN Extraction Error (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * Stage 2: Sends raw CRNN text to `/api/contextualize` (Gemini LLM Narrator & Translator).
 * @param {string} rawText Raw OCR output from Stage 1
 * @param {string} targetLanguage Target audiobook narration language
 * @returns {Promise<{ narrated_text: string, target_language: string, model: string }>}
 */
export async function contextualizeWithLlm(rawText, targetLanguage) {
  const response = await fetch(`${ENV.API_BASE_URL}/api/contextualize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      raw_text: rawText,
      target_language: targetLanguage,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM Contextualization Error (${response.status}): ${errText}`);
  }

  return response.json();
}

