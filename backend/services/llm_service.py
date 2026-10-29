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

FALLBACK_NARRATIONS = {
    "English": (
        "Chapter Four: The Silent Lighthouse. "
        "The wind howled across the jagged cliffs of Northumberland, carrying "
        "with it the bitter scent of salt and an approaching storm. Elara "
        "clutched her weathered lantern tighter. \"Someone left the beacon "
        "burning,\" she whispered into the darkness, her voice trembling yet "
        "resolute. Below her, the sea crashed like an ancient drum, summoning "
        "the lost ships home."
    ),
    "Spanish": (
        "Capítulo Cuatro: El Faro Silencioso. "
        "El viento aullaba sobre los acantilados escarpados de Northumberland, "
        "trayendo consigo el aroma amargo de la sal y de una tormenta inminente. "
        "Elara apretó con más fuerza su linterna desgastada. \"Alguien dejó el "
        "faro encendido\", susurró en la oscuridad, con voz temblorosa pero "
        "firme. Debajo de ella, el mar rompía como un tambor ancestral llamando "
        "a los barcos perdidos a casa."
    ),
    "French": (
        "Chapitre Quatre : Le Phare Silencieux. "
        "Le vent hurlait sur les falaises déchiquetées du Northumberland, "
        "portant l'odeur amère du sel et de la tempête qui approchait. Elara "
        "serra plus fort sa lanterne patinée. « Quelqu'un a laissé le fanal "
        "allumé », murmura-t-elle dans l'obscurité, la voix tremblante mais "
        "résolue. En contrebas, la mer se fracassait comme un tambour ancien."
    ),
    "Malay": (
        "Bab Empat: Rumah Api yang Sepi. "
        "Angin menderu merentasi tebing curam Northumberland, membawa bersama "
        "bau masin laut dan ribut yang semakin hampir. Elara menggenggam erat "
        "lentera usangnya. \"Seseorang telah membiarkan suar itu menyala,\" "
        "bisiknya ke dalam kegelapan dengan suara yang gementar namun nekad. Di "
        "bawahnya, ombak menghempas bagaikan gendang purba yang memanggil pulang "
        "kapal-kapal yang sesat."
    ),
    "Mandarin": (
        "第四章：寂静的灯塔。狂风呼啸着掠过诺森伯兰崎岖的悬崖，裹挟着苦涩的海盐气息与即将来临的暴风雨。"
        "艾拉紧紧握住她那盏饱经风霜的提灯。“有人让灯塔一直亮着，”她在黑暗中低语，声音颤抖却无比坚定。"
        "在她脚下，大海如同古老的战鼓般轰鸣，呼唤着迷途的船只归航。"
    ),
}


def contextualize_and_translate_text(
    raw_ocr_text: str,
    target_language: str = "English",
) -> Dict[str, Any]:
    """
    Sends raw CRNN OCR output to the Gemini API to repair structural OCR flaws
    and translate/adapt it into expressive audiobook prose in `target_language`.
    """
    api_key = settings.GEMINI_API_KEY
    fallback_text = FALLBACK_NARRATIONS.get(
        target_language, FALLBACK_NARRATIONS["English"]
    )

    if not api_key or api_key == "your_gemini_api_key_here":
        return {
            "narrated_text": fallback_text,
            "target_language": target_language,
            "model": "offline-demo-fallback",
            "used_live_llm": False,
        }

    user_prompt = (
        f"Target Language: {target_language}\n\n"
        f"Raw OCR Book Page Text:\n{raw_ocr_text}"
    )

    try:
        # Connect directly to Google AI Studio Free Tier (Generativelanguage API)
        client = genai.Client(api_key=api_key)
        candidate_models = [
            settings.GEMINI_MODEL_NAME,
            "gemini-3-flash-preview",
            "gemini-3.1-flash-lite-preview",
            "gemma-4-26b-a4b-it",
        ]
        # Deduplicate while preserving order
        models_to_try = list(dict.fromkeys(candidate_models))

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=NARRATOR_SYSTEM_PROMPT,
                        temperature=0.4,
                    ),
                )
                narrated_text = (response.text or "").strip()
                if narrated_text:
                    return {
                        "narrated_text": narrated_text,
                        "target_language": target_language,
                        "model": model_name,
                        "used_live_llm": True,
                    }
            except Exception:
                continue
    except Exception as exc:
        # Graceful fallback so live competition demos never fail on network/key issues
        return {
            "narrated_text": fallback_text,
            "target_language": target_language,
            "model": f"resilient-fallback ({type(exc).__name__})",
            "used_live_llm": False,
        }

    return {
        "narrated_text": fallback_text,
        "target_language": target_language,
        "model": "resilient-fallback",
        "used_live_llm": False,
    }
