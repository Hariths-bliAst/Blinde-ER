# Slide 3 & 5: System Architecture & Engineering Standards (With Video Script)
> **Project:** Blind-ER — Context-Aware Book-to-Audiobook Scanner
> **Owner:** Nijad & Hariths

## Slide 3: Our Competitive Edge — The 3-Stage AI Pipeline
1. **Stage 1 — Custom-Trained PyTorch CRNN (`backend/services/crnn_service.py`):**
   - 7-layer CNN + 2-layer Bidirectional LSTM trained with CTC Loss over 40 epochs on dynamic book typography and focus blur.
   - Achieves **99.62% character recognition confidence** on physical book strips and multi-line pages.
2. **Stage 2 — Gemini 3 Flash Literary Narrator & Translator (`backend/services/llm_service.py`):**
   - Repairs broken OCR hyphenations, strips stray headers/page numbers, preserves genre and emotional tone, and translates naturally into **English, Malay, Spanish, French, and Mandarin**.
3. **Stage 3 — Native Mobile TTS & TalkBack/VoiceOver (`frontend/src/logic/ttsService.js`):**
   - Streams expressive narration directly through native mobile Text-to-Speech with full screen-reader and haptic integration.

---

## Slide 5: Engineering & Security Architecture
- **Frontend:** React Native (Expo) with strict **Separation of Concerns**—isolating WCAG AAA high-contrast stylesheets (`src/ui/`) from camera & AI state controllers (`src/logic/`).
- **Middleware:** Python FastAPI orchestrating `/api/extract-text` and `/api/contextualize`.
- **Security by Design:** Zero hardcoded keys; all LLM credentials and model paths are isolated in `.env` files and protected by `.gitignore`.
- **Video Narration Script (0:50 – 1:35):**
  > *"Our competitive edge is a 3-stage AI pipeline built on FastAPI and React Native. First, our custom-trained PyTorch CRNN—combining a 7-layer CNN with a bidirectional LSTM trained with CTC loss—extracts raw text from book pages with 99.62% confidence. Second, Gemini 3 Flash acts as a literary audiobook narrator and translator, repairing OCR flaws while preserving emotional tone across five languages. Third, the refined prose routes directly into native mobile Text-to-Speech and TalkBack."*
