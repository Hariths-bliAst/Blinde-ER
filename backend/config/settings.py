"""
Blind-ER Backend Configuration & Environment Loader
SECURITY MANDATE: All API keys and model configurations are loaded exclusively
from environment variables (.env). Never hardcode secrets in this file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env", override=True)


class Settings:
    """Centralized configuration populated exclusively from environment variables."""

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    DEFAULT_TARGET_LANGUAGE: str = os.getenv("DEFAULT_TARGET_LANGUAGE", "English")
    CRNN_MODEL_WEIGHTS_PATH: str = os.getenv(
        "CRNN_MODEL_WEIGHTS_PATH", "./models/crnn_book_scanner.pth"
    )
    USE_MOCK_CRNN: bool = os.getenv("USE_MOCK_CRNN", "true").lower() in (
        "true",
        "1",
        "yes",
    )


settings = Settings()

