"""
Blind-ER — Stage 2: Gemini LLM Contextualizer & Literary Translator Service
SECURITY MANDATE: Uses `settings.GEMINI_API_KEY` loaded strictly from `.env`.
"""

from typing import Dict, Any
from google import genai
from google.genai import types
from config.settings import settings

# Phase 3 Mandate: Robust System Prompt for the Audiobook Narrator & Translator
NARRATOR_SYSTEM_PROMPT = (
    "Act as a professional audiobook narrator and translator. Take this raw, "
    "potentially flawed OCR text, fix structural errors, and translate it "
    "smoothly into the target language while preserving the emotional tone, "
    "genre style, and context. "
    "Strip out stray page numbers, running headers, and broken hyphenations so "
    "the output reads naturally when spoken aloud by a Text-to-Speech engine. "
    "Return ONLY the final spoken narration text without markdown commentary."
)


def contextualize_and_translate_text(
    raw_ocr_text: str,
    target_language: str = "English",
) -> Dict[str, Any]:
    """
    Sends raw CRNN OCR output to the Gemini API to repair structural OCR flaws
    and translate/adapt it into expressive audiobook prose in `target_language`.
    """
    api_key = settings.GEMINI_API_KEY

    # Graceful fallback if the developer has not yet inserted their real Gemini API key
    if not api_key or api_key == "your_gemini_api_key_here":
        fallback_narration = (
            "Chapter Four: The Silent Lighthouse. "
            "The wind howled across the jagged cliffs of Northumberland, carrying "
            "with it the bitter scent of salt and an approaching storm. Elara "
            "clutched her weathered lantern tighter. \"Someone left the beacon "
            "burning,\" she whispered into the darkness, her voice trembling yet "
            "resolute. Below her, the sea crashed like an ancient drum, summoning "
            "the lost ships home."
        )
        return {
            "narrated_text": fallback_narration,
            "target_language": target_language,
            "model": "offline-demo-fallback (set GEMINI_API_KEY in backend/.env for live LLM)",
            "used_live_llm": False,
        }

    client = genai.Client(api_key=api_key)
    user_prompt = (
        f"Target Language: {target_language}\n\n"
        f"Raw OCR Book Page Text:\n{raw_ocr_text}"
    )

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL_NAME,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=NARRATOR_SYSTEM_PROMPT,
            temperature=0.4,
        ),
    )

    narrated_text = (response.text or "").strip()
    return {
        "narrated_text": narrated_text,
        "target_language": target_language,
        "model": settings.GEMINI_MODEL_NAME,
        "used_live_llm": True,
    }

