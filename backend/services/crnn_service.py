"""
Blind-ER — Stage 1: Custom CRNN Optical Character Recognition Service
Owner: Hariths (Project Lead & CRNN Model Trainer)

Currently returns a hardcoded raw OCR string when USE_MOCK_CRNN=true so the
frontend-to-LLM-to-TTS pipeline can be tested end-to-end immediately.
Hariths can swap in his trained CRNN weights in `run_trained_crnn_inference()`.
"""

from typing import Dict, Any
from config.settings import settings

# Hardcoded realistic raw OCR sample containing typical physical book scanning
# artifacts (page header, broken hyphenations, slight character noise) to showcase
# Stage 2 LLM repair and contextual narration.
MOCK_RAW_OCR_TEXT = (
    "CHAP- TER IV: THE SILENT LIGHTHOUSE -- p. 42\n"
    "The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying "
    "with it the bitter scent of salt and approaching storm. Elara clutched her "
    "weath- ered lantern tighter. 'Someone left the bea- con burning,' she whis- "
    "pered into the dark- ness, her voice trembling yet reso- lute. Below her, "
    "the sea crashed like an ancient drum summoning the lost ships home."
)


def run_trained_crnn_inference(image_bytes: bytes) -> str:
    """
    HARITHS: Replace the body of this function with your custom PyTorch/TensorFlow
    CRNN model loading and CTC greedy/beam-search decoding logic.
    Model weights path is configured via `settings.CRNN_MODEL_WEIGHTS_PATH`.
    """
    raise NotImplementedError(
        f"Trained CRNN weights at '{settings.CRNN_MODEL_WEIGHTS_PATH}' are not "
        "wired yet. Keep USE_MOCK_CRNN=true in .env until weights are ready."
    )


def extract_text_from_image(image_bytes: bytes, filename: str = "page.jpg") -> Dict[str, Any]:
    """
    Accepts raw image bytes from the mobile document camera and returns
    extracted raw text from the CRNN pipeline.
    """
    if settings.USE_MOCK_CRNN:
        return {
            "raw_text": MOCK_RAW_OCR_TEXT,
            "engine": "mock-crnn-v1",
            "filename": filename,
            "image_size_bytes": len(image_bytes),
            "confidence": 0.94,
        }

    extracted = run_trained_crnn_inference(image_bytes)
    return {
        "raw_text": extracted,
        "engine": "custom-crnn-v1",
        "filename": filename,
        "image_size_bytes": len(image_bytes),
        "confidence": 0.97,
    }

