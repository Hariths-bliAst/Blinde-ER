# Bonus Deliverable: Competition Judge Q&A Cheat Sheet
> **Project:** Blind-ER — Context-Aware Book-to-Audiobook Scanner
> **For:** Hariths, Matthew, Nijad & Team during Live Q&A

---

### Q1: "Why did you train a custom PyTorch CRNN instead of just sending the image directly to a multimodal LLM or using Google Vision / Tesseract?"
**Winning Answer:**
> *"Three reasons: **Cost, Latency, and Offline Edge Scalability**. Streaming high-resolution camera frames directly into a multimodal LLM consumes 10x more tokens and adds significant network upload latency. By using our lightweight 7-layer CNN + 2-layer BiLSTM CRNN (`backend/services/crnn_service.py`) for Stage 1 optical character extraction—which runs in milliseconds on CPU with **99.62% confidence**—and sending only compact raw text to Gemini 3 Flash in Stage 2, we cut API token costs by over 85% and can run Stage 1 completely on-device."*

---

### Q2: "How do you prevent the LLM from hallucinating or changing the meaning of a textbook or novel?"
**Winning Answer:**
> *"In `backend/services/llm_service.py`, we use a constrained system instruction (`NARRATOR_SYSTEM_PROMPT`) paired with a low generation temperature (`0.4`). This instructs Gemini 3 Flash to strictly repair structural OCR artifacts—like rejoining hyphenated line breaks and stripping page headers—while faithfully preserving the author's original meaning, tone, and factual content. Plus, our UI includes a 'Before vs. After AI' transparency panel so users or educators can inspect the raw CRNN output alongside the narrated prose."*

---

### Q3: "How does a totally blind user navigate the app if they can't see the screen at all?"
**Winning Answer:**
> *"We designed Blind-ER around a **Zero-Button Full-Screen Gesture State Machine** (`frontend/src/ui/components/AccessibleTouchOverlay.jsx`). The user never has to hunt for a button. Tapping anywhere on the glass triggers a scan (`1 Tap`), pausing/replaying (`2 Taps`), or language switching (`Long Press`). Every state transition triggers both distinct haptic vibration patterns (`expo-haptics`) and direct screen-reader announcements (`AccessibilityInfo.announceForAccessibility`) for Android TalkBack and iOS VoiceOver."*

---

### Q4: "How did your 5-person team collaborate on the codebase without stepping on each other's toes or leaking API keys?"
**Winning Answer:**
> *"We enforced two strict software engineering rules from Day 1: First, **Strict Separation of Concerns**—all visual themes and stylesheets (`*.styles.js`) live in `frontend/src/ui/`, completely isolated from our camera and AI controllers in `frontend/src/logic/` and `backend/`. Second, a **Zero-Trust Security Mandate** where all API keys and model paths are loaded from `.env` files blocked by `.gitignore`."*
