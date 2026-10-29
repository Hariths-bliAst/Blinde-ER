# Slide Section 2: System Architecture
> **Owner:** Nijad (Pitch Deck & Feature Brainstorming Lead)
> **Status:** Draft Template — Use `TEAM_AI_CONTEXT.txt` with your AI assistant to expand this section.

## The 3-Step Context-Aware AI Pipeline
1. **Stage 1 — Custom CRNN Optical Character Recognition (`backend/services/crnn_service.py`)**:
   - Convolutional Recurrent Neural Network trained by Hariths specifically on physical book typography, curved page margins, and varied lighting.
2. **Stage 2 — LLM Contextualizer & Literary Translator (`backend/services/llm_service.py`)**:
   - Powered by the Gemini API. Repairs OCR artifacts (split words, stray page numbers), understands genre/emotional tone, and translates smoothly into the user's target language like a human audiobook narrator.
3. **Stage 3 — Accessible Native TTS & Screen Reader Integration (`frontend/src/logic/ttsService.js`)**:
   - Streams the contextualized narrative directly to native iOS VoiceOver / Android TalkBack and native Text-to-Speech engines with haptic cues.

