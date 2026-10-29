"""
Blind-ER — FastAPI Router for the 3-Stage Book-to-Audiobook Pipeline
Endpoints:
  1. POST /api/extract-text     (Stage 1: CRNN OCR image-to-raw-text)
  2. POST /api/contextualize    (Stage 2: Gemini LLM repair, tone & translation)
  3. POST /api/scan-book-page   (Combined Stage 1 + Stage 2 convenience endpoint)
  4. POST /api/demo-scan        (Interactive prototype trigger running real PyTorch CRNN + Gemini)
"""

import io
from PIL import Image, ImageDraw, ImageFont
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from config.settings import settings
from services.crnn_service import extract_text_from_image, MOCK_RAW_OCR_TEXT
from services.llm_service import contextualize_and_translate_text

router = APIRouter(prefix="/api", tags=["Blind-ER Scanner Pipeline"])


class ContextualizeRequest(BaseModel):
    raw_text: str = Field(..., description="Raw OCR text output from CRNN endpoint")
    target_language: str = Field(
        default=settings.DEFAULT_TARGET_LANGUAGE,
        description="Target language for audiobook narration and translation",
    )


class DemoScanRequest(BaseModel):
    target_language: str = Field(default="English")
    sample_text: str = Field(default="Silent Light.")


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
