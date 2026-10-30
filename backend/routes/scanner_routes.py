"""
Blind-ER — FastAPI Router for the 3-Stage Book-to-Audiobook Pipeline & Hardware Hub
Endpoints:
  1. POST /api/extract-text     (Stage 1: CRNN OCR image-to-raw-text)
  2. POST /api/contextualize    (Stage 2: Gemini LLM repair, tone & translation)
  3. POST /api/scan-book-page   (Combined Stage 1 + Stage 2 convenience endpoint)
  4. POST /api/demo-scan        (Interactive prototype trigger running real PyTorch CRNN + Gemini)
  5. POST /api/hardware-assist  (Meta Smart Glasses POV & Be My Eyes Bridge AI telemetry)
"""

import io
from PIL import Image, ImageDraw, ImageFont
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from config.settings import settings
from services.crnn_service import extract_text_from_image, MOCK_RAW_OCR_TEXT
from services.llm_service import contextualize_and_translate_text

router = APIRouter(prefix="/api", tags=["Blind-ER Scanner & Hardware Pipeline"])


class ContextualizeRequest(BaseModel):
    raw_text: str = Field(..., description="Raw OCR text output from CRNN endpoint")
    target_language: str = Field(
        default=settings.DEFAULT_TARGET_LANGUAGE,
        description="Target language for audiobook narration and translation",
    )


class DemoScanRequest(BaseModel):
    target_language: str = Field(default="English")
    sample_text: str = Field(default="Silent Light.")


class HardwareAssistRequest(BaseModel):
    device_mode: str = Field(
        default="META_GLASSES",
        description="META_GLASSES or BE_MY_EYES",
    )
    scene_id: str = Field(default="CROSSWALK")
    target_language: str = Field(default="English")


HARDWARE_SCENES = {
    "CROSSWALK": {
        "title": "Urban Crosswalk & Traffic Signal",
        "crnn_strip": "WALK 12 SEC",
        "telemetry": "Pedestrian signal ahead shows WALK (12 seconds remaining). Curb step-down 1.2 meters ahead at 12 o'clock. Bicycle approaching from right at 2 o'clock.",
        "fallback_narration": "Meta Glasses Live Monitor: Crosswalk signal is green with 12 seconds to walk. Step down off the curb in 1.2 meters at 12 o'clock. Caution: cyclist passing on your right at 2 o'clock.",
        "bemyeyes_narration": "Be My Eyes Bridge Connected: Sharing live Meta Glasses camera and CRNN text telemetry with Volunteer Sarah. Sarah confirms: 'You are aligned with the tactile paving—safe to cross now.'",
    },
    "PHARMACY": {
        "title": "Prescription Medicine Bottle",
        "crnn_strip": " Take 1 daily.",
        "telemetry": "Bottle Label OCR: AMOXICILLIN 500MG CAPSULES. Take 1 capsule by mouth every 8 hours with water. Expiration: 11/2027.",
        "fallback_narration": "Meta Glasses CRNN Label Scan: Amoxicillin 500 milligram capsules. Instructions: Take one capsule by mouth every eight hours with a full glass of water. Expires November 2027.",
        "bemyeyes_narration": "Be My Eyes Bridge Connected: Pharmacist volunteer verified your Meta Glasses scan—this is the Amoxicillin 500mg antibiotic bottle, not the pain reliever.",
    },
    "BOOKSTORE": {
        "title": "Hands-Free Book Reading via Meta Glasses",
        "crnn_strip": "Silent Light.",
        "telemetry": MOCK_RAW_OCR_TEXT,
        "fallback_narration": "Meta Glasses Bone-Conduction Audiobook: Chapter Four, The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm.",
        "bemyeyes_narration": "Be My Eyes Extension Active: Synced your current book chapter and CRNN scan to your Be My Eyes reading profile.",
    },
}


@router.post("/extract-text")
async def extract_text_endpoint(
    image: UploadFile = File(..., description="Captured book page image"),
):
    """
    Phase 3 Stage 1 Endpoint: Accepts an image of a physical book page and
    returns raw OCR text from Hariths's custom PyTorch CRNN service.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    try:
        result = extract_text_from_image(
            image_bytes=image_bytes,
            filename=image.filename or "captured_page.jpg",
        )
        return {
            "status": "success",
            **result,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"CRNN text extraction failed: {str(exc)}",
        ) from exc


@router.post("/contextualize")
async def contextualize_endpoint(payload: ContextualizeRequest):
    """
    Phase 3 Stage 2 Endpoint: Connects the output of `/api/extract-text` to the
    Gemini LLM API to fix OCR flaws, preserve emotional/genre tone, and translate.
    """
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="raw_text cannot be empty.")

    try:
        llm_result = contextualize_and_translate_text(
            raw_ocr_text=payload.raw_text,
            target_language=payload.target_language,
        )
        return {
            "status": "success",
            "raw_text": payload.raw_text,
            **llm_result,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"LLM contextualization failed: {str(exc)}",
        ) from exc


@router.post("/scan-book-page")
async def scan_book_page_endpoint(
    image: UploadFile = File(..., description="Captured book page image"),
    target_language: str = Form(default=settings.DEFAULT_TARGET_LANGUAGE),
):
    """
    End-to-End Pipeline Endpoint: Runs Stage 1 (CRNN) -> Stage 2 (Gemini LLM)
    in sequence and returns both raw OCR text and audiobook narration text.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    crnn_result = extract_text_from_image(
        image_bytes=image_bytes,
        filename=image.filename or "captured_page.jpg",
    )
    llm_result = contextualize_and_translate_text(
        raw_ocr_text=crnn_result["raw_text"] or MOCK_RAW_OCR_TEXT,
        target_language=target_language,
    )

    return {
        "status": "success",
        "raw_text": crnn_result["raw_text"],
        "crnn_engine": crnn_result["engine"],
        "crnn_confidence": crnn_result["confidence"],
        "narrated_text": llm_result["narrated_text"],
        "target_language": llm_result["target_language"],
        "llm_model": llm_result["model"],
        "used_live_llm": llm_result["used_live_llm"],
    }


@router.post("/demo-scan")
async def demo_scan_endpoint(payload: DemoScanRequest):
    """
    Interactive Prototype Endpoint: Renders a 128x32 book strip image on the fly,
    runs Hariths's real PyTorch `crnn_book_scanner.pth` model on it, and pairs
    the decoded heading with the book passage for Gemini 3 Flash narration.
    """
    img = Image.new("L", (128, 32), color=255)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except IOError:
        font = ImageFont.load_default()

    strip_label = (payload.sample_text or "Silent Light.")[:15]
    draw.text((8, 4), strip_label, font=font, fill=0)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    crnn_result = extract_text_from_image(
        image_bytes=buf.getvalue(),
        filename="live_camera_strip.png",
    )

    combined_raw_ocr = (
        f"[CRNN Line Decode: '{crnn_result['raw_text']}' "
        f"(Confidence: {crnn_result['confidence'] * 100:.2f}%)]\n"
        f"{MOCK_RAW_OCR_TEXT}"
    )

    llm_result = contextualize_and_translate_text(
        raw_ocr_text=combined_raw_ocr,
        target_language=payload.target_language,
    )

    return {
        "status": "success",
        "crnn_decoded_strip": crnn_result["raw_text"],
        "crnn_confidence": crnn_result["confidence"],
        "crnn_engine": crnn_result["engine"],
        "raw_text": combined_raw_ocr,
        "narrated_text": llm_result["narrated_text"],
        "target_language": llm_result["target_language"],
        "llm_model": llm_result["model"],
        "used_live_llm": llm_result["used_live_llm"],
    }


@router.post("/hardware-assist")
async def hardware_assist_endpoint(payload: HardwareAssistRequest):
    """
    Simulates real-time wearable hardware (Ray-Ban Meta Smart Glasses POV)
    and Assistive App Extensions (Be My Eyes / Aira live bridge), running
    the scene text strip through Hariths's PyTorch CRNN + Gemini 3 Flash.
    """
    scene = HARDWARE_SCENES.get(payload.scene_id, HARDWARE_SCENES["CROSSWALK"])

    # Run Stage 1 PyTorch CRNN on the scene's text strip
    img = Image.new("L", (128, 32), color=255)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except IOError:
        font = ImageFont.load_default()
    draw.text((6, 4), scene["crnn_strip"][:15], font=font, fill=0)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    crnn_result = extract_text_from_image(buf.getvalue(), "meta_glasses_pov.png")

    default_speech = (
        scene["bemyeyes_narration"]
        if payload.device_mode == "BE_MY_EYES"
        else scene["fallback_narration"]
    )

    # Optionally translate/adapt via Gemini 3 Flash if non-English or live key configured
    api_key = settings.GEMINI_API_KEY
    spoken_output = default_speech
    used_live = False

    if api_key and api_key != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=api_key)
            prompt = (
                f"Device Mode: {payload.device_mode} (Wearable Smart Glasses / Be My Eyes Bridge)\n"
                f"Target Language: {payload.target_language}\n"
                f"CRNN Extracted Sign/Label Text: {crnn_result['raw_text']}\n"
                f"Scene Telemetry: {scene['telemetry']}\n\n"
                "Deliver a concise, reassuring 2-sentence spoken audio guidance message "
                f"in {payload.target_language} for a visually impaired user wearing smart glasses."
            )
            resp = client.models.generate_content(
                model=settings.GEMINI_MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3),
            )
            if resp.text and resp.text.strip():
                spoken_output = resp.text.strip()
                used_live = True
        except Exception:
            pass

    return {
        "status": "success",
        "device_mode": payload.device_mode,
        "scene_id": payload.scene_id,
        "scene_title": scene["title"],
        "crnn_decoded": crnn_result["raw_text"],
        "crnn_confidence": crnn_result["confidence"],
        "telemetry": scene["telemetry"],
        "spoken_guidance": spoken_output,
        "target_language": payload.target_language,
        "used_live_llm": used_live,
    }
