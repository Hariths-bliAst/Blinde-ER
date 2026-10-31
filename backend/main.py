"""
Blind-ER — FastAPI Backend Entrypoint & Live AI Voice Assistant Web Frontend
Features:
  - AI Voice Mode (`/api/voice-command` + Web Speech Recognition) to navigate the app hands-free by voice
  - Camera AI Mode (`/api/describe-scene` powered by Gemini Vision) to describe what is in front of the user
  - Book Scanner & Audiobook Library with true sentence-level Pause & Resume
  - Clean AI Voice Assistant CSS orb & waveform animations with zero technical jargon
"""

from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from config.settings import settings
from routes.scanner_routes import router as scanner_router
from routes.assistant_routes import router as assistant_router

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"

app = FastAPI(
    title="Blind-ER AI Assistant API",
    description=(
        "Voice-First Book-to-Audiobook Scanner, Gemini Vision Camera Assistant, "
        "and Hands-Free AI Voice Navigation"
    ),
    version="2.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scanner_router)
app.include_router(assistant_router)

if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint verifying backend status without exposing secrets."""
    return {
        "status": "healthy",
        "version": "2.5.0",
        "service": "Blind-ER FastAPI Middleware",
        "crnn_mode": "mock" if settings.USE_MOCK_CRNN else "custom_weights",
        "gemini_key_configured": bool(
            settings.GEMINI_API_KEY
            and settings.GEMINI_API_KEY != "your_gemini_api_key_here"
        ),
    }


@app.get("/", response_class=HTMLResponse, tags=["Mobile App Frontend"])
async def serve_mobile_app_frontend():
    """Serves the Blind-ER AI Voice Assistant & Camera Mode Frontend."""
    index_file = WEB_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html")
    return HTMLResponse("<h1>Blind-ER Web Frontend not found</h1>", status_code=404)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
