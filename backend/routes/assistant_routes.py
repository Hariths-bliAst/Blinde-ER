"""
Blind-ER — AI Assistant Router (Gemini)
Endpoints:
  1. POST /api/describe-scene  (Camera Mode: Gemini vision describes what is in front of the user)
  2. POST /api/voice-command   (AI Mode: maps a spoken sentence to an app action + short reply)

Both endpoints are plain `def` so FastAPI runs the blocking Gemini SDK calls in a
thread pool instead of stalling the event loop.
"""

import json
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from config.settings import settings

router = APIRouter(prefix="/api", tags=["Blind-ER AI Assistant"])

MAX_IMAGE_BYTES = 8 * 1024 * 1024

SCENE_SYSTEM_PROMPT = (
    "You are Blind-ER, an AI visual assistant specifically built for a user who is completely blind "
    "or severely visually impaired. The user CANNOT see the screen or their physical surroundings and "
    "relies 100% on your clear, calm, spatially-accurate spoken guidance.\n"
    "CRITICAL ACCESSIBILITY RULES:\n"
    "1. SAFETY HAZARDS FIRST: Immediately warn about physical obstacles, ground drop-offs, stairs, curbs, "
    "moving traffic, sharp/hot items, or overhead obstructions. If the path is clear, state it clearly.\n"
    "2. CLOCK-FACE DIRECTIONS: Describe all object locations relative to the user's body: "
    "'At your 12 o'clock, about one meter ahead...', 'To your left at 9 o'clock...'.\n"
    "3. HEIGHT & ELEVATION: Specify physical heights: 'On the floor at your feet', 'At waist height on the desk'.\n"
    "4. STRICTLY ZERO VISUAL JARGON: NEVER say 'Look here', 'As you can see', 'In the photo', or 'Click this'.\n"
    "5. EXACT TEXT READOUT: Read any important visible text (street signs, warning labels, book titles, dosage numbers).\n"
    "6. CONCISE: 2 to 4 calm, high-signal sentences. No markdown, no bullet points, no emojis."
)

VOICE_ACTIONS = [
    "home", "back", "scanner", "capture", "read_now", "cancel_read",
    "resume_current", "reread_last", "restart_page", "next_page",
    "read", "pause", "resume", "stop", "library", "play_book", "next_book",
    "previous_book", "games", "settings", "camera", "describe",
    "volume_up", "volume_down", "language", "help", "repeat", "ai_mode_off", "answer",
]

VOICE_SYSTEM_PROMPT = (
    "You route voice commands for Blind-ER, an audio-first accessibility app for blind users. "
    "The user navigates exclusively through auditory and tactile cues.\n"
    "App Screens:\n"
    "- 'home': Main menu\n"
    "- 'scanner': Book page camera scanner\n"
    "- 'library': Audiobook player\n"
    "- 'camera': Real-time surroundings describer ('What is in front of me?')\n"
    "- 'games': Pitch & auditory training games\n"
    "- 'settings': Speech speed, volume, and language\n"
    f"Allowed actions: {', '.join(VOICE_ACTIONS)}.\n"
    "RULES FOR BLIND ACCESSIBILITY:\n"
    "1. If the user asks whether to start reading after a scan ('yes', 'read', 'start reading', 'read now'), use 'read_now'.\n"
    "2. If the user declines reading ('no', 'cancel', 'don\\'t read'), use 'cancel_read'.\n"
    "3. When paused, if the user asks to continue ('resume', 'continue', 'keep going'), use 'resume_current'.\n"
    "4. When paused, if the user asks to reread or replay ('reread', 'replay last sentence', 'repeat that sentence'), use 'reread_last'.\n"
    "5. When paused, if the user asks to restart ('from the start', 'beginning of page', 'restart'), use 'restart_page'.\n"
    "6. If the user asks what is in front of them or asks to see their surroundings, use 'describe' with their query in 'question'.\n"
    "7. For general questions not related to app actions, use 'answer' with a calm, friendly, maximum 2-sentence spoken answer in 'reply'.\n"
    "8. For navigation actions, 'reply' must be a concise, reassuring spoken confirmation (e.g., 'Opening camera.', 'Resuming current sentence.').\n"
    "Respond ONLY with valid JSON: {\"action\": str, \"reply\": str, \"question\": str}."
)


def _gemini_client() -> Optional[genai.Client]:
    key = settings.GEMINI_API_KEY
    if not key or key == "your_gemini_api_key_here":
        return None
    return genai.Client(api_key=key)


class VoiceCommandRequest(BaseModel):
    transcript: str = Field(..., description="What the user said")
    screen: str = Field(default="home", description="Screen the user is currently on")
    target_language: str = Field(default="English")


@router.post("/describe-scene")
def describe_scene_endpoint(
    image: UploadFile = File(..., description="Camera frame (JPEG/PNG)"),
    question: str = Form(default=""),
    target_language: str = Form(default=settings.DEFAULT_TARGET_LANGUAGE),
):
    """Camera Mode: sends a camera frame to Gemini vision and returns a spoken description."""
    image_bytes = image.file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large.")

    client = _gemini_client()
    if client is None:
        # Deliberately NO fake description: inventing a scene is unsafe for a blind user.
        return {
            "status": "unavailable",
            "description": "Camera assistant is offline. The AI key is not configured.",
            "used_live_llm": False,
        }

    user_prompt = (
        f"Answer in {target_language}. "
        + (f"The user asks: {question.strip()}" if question.strip()
           else "What is in front of me?")
    )

    models_to_try = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-lite-latest", settings.GEMINI_MODEL_NAME]
    for m_name in dict.fromkeys(models_to_try):
        try:
            response = client.models.generate_content(
                model=m_name,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=image.content_type or "image/jpeg",
                    ),
                    user_prompt,
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SCENE_SYSTEM_PROMPT,
                    temperature=0.2,
                    max_output_tokens=600,
                ),
            )
            text = (response.text or "").strip()
            if text:
                return {"status": "success", "description": text, "used_live_llm": True}
        except Exception:
            continue

    return {
        "status": "error",
        "description": "I could not analyze the view right now. Please try again.",
        "used_live_llm": False,
    }


@router.post("/voice-command")
def voice_command_endpoint(payload: VoiceCommandRequest):
    """AI Mode: understands free-form speech the on-device keyword matcher could not."""
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Empty transcript.")

    client = _gemini_client()
    if client is None:
        return {"action": "help", "reply": "Sorry, I did not catch that.", "question": ""}

    models_to_try = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-lite-latest", settings.GEMINI_MODEL_NAME]
    for m_name in dict.fromkeys(models_to_try):
        try:
            response = client.models.generate_content(
                model=m_name,
                contents=(
                    f"Current screen: {payload.screen}. Reply language: "
                    f"{payload.target_language}. User said: \"{transcript}\""
                ),
                config=types.GenerateContentConfig(
                    system_instruction=VOICE_SYSTEM_PROMPT,
                    temperature=0.1,
                    max_output_tokens=300,
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text or "{}")
            action = data.get("action", "help")
            if action not in VOICE_ACTIONS:
                action = "help"
            return {
                "action": action,
                "reply": str(data.get("reply", ""))[:500],
                "question": str(data.get("question", ""))[:300],
            }
        except Exception:
            continue

    return {"action": "help", "reply": "Sorry, I did not catch that.", "question": ""}
