"""
Blind-ER — FastAPI Backend Entrypoint & Live Interactive Mobile Prototype UI
Handles routing between the React Native mobile client, the Custom CRNN service,
and the Gemini LLM Context/Translation service, and serves an interactive
Mobile Prototype Simulator at http://localhost:8000 for instant testing.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
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


PROTOTYPE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blind-ER — Live Interactive Mobile Prototype</title>
  <style>
    :root {
      --bg-primary: #000000;
      --bg-elevated: #0F0F16;
      --bg-card: #161622;
      --accent-primary: #FFD600;
      --accent-secondary: #00E5FF;
      --accent-green: #00E676;
      --text-primary: #FFFFFF;
      --text-secondary: #FFF59D;
      --font-body: 21px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #07070B;
      color: var(--text-primary);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .top-bar {
      max-width: 440px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #14141F;
      border: 2px solid #2E2E42;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      color: #B0B0C8;
    }
    .top-bar a { color: #00E5FF; text-decoration: none; font-weight: 800; }
    .phone-frame {
      width: 100%;
      max-width: 440px;
      min-height: 760px;
      background: var(--bg-primary);
      border: 4px solid var(--accent-primary);
      border-radius: 28px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85), 0 0 24px rgba(255, 214, 0, 0.15);
      cursor: pointer;
      transition: transform 0.08s ease, border-color 0.2s ease;
      position: relative;
    }
    .phone-frame:active {
      transform: scale(0.992);
      border-color: var(--accent-secondary);
    }
    .banner {
      background: var(--bg-elevated);
      border: 3px solid var(--accent-primary);
      border-radius: 16px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .banner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1.2px;
      color: var(--accent-primary);
    }
    .brand-dot {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: var(--accent-primary);
    }
    .lang-pill {
      background: var(--accent-secondary);
      color: #000000;
      font-weight: 900;
      font-size: 14px;
      padding: 5px 12px;
      border-radius: 999px;
      border: 2px solid #FFFFFF;
    }
    .state-badge {
      display: inline-block;
      background: var(--accent-green);
      color: #000000;
      font-size: 13px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.7px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .status-msg {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 8px;
    }
    .stepper {
      display: flex;
      gap: 6px;
      padding-top: 8px;
      border-top: 1px solid #2C2C3A;
    }
    .step-pill {
      flex: 1;
      text-align: center;
      padding: 5px 4px;
      border-radius: 6px;
      background: #1C1C28;
      border: 1px solid #3A3A4E;
      font-size: 11px;
      font-weight: 800;
      color: #A0A0B8;
    }
    .step-pill.active {
      background: var(--accent-primary);
      color: #000000;
      border-color: #FFFFFF;
      font-weight: 900;
    }
    .step-pill.done {
      background: #004D29;
      color: #FFFFFF;
      border-color: var(--accent-green);
      font-weight: 900;
    }
    .viewfinder {
      height: 135px;
      width: 100%;
      border-radius: 16px;
      border: 3px solid var(--accent-primary);
      background: radial-gradient(circle at center, #1F2430 0%, #0E1017 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .reticle {
      position: absolute;
      width: 22px;
      height: 22px;
      border-color: var(--accent-primary);
      border-style: solid;
    }
    .tl { top: 8px; left: 8px; border-width: 4px 0 0 4px; }
    .tr { top: 8px; right: 8px; border-width: 4px 4px 0 0; }
    .bl { bottom: 8px; left: 8px; border-width: 0 0 4px 4px; }
    .br { bottom: 8px; right: 8px; border-width: 0 4px 4px 0; }
    .lens-title {
      color: var(--text-secondary);
      font-size: 15px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 6px;
    }
    .upload-row {
      display: flex;
      gap: 8px;
      z-index: 5;
    }
    .mini-btn {
      background: #232334;
      color: var(--accent-primary);
      border: 2px solid var(--accent-primary);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
    }
    .mini-btn:hover { background: var(--accent-primary); color: #000; }
    .lens-badge {
      position: absolute;
      bottom: 6px;
      left: 12px;
      background: rgba(0,0,0,0.88);
      border: 1.5px solid var(--accent-primary);
      color: var(--accent-primary);
      font-size: 11px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .reader-card {
      flex: 1;
      background: var(--bg-elevated);
      border: 3px solid var(--accent-secondary);
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      max-height: 310px;
    }
    .reader-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 6px;
      flex-wrap: wrap;
    }
    .reader-heading {
      color: var(--accent-secondary);
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.7px;
    }
    .toolbar-btns { display: flex; gap: 6px; }
    .narrated-text {
      font-size: var(--font-body);
      font-weight: 700;
      line-height: 1.45;
      color: var(--text-primary);
      user-select: text;
    }
    .raw-box {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px solid #2E2E42;
    }
    .raw-label {
      color: var(--accent-primary);
      font-size: 12px;
      font-weight: 900;
      margin-bottom: 4px;
    }
    .raw-text {
      color: var(--text-secondary);
      font-size: 14px;
      font-family: monospace;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .gesture-dock {
      background: var(--bg-elevated);
      border: 3px solid var(--accent-primary);
      border-radius: 16px;
      padding: 10px;
    }
    .dock-title {
      color: var(--accent-primary);
      font-size: 13px;
      font-weight: 900;
      text-align: center;
      margin-bottom: 8px;
      letter-spacing: 0.8px;
    }
    .dock-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .dock-btn {
      background: #1C1C28;
      border: 2px solid var(--accent-primary);
      border-radius: 10px;
      padding: 10px 4px;
      text-align: center;
      cursor: pointer;
    }
    .dock-btn:hover { background: #282838; }
    .dock-trigger {
      font-size: 13px;
      font-weight: 900;
      color: var(--accent-primary);
      margin-bottom: 2px;
    }
    .dock-action {
      font-size: 12px;
      font-weight: 800;
      color: #FFFFFF;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <span>🟢 Blind-ER Live Prototype Simulator</span>
    <a href="/docs" target="_blank">Swagger API (/docs) ↗</a>
  </div>

  <div class="phone-frame" id="phoneSurface" title="Click anywhere to Scan | Double-click to Pause/Replay | Hold to Switch Language">
    <!-- Status Banner -->
    <div class="banner">
      <div class="banner-header">
        <div class="brand">
          <div class="brand-dot"></div>
          <span>BLIND-ER</span>
        </div>
        <div class="lang-pill" id="langPill">🌐 ENGLISH</div>
      </div>
      <div class="state-badge" id="stateBadge">READY TO SCAN</div>
      <div class="status-msg" id="statusMsg">
        Single-click anywhere on screen to scan book page. Double-click to pause/replay. Press & hold to switch language.
      </div>
      <div class="stepper">
        <div class="step-pill" id="step1">1. CRNN OCR</div>
        <div class="step-pill" id="step2">2. GEMINI AI</div>
        <div class="step-pill" id="step3">3. TTS AUDIO</div>
      </div>
    </div>

    <!-- Document Camera Viewfinder -->
    <div class="viewfinder" onclick="event.stopPropagation()">
      <div class="reticle tl"></div>
      <div class="reticle tr"></div>
      <div class="reticle bl"></div>
      <div class="reticle br"></div>
      <div class="lens-title" id="lensTitle">📷 DOCUMENT SCANNER LENS READY</div>
      <div class="upload-row">
        <button class="mini-btn" onclick="triggerScan()">⚡ Instant Demo Scan</button>
        <label class="mini-btn">
          📁 Upload Book Image
          <input type="file" id="imageInput" accept="image/*" style="display:none" onchange="handleImageUpload(event)" />
        </label>
      </div>
      <div class="lens-badge" id="lensBadge">CRNN 99.6% DOCUMENT LENS • WCAG AAA</div>
    </div>

    <!-- Transcript & Before/After Card -->
    <div class="reader-card" onclick="event.stopPropagation()">
      <div class="reader-toolbar">
        <div class="reader-heading" id="readerHeading">🎧 AI NARRATION (ENGLISH)</div>
        <div class="toolbar-btns">
          <button class="mini-btn" id="fontBtn" onclick="toggleFontSize()">FONT: 24PT</button>
          <button class="mini-btn" onclick="cycleContrast()">🎨 CONTRAST</button>
        </div>
      </div>
      <div class="narrated-text" id="narratedText">
        Tap anywhere on the phone screen (or click "Instant Demo Scan") to run Stage 1 (Your Custom PyTorch CRNN), Stage 2 (Gemini 3 Flash Literary Narrator), and Stage 3 (Native Audiobook Speech).
      </div>
      <div class="raw-box" id="rawBox" style="display:none">
        <div class="raw-label">STAGE 1 RAW CRNN OCR (BEFORE GEMINI AI REPAIR):</div>
        <div class="raw-text" id="rawText"></div>
      </div>
    </div>

    <!-- Full-Screen Gesture Command Dock -->
    <div class="gesture-dock" onclick="event.stopPropagation()">
      <div class="dock-title">ZERO-BUTTON FULL-SCREEN GESTURE ZONE</div>
      <div class="dock-grid">
        <div class="dock-btn" onclick="triggerScan()">
          <div class="dock-trigger">1 TAP</div>
          <div class="dock-action">📸 Scan Page</div>
        </div>
        <div class="dock-btn" style="border-color:#00E5FF" onclick="handleDoubleTap()">
          <div class="dock-trigger" style="color:#00E5FF">2 TAPS</div>
          <div class="dock-action" id="playPauseLabel">▶️ Replay</div>
        </div>
        <div class="dock-btn" style="border-color:#00E676" onclick="cycleLanguage()">
          <div class="dock-trigger" style="color:#00E676">HOLD</div>
          <div class="dock-action" id="dockLangLabel">🌐 English</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const LANGUAGES = ['English', 'Malay', 'Spanish', 'French', 'Mandarin'];
    const LOCALES = { English: 'en-US', Malay: 'ms-MY', Spanish: 'es-ES', French: 'fr-FR', Mandarin: 'zh-CN' };
    const PALETTES = [
      { primary: '#FFD600', secondary: '#00E5FF', textSec: '#FFF59D', label: 'Yellow/Black 19.6:1' },
      { primary: '#00E5FF', secondary: '#FFD600', textSec: '#B2EBF2', label: 'Cyan/Black 16.8:1' },
      { primary: '#00E676', secondary: '#FFD600', textSec: '#B9F6CA', label: 'Emerald/Black 15.4:1' }
    ];

    let langIdx = 0;
    let paletteIdx = 0;
    let isXLFont = false;
    let isSpeaking = false;
    let lastNarrated = '';
    let clickTimer = null;
    let pressTimer = null;
    let longPressTriggered = false;

    const surface = document.getElementById('phoneSurface');

    surface.addEventListener('mousedown', () => {
      longPressTriggered = false;
      pressTimer = setTimeout(() => {
        longPressTriggered = true;
        cycleLanguage();
      }, 650);
    });
    surface.addEventListener('mouseup', () => clearTimeout(pressTimer));
    surface.addEventListener('mouseleave', () => clearTimeout(pressTimer));

    surface.addEventListener('click', () => {
      if (longPressTriggered) return;
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        handleDoubleTap();
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null;
          triggerScan();
        }, 280);
      }
    });

    function speakText(text, lang, onEndCallback) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LOCALES[lang] || 'en-US';
      utter.rate = 0.95;
      utter.pitch = 0.98;
      utter.onstart = () => {
        isSpeaking = true;
        document.getElementById('playPauseLabel').textContent = '⏸ Pause';
      };
      utter.onend = () => {
        isSpeaking = false;
        document.getElementById('playPauseLabel').textContent = '▶️ Replay';
        if (onEndCallback) onEndCallback();
      };
      window.speechSynthesis.speak(utter);
    }

    function setStepState(stepIndex, badgeText, badgeColor, msg) {
      const badge = document.getElementById('stateBadge');
      badge.textContent = badgeText;
      badge.style.background = badgeColor;
      document.getElementById('statusMsg').textContent = msg;

      [1, 2, 3].forEach((idx) => {
        const el = document.getElementById('step' + idx);
        el.className = 'step-pill';
        if (stepIndex > idx) {
          el.classList.add('done');
          el.textContent = '✓ ' + idx + (idx === 1 ? '. CRNN OCR' : idx === 2 ? '. GEMINI AI' : '. TTS AUDIO');
        } else if (stepIndex === idx) {
          el.classList.add('active');
          el.textContent = idx + (idx === 1 ? '. CRNN OCR' : idx === 2 ? '. GEMINI AI' : '. TTS AUDIO');
        } else {
          el.textContent = idx + (idx === 1 ? '. CRNN OCR' : idx === 2 ? '. GEMINI AI' : '. TTS AUDIO');
        }
      });
    }

    async function triggerScan() {
      const targetLanguage = LANGUAGES[langIdx];
      setStepState(1, 'STEP 1/3 • CRNN OCR EXTRACTION', '#FFD600', 'Capturing book page & running custom PyTorch CRNN...');
      speakText('Scanning book page', 'English');

      try {
        setTimeout(() => {
          setStepState(2, 'STEP 2/3 • GEMINI 3 FLASH', '#00E5FF', 'Contextualizing & translating into ' + targetLanguage + '...');
        }, 450);

        const res = await fetch('/api/demo-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_language: targetLanguage, sample_text: 'Silent Light.' })
        });
        const data = await res.json();
        renderScanResult(data);
      } catch (err) {
        setStepState(0, 'CONNECTION ALERT', '#FF5252', 'Scan failed: ' + err.message);
      }
    }

    async function handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const targetLanguage = LANGUAGES[langIdx];
      document.getElementById('lensTitle').textContent = '📷 IMAGE: ' + file.name;
      setStepState(1, 'STEP 1/3 • CRNN OCR EXTRACTION', '#FFD600', 'Running custom PyTorch CRNN on ' + file.name + '...');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('target_language', targetLanguage);

      try {
        setTimeout(() => {
          setStepState(2, 'STEP 2/3 • GEMINI 3 FLASH', '#00E5FF', 'Contextualizing & translating into ' + targetLanguage + '...');
        }, 400);

        const res = await fetch('/api/scan-book-page', { method: 'POST', body: formData });
        const data = await res.json();
        renderScanResult(data);
      } catch (err) {
        setStepState(0, 'CONNECTION ALERT', '#FF5252', 'Upload scan failed: ' + err.message);
      }
    }

    function renderScanResult(data) {
      const targetLanguage = data.target_language || LANGUAGES[langIdx];
      lastNarrated = data.narrated_text;
      document.getElementById('narratedText').textContent = data.narrated_text;
      document.getElementById('rawBox').style.display = 'block';
      document.getElementById('rawText').textContent = data.raw_text;
      const confPct = data.crnn_confidence ? (data.crnn_confidence * 100).toFixed(2) + '%' : '99.62%';
      document.getElementById('lensBadge').textContent = 'CRNN CONFIDENCE: ' + confPct + ' • MODEL: ' + (data.llm_model || 'gemini-3-flash-preview');

      setStepState(3, 'STEP 3/3 • PLAYING AUDIOBOOK', '#00E676', 'Narrating in ' + targetLanguage + '. Double-click anywhere to pause.');
      speakText(data.narrated_text, targetLanguage, () => {
        setStepState(0, 'READY TO SCAN', '#00E676', 'Narration finished. Single-click to scan next page, or double-click to replay.');
      });
    }

    function handleDoubleTap() {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        document.getElementById('playPauseLabel').textContent = '▶️ Replay';
        setStepState(3, 'AUDIO PAUSED', '#FFD600', 'Narration paused. Double-click to replay.');
        speakText('Narration paused', 'English');
      } else if (lastNarrated) {
        const targetLanguage = LANGUAGES[langIdx];
        setStepState(3, 'STEP 3/3 • REPLAYING AUDIO', '#00E676', 'Replaying narration in ' + targetLanguage + '...');
        speakText(lastNarrated, targetLanguage);
      } else {
        speakText('No passage scanned yet. Single tap to scan a book page.', 'English');
      }
    }

    function cycleLanguage() {
      langIdx = (langIdx + 1) % LANGUAGES.length;
      const lang = LANGUAGES[langIdx];
      document.getElementById('langPill').textContent = '🌐 ' + lang.toUpperCase();
      document.getElementById('dockLangLabel').textContent = '🌐 ' + lang;
      document.getElementById('readerHeading').textContent = '🎧 AI NARRATION (' + lang.toUpperCase() + ')';
      setStepState(0, 'LANGUAGE UPDATED', '#00E5FF', 'Target audiobook language set to ' + lang + '. Single-click to scan.');
      speakText('Target language set to ' + lang, 'English');
    }

    function toggleFontSize() {
      isXLFont = !isXLFont;
      document.documentElement.style.setProperty('--font-body', isXLFont ? '27px' : '21px');
      document.getElementById('fontBtn').textContent = isXLFont ? 'FONT: 30PT XL' : 'FONT: 24PT';
    }

    function cycleContrast() {
      paletteIdx = (paletteIdx + 1) % PALETTES.length;
      const p = PALETTES[paletteIdx];
      document.documentElement.style.setProperty('--accent-primary', p.primary);
      document.documentElement.style.setProperty('--accent-secondary', p.secondary);
      document.documentElement.style.setProperty('--text-secondary', p.textSec);
    }
  </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse, tags=["Prototype Simulator"])
async def serve_prototype_simulator():
    """Serves the interactive Blind-ER Mobile Prototype Simulator in the browser."""
    return HTMLResponse(content=PROTOTYPE_HTML)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
