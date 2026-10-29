# Blind-ER — Project Architecture & Developer Tutorial

Welcome to the **Blind-ER** repository! Blind-ER is an AI-powered, voice-first mobile application built for visually impaired and partially blind users. Its flagship MVP feature is a **Context-Aware Book-to-Audiobook Scanner** powered by a 3-stage AI pipeline:

1. **Stage 1 (CRNN Optical Character Recognition):** Extracts raw text from physical book pages captured via the mobile camera.
2. **Stage 2 (Gemini LLM Contextualizer & Translator):** Repairs broken OCR artifacts, preserves literary genre/emotional tone, and translates smoothly into the user's target language.
3. **Stage 3 (Native TTS & TalkBack/VoiceOver):** Speaks the narrative naturally on the device with full-screen gesture navigation and screen-reader feedback.

---

## 1. Complete Directory Structure

```text
Blind-ER/
├── .gitignore                        # CRITICAL: Blocks .env secrets, node_modules, venv, and model weights
├── .env                              # Root local environment variables (NEVER COMMITTED)
├── .env.example                      # Safe template showing required environment variable keys
├── PROJECT_TUTORIAL.md               # This architectural & team onboarding guide
├── TEAM_AI_CONTEXT.txt               # Master context file for Matthew & Nijad to feed into their AI helpers
├── README.md                         # Quick-start repository overview
│
├── docs/
│   └── pitch_drafts/                 # [NIJAD'S WORKSPACE] Pitch deck slide copy & feature brainstorming
│       ├── README.md
│       ├── 01_problem_statement.md
│       ├── 02_system_architecture.md
│       ├── 03_user_workflow.md
│       └── 04_future_features.md
│
├── backend/                          # Python FastAPI Middleware & AI Pipeline Server
│   ├── .env                          # Backend secrets: GEMINI_API_KEY, model paths (NEVER COMMITTED)
│   ├── .env.example                  # Safe backend env template
│   ├── main.py                       # FastAPI app entrypoint, CORS middleware, health check
│   ├── requirements.txt              # Python dependencies (fastapi, uvicorn, google-genai, python-dotenv, pillow)
│   ├── config/
│   │   └── settings.py               # Centralized, secure environment variable loader
│   ├── routes/
│   │   └── scanner_routes.py         # REST endpoints: /api/extract-text, /api/contextualize, /api/scan-book-page
│   └── services/
│       ├── crnn_service.py           # [HARITHS'S WORKSPACE] Mock CRNN endpoint & real CRNN weights loader hook
│       └── llm_service.py            # Gemini API integration with the Audiobook Narrator & Translator system prompt
│
└── frontend/                         # React Native (Expo) Accessible Mobile App
    ├── .env                          # Frontend env: EXPO_PUBLIC_API_BASE_URL (NEVER COMMITTED)
    ├── .env.example                  # Safe frontend env template
    ├── App.js                        # Root component connecting logic controller to the UI screen
    ├── app.json                      # Expo config with camera permissions & accessibility metadata
    ├── package.json                  # React Native / Expo dependencies
    └── src/
        ├── config/
        │   └── env.js                # Reads EXPO_PUBLIC_API_BASE_URL from environment variables
        │
        ├── api/                      # [CORE LOGIC - DO NOT EDIT FOR UI CHANGES]
        │   └── scannerApi.js         # Multipart image upload & JSON communication with FastAPI backend
        │
        ├── logic/                    # [CORE LOGIC - DO NOT EDIT FOR UI CHANGES]
        │   ├── useScannerController.js # Camera ref, gesture handlers (single/double/long tap), pipeline state
        │   └── ttsService.js           # Native Text-to-Speech (expo-speech) + TalkBack/VoiceOver announcements
        │
        └── ui/                       # [MATTHEW'S WORKSPACE - SAFE TO EDIT FREELY]
            ├── theme/
            │   └── theme.js          # High-contrast color tokens, font sizes, spacing, border widths
            ├── screens/
            │   ├── ScannerScreen.jsx        # Main screen layout (purely presentational)
            │   └── ScannerScreen.styles.js  # Dedicated styles for ScannerScreen
            └── components/
                ├── AccessibleTouchOverlay.jsx       # Full-screen gesture responder wrapper
                ├── AccessibleTouchOverlay.styles.js # Styles for the full-screen touch zone
                ├── StatusBanner.jsx                 # Visual + screen-reader status indicator
                ├── StatusBanner.styles.js           # Styles for StatusBanner
                ├── TranscriptCard.jsx               # Large-print high-contrast reader view
                └── TranscriptCard.styles.js         # Styles for TranscriptCard
```

---

## 2. Security Mandate (`.env` & `.gitignore`)

To prevent accidental API key leaks during our competition sprint:
- **Never hardcode API keys or URLs** inside `.py`, `.js`, or `.jsx` files.
- All keys (such as `GEMINI_API_KEY`) must be placed inside `backend/.env` (or root `.env`).
- `.gitignore` is strictly configured at the root of `Blind-ER` to block `.env`, `.env.*`, `*.env` (while allowing `.env.example`), Python virtual environments, `node_modules/`, and heavy CRNN weight files (`*.pth`, `*.pt`, `*.h5`, `*.onnx`).
- Before running `git commit`, verify with `git status` that no `.env` file is staged.

---

## 3. Dedicated Guide for Matthew (UI/UX & Styling Lead)

Matthew, our codebase enforces a strict **Separation of Concerns (Logic vs. Styling/UI)** so you can iterate rapidly on visuals, high-contrast themes, and layout ergonomics without ever worrying about breaking the camera hardware, CRNN endpoint, or Gemini LLM integration.

### Files You CAN Safely Edit (`frontend/src/ui/`)
You have complete creative and accessibility ownership over everything inside `frontend/src/ui/`:

| File Path | Purpose & What You Can Customize |
| :--- | :--- |
| `frontend/src/ui/theme/theme.js` | Edit high-contrast color palettes (e.g., `#000000` background, `#FFD600` safety yellow, `#00E5FF` cyan), font sizes, line heights, and border radii. |
| `frontend/src/ui/screens/ScannerScreen.styles.js` | Change flex layouts, padding, borders, and visual placement of the camera preview and overlay cards. |
| `frontend/src/ui/screens/ScannerScreen.jsx` | Rearrange visual elements, add high-contrast icons, or refine `accessibilityLabel` / `accessibilityHint` wording. |
| `frontend/src/ui/components/AccessibleTouchOverlay.styles.js` | Style the full-screen touch target border, active press feedback, and gesture guide badges. |
| `frontend/src/ui/components/AccessibleTouchOverlay.jsx` | Customize the visual gesture prompt instructions shown to partially sighted users. |
| `frontend/src/ui/components/StatusBanner.styles.js` | Style the top status indicator banner (colors per state, text alignment, pill borders). |
| `frontend/src/ui/components/StatusBanner.jsx` | Customize how the pipeline state (`IDLE`, `CAPTURING`, `EXTRACTING`, `CONTEXTUALIZING`, `SPEAKING`, `ERROR`) is visually displayed. |
| `frontend/src/ui/components/TranscriptCard.styles.js` | Style the large-print audiobook transcript card for low-vision readers. |
| `frontend/src/ui/components/TranscriptCard.jsx` | Adjust how the translated narrative and raw OCR text are presented on screen. |

### Files You Must NOT Touch
To keep the AI pipeline and camera logic stable, **do not modify**:
- `frontend/src/logic/useScannerController.js` (Manages camera capture, tap timing, and state transitions)
- `frontend/src/logic/ttsService.js` (Manages native `expo-speech` and TalkBack/VoiceOver announcements)
- `frontend/src/api/scannerApi.js` (Manages HTTP multipart requests to the FastAPI backend)
- `backend/*` (Python FastAPI server & AI models)

### Props Available to Your `ScannerScreen.jsx` Component
`App.js` automatically passes these props from `useScannerController()` into your `ScannerScreen.jsx`:
- `cameraRef`: Attached to the `<CameraView>` component (keep `ref={cameraRef}` intact).
- `cameraPermission`: Object indicating if camera permission is granted (`cameraPermission?.granted`).
- `status`: Current state string (`'IDLE' | 'CAPTURING' | 'EXTRACTING' | 'CONTEXTUALIZING' | 'SPEAKING' | 'PAUSED' | 'ERROR'`).
- `statusMessage`: Human-readable status text (also announced via TalkBack/VoiceOver).
- `rawOcrText`: Raw text returned by the CRNN endpoint.
- `narratedText`: Context-aware, translated audiobook text returned by the Gemini LLM.
- `targetLanguage`: Currently selected output language (e.g., `'English'`, `'Spanish'`, `'French'`, `'Malay'`, `'Mandarin'`).
- `isSpeaking`: Boolean indicating whether native TTS is actively speaking.
- `onSingleTap`: Callback triggered when the user single-taps anywhere on the screen (captures page & starts pipeline).
- `onDoubleTap`: Callback triggered when the user double-taps anywhere on the screen (pauses/stops or replays audio).
- `onLongPress`: Callback triggered when the user long-presses anywhere on the screen (cycles target language with voice feedback).

---

## 4. Dedicated Guide for Hariths (CRNN Model Integration)

Hariths, the backend is ready for your trained CRNN weights!
- Open `backend/services/crnn_service.py`.
- Currently, when `USE_MOCK_CRNN=true` in `backend/.env`, `/api/extract-text` accepts an uploaded image file and returns a realistic hardcoded raw OCR sample (including typical OCR flaws like hyphenated line breaks and header artifacts so the Gemini LLM can demonstrate its repair and contextual translation capabilities).
- When your CRNN weights are ready:
  1. Place your `.pth` / `.onnx` / `.h5` weights file in `backend/models/` (already ignored by `.gitignore`).
  2. Set `USE_MOCK_CRNN=false` and `CRNN_MODEL_WEIGHTS_PATH=./models/your_weights.pth` in `backend/.env`.
  3. Paste your PyTorch/TensorFlow inference call inside the `run_trained_crnn_inference(image_bytes)` function in `backend/services/crnn_service.py`.

---

## 5. Dedicated Guide for Nijad (Pitch Deck & Feature Brainstorming)

Nijad, all pitch deck text drafts and future feature specifications live in:
- `docs/pitch_drafts/`
Use `TEAM_AI_CONTEXT.txt` with your AI assistant to expand the 4 markdown files in `docs/pitch_drafts/`, commit them, and push to GitHub so Hariths can pull your copy directly into Canva.

---

## 6. How to Run the Prototype Locally

### Step 1: Start the Python FastAPI Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Edit backend/.env and add your GEMINI_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Start the React Native (Expo) Frontend
```bash
cd frontend
npm install
# Edit frontend/.env and set EXPO_PUBLIC_API_BASE_URL to your computer's LAN IP
npx expo start
```

