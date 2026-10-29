"""
Blind-ER — FastAPI Backend Entrypoint
Handles routing between the React Native mobile client, the Custom CRNN service,
and the Gemini LLM Context/Translation service.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from routes.scanner_routes import router as scanner_router

app = FastAPI(
    title="Blind-ER AI Middleware API",
    description=(
        "Context-Aware Book-to-Audiobook Scanner Pipeline: "
        "Custom CRNN OCR -> Gemini LLM Narrator/Translator -> Mobile TTS"
    ),
    version="1.0.0",
)

# Allow cross-origin requests from Expo / React Native mobile devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scanner_router)


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint verifying backend status without exposing secrets."""
    return {
        "status": "healthy",
        "service": "Blind-ER FastAPI Middleware",
        "crnn_mode": "mock" if settings.USE_MOCK_CRNN else "custom_weights",
        "gemini_key_configured": bool(
            settings.GEMINI_API_KEY
            and settings.GEMINI_API_KEY != "your_gemini_api_key_here"
        ),
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )

