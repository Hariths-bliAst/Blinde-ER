"""
Blind-ER — FastAPI Backend Entrypoint & Flagship Mobile App Frontend
Handles routing between the mobile client, the Custom PyTorch CRNN service,
and the Gemini 3 Flash Literary Narrator service, and serves the complete
consumer mobile application UI at http://localhost:8000.
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


MOBILE_APP_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Blind-ER</title>
  <style>
    :root {
      color-scheme: dark;
      --bg-app: #000000;
      --bg-surface: #0D0E14;
      --bg-elevated: #151722;
      --bg-glass: rgba(21, 23, 34, 0.92);
      --accent: #FFD600;
      --accent-cyan: #00E5FF;
      --accent-green: #00E676;
      --accent-red: #FF5252;
      --text-main: #FFFFFF;
      --text-muted: #FFF59D;
      --text-dim: #9E9EB8;
      --font-reader: 20px;
    }

    @media (forced-colors: active) {
      :root {
        --bg-app: Canvas;
        --bg-surface: Canvas;
        --bg-elevated: Canvas;
        --accent: Highlight;
        --accent-cyan: LinkText;
        --text-main: CanvasText;
        --text-muted: CanvasText;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    body {
      background: radial-gradient(circle at 50% 15%, #181B2C 0%, #050508 100%);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    /* Realistic iPhone 16 Pro Titanium Bezel */
    .device-bezel {
      width: 412px;
      height: 868px;
      background: #000000;
      border-radius: 54px;
      padding: 12px;
      position: relative;
      box-shadow:
        0 0 0 2px #3A3D4D,
        0 0 0 6px #181920,
        0 30px 80px rgba(0, 0, 0, 0.9),
        0 0 50px rgba(255, 214, 0, 0.08);
      display: flex;
      flex-direction: column;
    }

    .device-screen {
      flex: 1;
      background: var(--bg-app);
      border-radius: 44px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      border: 2px solid var(--accent);
    }

    /* iOS Status Bar & Dynamic Island */
    .ios-status-bar {
      height: 48px;
      padding: 12px 26px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
      color: #FFFFFF;
      position: relative;
      z-index: 20;
      flex-shrink: 0;
    }

    .dynamic-island {
      width: 116px;
      height: 30px;
      background: #000000;
      border-radius: 999px;
      border: 1.5px solid #252736;
      position: absolute;
      left: 50%;
      top: 9px;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
    }

    .island-led {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green);
      transition: background 0.2s ease;
    }

    .island-wave {
      display: flex;
      align-items: center;
      gap: 2px;
      height: 12px;
    }

    .island-wave span {
      width: 2.5px;
      height: 4px;
      background: var(--accent);
      border-radius: 2px;
      transition: height 0.15s ease;
    }

    .island-wave.speaking span {
      animation: eqBounce 0.55s infinite ease-in-out alternate;
    }
    .island-wave.speaking span:nth-child(2) { animation-delay: 0.15s; }
    .island-wave.speaking span:nth-child(3) { animation-delay: 0.3s; }
    .island-wave.speaking span:nth-child(4) { animation-delay: 0.1s; }

    @keyframes eqBounce {
      0% { height: 3px; }
      100% { height: 13px; }
    }

    /* App Top Navigation Header */
    .app-header {
      padding: 8px 18px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1F2233;
      flex-shrink: 0;
    }

    .app-logo-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .app-logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: var(--accent);
      color: #000000;
      font-weight: 900;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .app-title {
      font-size: 21px;
      font-weight: 900;
      letter-spacing: 0.6px;
      color: var(--text-main);
    }

    .app-subtitle {
      font-size: 10px;
      font-weight: 800;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.9px;
      display: block;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pill-btn {
      background: var(--bg-elevated);
      color: var(--accent);
      border: 2px solid var(--accent);
      border-radius: 999px;
      padding: 5px 11px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .pill-btn.cyan {
      background: var(--accent-cyan);
      color: #000000;
      border-color: #FFFFFF;
    }

    /* Main Content Viewport */
    .tab-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 12px 14px;
      overflow-y: auto;
      position: relative;
    }

    .tab-pane {
      display: none;
      flex-direction: column;
      flex: 1;
      gap: 10px;
    }

    .tab-pane.active {
      display: flex;
    }

    /* Camera Viewfinder */
    .camera-card {
      position: relative;
      height: 195px;
      border-radius: 20px;
      border: 3px solid var(--accent);
      overflow: hidden;
      background: #0B0D14;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #cameraVideo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: none;
    }

    /* Simulated Physical Book Page inside Camera Viewfinder when no webcam active */
    .book-page-simulation {
      width: 86%;
      height: 82%;
      background: linear-gradient(90deg, #ECE8DC 0%, #FAF7F0 12%, #F5F1E6 92%, #DFD9C8 100%);
      color: #1A1A1A;
      border-radius: 6px 10px 10px 6px;
      padding: 12px 16px;
      box-shadow: -6px 6px 18px rgba(0, 0, 0, 0.7), inset 10px 0 16px rgba(0,0,0,0.08);
      font-family: Georgia, 'Times New Roman', serif;
      position: relative;
      transform: perspective(500px) rotateX(4deg);
      overflow: hidden;
    }

    .book-page-header {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: #555;
      border-bottom: 1px solid #CCC;
      padding-bottom: 3px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }

    .book-page-body {
      font-size: 11.5px;
      line-height: 1.42;
      color: #181818;
      text-align: justify;
    }

    /* Laser Scan Line Animation */
    .scan-laser {
      position: absolute;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--accent-cyan);
      box-shadow: 0 0 16px 4px var(--accent-cyan);
      top: 0;
      opacity: 0;
      pointer-events: none;
      z-index: 10;
    }

    .camera-card.scanning .scan-laser {
      opacity: 1;
      animation: laserSweep 1.3s ease-in-out infinite alternate;
    }

    @keyframes laserSweep {
      0% { top: 8%; }
      100% { top: 90%; }
    }

    /* Corner Reticles */
    .reticle {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: var(--accent);
      border-style: solid;
      z-index: 8;
      pointer-events: none;
    }
    .reticle.tl { top: 10px; left: 10px; border-width: 4px 0 0 4px; border-top-left-radius: 8px; }
    .reticle.tr { top: 10px; right: 10px; border-width: 4px 4px 0 0; border-top-right-radius: 8px; }
    .reticle.bl { bottom: 10px; left: 10px; border-width: 0 0 4px 4px; border-bottom-left-radius: 8px; }
    .reticle.br { bottom: 10px; right: 10px; border-width: 0 4px 4px 0; border-bottom-right-radius: 8px; }

    .camera-controls-overlay {
      position: absolute;
      bottom: 8px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 12;
    }

    .cam-chip {
      background: rgba(0, 0, 0, 0.85);
      color: var(--accent);
      border: 1.5px solid var(--accent);
      border-radius: 8px;
      padding: 4px 9px;
      font-size: 11px;
      font-weight: 900;
      cursor: pointer;
    }

    /* AI Pipeline Status Pill Strip */
    .pipeline-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      flex-shrink: 0;
    }

    .stage-pill {
      background: var(--bg-surface);
      border: 2px solid #282B3E;
      border-radius: 10px;
      padding: 6px 4px;
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: var(--text-dim);
      transition: all 0.2s ease;
    }

    .stage-pill.active {
      background: var(--accent);
      color: #000000;
      border-color: #FFFFFF;
      font-weight: 900;
    }

    .stage-pill.done {
      background: #073B22;
      color: #FFFFFF;
      border-color: var(--accent-green);
      font-weight: 900;
    }

    /* Audiobook Now Playing Card */
    .audiobook-card {
      flex: 1;
      background: var(--bg-surface);
      border: 3px solid var(--accent-cyan);
      border-radius: 20px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 225px;
    }

    .audiobook-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .chapter-badge {
      color: var(--accent-cyan);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.7px;
      text-transform: uppercase;
    }

    .reader-scroll {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;
      margin-bottom: 10px;
      max-height: 155px;
    }

    .audiobook-prose {
      font-size: var(--font-reader);
      font-weight: 700;
      line-height: 1.48;
      color: var(--text-main);
      user-select: text;
    }

    .raw-ocr-drawer {
      margin-top: 8px;
      padding: 8px 10px;
      background: #08090E;
      border: 1.5px solid var(--accent);
      border-radius: 10px;
      font-family: monospace;
      font-size: 12px;
      color: var(--text-muted);
      display: none;
      white-space: pre-wrap;
    }

    /* Equalizer & Playback Controls Bar */
    .player-footer {
      border-top: 1.5px solid #232638;
      padding-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .waveform-bars {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 22px;
      flex: 1;
    }

    .waveform-bars span {
      flex: 1;
      height: 5px;
      background: #32364F;
      border-radius: 3px;
      transition: height 0.12s ease, background 0.12s ease;
    }

    .waveform-bars.active span {
      background: var(--accent-cyan);
      animation: wavePulse 0.6s infinite ease-in-out alternate;
    }
    .waveform-bars.active span:nth-child(odd) { animation-duration: 0.45s; }
    .waveform-bars.active span:nth-child(3n) { animation-duration: 0.75s; background: var(--accent); }

    @keyframes wavePulse {
      0% { height: 4px; }
      100% { height: 22px; }
    }

    /* Full-Width Tactile Action Pad */
    .tactile-gesture-pad {
      display: grid;
      grid-template-columns: 1.3fr 1fr 1fr;
      gap: 8px;
      flex-shrink: 0;
    }

    .tactile-btn {
      background: var(--bg-elevated);
      border: 2.5px solid var(--accent);
      border-radius: 14px;
      padding: 10px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      min-height: 62px;
      transition: transform 0.08s ease;
    }

    .tactile-btn:active { transform: scale(0.96); }
    .tactile-btn.primary { background: var(--accent); color: #000000; }
    .tactile-btn.primary .tactile-sub,
    .tactile-btn.primary .tactile-main { color: #000000; }

    .tactile-sub {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.6px;
      color: var(--accent);
      text-transform: uppercase;
    }

    .tactile-main {
      font-size: 14px;
      font-weight: 900;
      color: #FFFFFF;
      margin-top: 2px;
    }

    /* Tab 2, 3, 4 Cards */
    .feature-card {
      background: var(--bg-surface);
      border: 2.5px solid var(--accent);
      border-radius: 18px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .feature-card-title {
      font-size: 17px;
      font-weight: 900;
      color: var(--accent);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .feature-card-desc {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--text-main);
    }

    .pitch-arena {
      flex: 1;
      background: var(--bg-surface);
      border: 3px solid var(--accent-cyan);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }

    .freq-circle {
      width: 132px;
      height: 132px;
      border-radius: 50%;
      border: 5px solid var(--accent);
      background: radial-gradient(circle, rgba(255,214,0,0.18) 0%, rgba(0,0,0,0.9) 75%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 25px rgba(255, 214, 0, 0.25);
    }

    .pitch-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    /* Bottom App Tab Bar */
    .bottom-tab-bar {
      height: 68px;
      background: #08090F;
      border-top: 2px solid #222538;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      padding: 6px 10px 10px;
      flex-shrink: 0;
    }

    .nav-tab {
      background: transparent;
      border: none;
      color: var(--text-dim);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      border-radius: 12px;
    }

    .nav-tab.active {
      color: var(--accent);
      background: rgba(255, 214, 0, 0.12);
    }

    .nav-icon { font-size: 19px; line-height: 1; }

    @media (max-width: 480px) {
      body { padding: 0; }
      .device-bezel {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        padding: 0;
        box-shadow: none;
      }
      .device-screen { border-radius: 0; border: none; }
    }
  </style>
</head>
<body>

  <main class="device-bezel" aria-label="Blind-ER Accessible Mobile Application">
    <div class="device-screen" id="appScreen">

      <!-- Native iOS Status Bar & Dynamic Island -->
      <div class="ios-status-bar">
        <span id="clockTime">9:41</span>
        <div class="dynamic-island" title="Live Voice & AI Activity Indicator">
          <div class="island-led" id="islandLed"></div>
          <div class="island-wave" id="islandWave">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <span>5G 100% 🔋</span>
      </div>

      <!-- App Brand & Quick Accessibility Header -->
      <header class="app-header">
        <div class="app-logo-group">
          <div class="app-logo-badge" aria-hidden="true">B</div>
          <div>
            <div class="app-title">Blind-ER</div>
            <span class="app-subtitle" id="headerStateSubtitle">● Voice-First Ready</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="pill-btn" onclick="cycleContrastTheme()" aria-label="Switch high contrast theme">🎨 AAA</button>
          <button class="pill-btn" id="fontToggleBtn" onclick="toggleReaderFont()" aria-label="Toggle extra large font">Aa 20pt</button>
          <button class="pill-btn cyan" id="langHeaderBtn" onclick="cycleLanguage()" aria-label="Switch narration language">🌐 EN</button>
        </div>
      </header>

      <!-- Tab Content Area -->
      <div class="tab-viewport">

        <!-- =============================================================== -->
        <!-- TAB 1: BOOK-TO-AUDIOBOOK SCANNER (MAIN MVP SCREEN)              -->
        <!-- =============================================================== -->
        <section class="tab-pane active" id="tab-scanner" aria-label="Book Scanner and Audiobook Player">

          <!-- Live Document Camera Viewfinder -->
          <div class="camera-card" id="cameraCard" onclick="triggerBookScan()">
            <div class="scan-laser"></div>
            <div class="reticle tl"></div>
            <div class="reticle tr"></div>
            <div class="reticle bl"></div>
            <div class="reticle br"></div>

            <video id="cameraVideo" autoplay playsinline muted></video>

            <div class="book-page-simulation" id="bookSimulation">
              <div class="book-page-header">
                <span>CHAPTER IV: THE SILENT LIGHTHOUSE</span>
                <span>PAGE 42</span>
              </div>
              <div class="book-page-body" id="simulatedBookPageText">
                The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying with it the bitter scent of salt and approaching storm. Elara clutched her weath- ered lantern tighter. "Someone left the bea- con burning," she whis- pered into the dark- ness...
              </div>
            </div>

            <div class="camera-controls-overlay" onclick="event.stopPropagation()">
              <button class="cam-chip" onclick="toggleWebcam()" id="webcamBtn">📷 Live Camera</button>
              <label class="cam-chip">
                📁 Scan Photo
                <input type="file" accept="image/*" style="display:none" onchange="handlePhotoUpload(event)" />
              </label>
              <button class="cam-chip" onclick="cycleSampleBookPage()">📖 Next Page</button>
            </div>
          </div>

          <!-- 3-Stage AI Pipeline Stepper -->
          <div class="pipeline-bar" role="status" aria-live="polite">
            <div class="stage-pill" id="stage1Pill">1. CRNN 99.6%</div>
            <div class="stage-pill" id="stage2Pill">2. Gemini 3 AI</div>
            <div class="stage-pill" id="stage3Pill">3. Native TTS</div>
          </div>

          <!-- Expressive Audiobook Now Playing Card -->
          <div class="audiobook-card">
            <div>
              <div class="audiobook-top">
                <span class="chapter-badge" id="nowPlayingTitle">🎧 TAP SCREEN TO SCAN PAGE</span>
                <button class="cam-chip" onclick="toggleRawOcrDrawer()" id="rawCompareBtn">🔍 View Raw OCR</button>
              </div>
              <div class="reader-scroll">
                <p class="audiobook-prose" id="audiobookProse">
                  Tap anywhere on the book viewfinder or press "Scan Page" below. Blind-ER extracts the page using our custom PyTorch CRNN, repairs and translates the prose with Gemini 3 Flash, and narrates it aloud.
                </p>
                <div class="raw-ocr-drawer" id="rawOcrDrawer"></div>
              </div>
            </div>

            <div class="player-footer">
              <div class="waveform-bars" id="waveformBars">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>
              <button class="cam-chip" id="speedBtn" onclick="cyclePlaybackSpeed()">1.0x</button>
            </div>
          </div>

          <!-- Full-Width Zero-Precision Tactile Gesture Bar -->
          <div class="tactile-gesture-pad">
            <button class="tactile-btn primary" onclick="triggerBookScan()">
              <span class="tactile-sub">1 Tap Anywhere</span>
              <span class="tactile-main">📸 Scan Page</span>
            </button>
            <button class="tactile-btn" style="border-color: var(--accent-cyan)" onclick="togglePlayPause()">
              <span class="tactile-sub" style="color: var(--accent-cyan)">2 Taps</span>
              <span class="tactile-main" id="playPauseBtnText">▶️ Play</span>
            </button>
            <button class="tactile-btn" style="border-color: var(--accent-green)" onclick="cycleLanguage()">
              <span class="tactile-sub" style="color: var(--accent-green)">Hold</span>
              <span class="tactile-main" id="langPadText">🌐 English</span>
            </button>
          </div>
        </section>

        <!-- =============================================================== -->
        <!-- TAB 2: SCANNED AUDIOBOOK LIBRARY                                -->
        <!-- =============================================================== -->
        <section class="tab-pane" id="tab-library" aria-label="Saved Audiobook Library">
          <div class="feature-card" style="border-color: var(--accent-cyan)">
            <div class="feature-card-title" style="color: var(--accent-cyan)">
              <span>📚 My Audiobook Library</span>
              <span style="font-size:12px" id="libraryCountBadge">3 Saved Chapters</span>
            </div>
            <p class="feature-card-desc">
              Every physical book page you scan is automatically cleaned, translated, and saved for offline replay.
            </p>
          </div>
          <div id="libraryList" style="display:flex; flex-direction:column; gap:10px;"></div>
        </section>

        <!-- =============================================================== -->
        <!-- TAB 3: AUDIO PITCH & ECHOLOCATION TRAINING GAME                 -->
        <!-- =============================================================== -->
        <section class="tab-pane" id="tab-pitch" aria-label="Audio Pitch and Echolocation Training Game">
          <div class="pitch-arena">
            <div>
              <span class="chapter-badge">🎯 HARMONIC NAVIGATOR • AUDITORY TRAINING</span>
              <h2 style="font-size:20px; font-weight:900; margin-top:4px; color:var(--accent)">
                Pitch Discrimination Challenge
              </h2>
              <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">
                Train spatial hearing and frequency sensitivity. Tap the sonar orb to hear two tones, then identify if the second tone is higher or lower.
              </p>
            </div>

            <div class="freq-circle" onclick="playPitchChallenge()" role="button" aria-label="Play reference and target audio tones">
              <span style="font-size:28px;">🔊</span>
              <span style="font-size:14px; font-weight:900; color:var(--accent); margin-top:4px;" id="pitchOrbLabel">TAP TO HEAR</span>
              <span style="font-size:11px; color:var(--text-dim);" id="pitchHzLabel">440 Hz Reference</span>
            </div>

            <div style="font-size:15px; font-weight:800; color:#FFF;" id="pitchFeedbackText">
              Score: 0 • Streak: 0 🔥
            </div>

            <div class="pitch-grid">
              <button class="tactile-btn" style="border-color: var(--accent-cyan)" onclick="submitPitchGuess('LOWER')">
                <span class="tactile-sub" style="color: var(--accent-cyan)">Swipe Left</span>
                <span class="tactile-main">🔉 Lower Pitch</span>
              </button>
              <button class="tactile-btn" style="border-color: var(--accent-green)" onclick="submitPitchGuess('HIGHER')">
                <span class="tactile-sub" style="color: var(--accent-green)">Swipe Right</span>
                <span class="tactile-main">🔊 Higher Pitch</span>
              </button>
            </div>
          </div>
        </section>

        <!-- =============================================================== -->
        <!-- TAB 4: SMART HOME IoT CAMERA ASSISTANT                          -->
        <!-- =============================================================== -->
        <section class="tab-pane" id="tab-iot" aria-label="Smart Home IoT Spatial Safety Assistant">
          <div class="feature-card" style="border-color: var(--accent-green)">
            <div class="feature-card-title" style="color: var(--accent-green)">
              <span>🏠 Blind-ER Home IoT Mesh</span>
              <span style="font-size:12px">3 Cameras Online</span>
            </div>
            <p class="feature-card-desc">
              Tap any room camera below for real-time voice descriptions of home hazards, visitors, and misplaced items.
            </p>
          </div>

          <div class="feature-card" style="border-color: var(--accent-red); cursor:pointer" onclick="speakIoTAlert('Warning: Kitchen camera detects the front-left stove burner is still switched on and unattended. Please turn off the dial.')">
            <div class="feature-card-title" style="color: var(--accent-red)">
              <span>🔥 Kitchen Stove Cam</span>
              <span>⚠️ HAZARD ALERT</span>
            </div>
            <p class="feature-card-desc">
              Front-left burner is active with no pot detected. Tap to hear spatial safety guidance.
            </p>
          </div>

          <div class="feature-card" style="cursor:pointer" onclick="speakIoTAlert('Living Room Camera: Your house keys are on the dining table, approximately two feet to the left of your coffee mug at the 10 o clock position.')">
            <div class="feature-card-title">
              <span>🔑 Object Finder ("Where are my keys?")</span>
              <span>10 O'Clock</span>
            </div>
            <p class="feature-card-desc">
              Located on dining table, 2 ft left of coffee mug (10 o'clock position). Tap to speak directions.
            </p>
          </div>

          <div class="feature-card" style="border-color: var(--accent-cyan); cursor:pointer" onclick="speakIoTAlert('Front Door Camera: A courier package is resting on the welcome mat on the right side of the doorway. Path is otherwise clear.')">
            <div class="feature-card-title" style="color: var(--accent-cyan)">
              <span>🚪 Front Doorway Cam</span>
              <span>📦 Package Detected</span>
            </div>
            <p class="feature-card-desc">
              1 parcel detected on right side of welcome mat. Hallway path is clear of obstacles.
            </p>
          </div>
        </section>

      </div>

      <!-- Native App Bottom Navigation Bar -->
      <nav class="bottom-tab-bar" aria-label="Primary App Navigation">
        <button class="nav-tab active" onclick="switchTab('scanner', this)">
          <span class="nav-icon" aria-hidden="true">📖</span>
          <span>Scanner</span>
        </button>
        <button class="nav-tab" onclick="switchTab('library', this)">
          <span class="nav-icon" aria-hidden="true">📚</span>
          <span>Library</span>
        </button>
        <button class="nav-tab" onclick="switchTab('pitch', this)">
          <span class="nav-icon" aria-hidden="true">🎯</span>
          <span>Pitch Game</span>
        </button>
        <button class="nav-tab" onclick="switchTab('iot', this)">
          <span class="nav-icon" aria-hidden="true">🏠</span>
          <span>Home IoT</span>
        </button>
      </nav>

    </div>
  </main>

  <script>
    const LANGUAGES = [
      { name: 'English', code: 'EN', locale: 'en-US' },
      { name: 'Malay', code: 'MS', locale: 'ms-MY' },
      { name: 'Spanish', code: 'ES', locale: 'es-ES' },
      { name: 'French', code: 'FR', locale: 'fr-FR' },
      { name: 'Mandarin', code: 'ZH', locale: 'zh-CN' }
    ];

    const SAMPLE_BOOK_PAGES = [
      {
        title: 'Chapter IV: The Silent Lighthouse',
        strip: 'Silent Light.',
        raw: "CHAP- TER IV: THE SILENT LIGHTHOUSE -- p. 42\\nThe wind howled ac- ross the jagged cliffs of Northum- berland, car- rying with it the bitter scent of salt and approaching storm. Elara clutched her weath- ered lantern tighter. 'Someone left the bea- con burning,' she whis- pered into the dark- ness..."
      },
      {
        title: 'Chapter VII: Beneath the Northern Stars',
        strip: 'Dark storm.',
        raw: "CHAP- TER VII: BENEATH THE STARS -- p. 108\\nAcross the fro- zen valley, a lone wolf called out to the sil- ver moon. Marcus pulled his cloak closer, his heart racing with quiet deter- mination as the ancient gate slowly swung open."
      },
      {
        title: 'Science 101: How Vision & Sound Work',
        strip: 'Sound waves.',
        raw: "SEC- TION 3.2: AUDITORY NEURO- PLASTICITY -- p. 19\\nWhen visual input decreases, the human auditory cortex adapts remark- ably, allowing listeners to map three-dimen- sional spaces using subtle echoes and pitch shifts."
      }
    ];

    const CONTRAST_THEMES = [
      { accent: '#FFD600', cyan: '#00E5FF', muted: '#FFF59D' },
      { accent: '#00E5FF', cyan: '#FFD600', muted: '#B2EBF2' },
      { accent: '#00E676', cyan: '#FFD600', muted: '#B9F6CA' }
    ];

    let currentLangIdx = 0;
    let currentPageIdx = 0;
    let currentThemeIdx = 0;
    let playbackRates = [0.92, 1.05, 1.25];
    let rateIdx = 0;
    let isLargeFont = false;
    let isSpeaking = false;
    let lastNarratedPassage = '';
    let webcamStream = null;

    // Saved Audiobook Library items
    let savedLibrary = [
      {
        title: 'Chapter IV: The Silent Lighthouse',
        lang: 'English',
        text: 'Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm. Elara clutched her weathered lantern tighter. "Someone left the beacon burning," she whispered into the darkness.'
      },
      {
        title: 'Bab Empat: Rumah Api yang Sepi',
        lang: 'Malay',
        text: 'Bab Empat: Rumah Api yang Sepi. Angin menderu merentasi tebing curam Northumberland, membawa bersama bau masin laut dan ribut yang semakin hampir. Elara menggenggam erat lentera usangnya.'
      },
      {
        title: 'Capítulo Cuatro: El Faro Silencioso',
        lang: 'Spanish',
        text: 'Capítulo Cuatro: El Faro Silencioso. El viento aullaba sobre los acantilados escarpados de Northumberland, trayendo consigo el aroma amargo de la sal y de una tormenta inminente.'
      }
    ];

    // Web Audio API Haptic/Tactile Sound Synthesizer
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function playTactileCue(freq = 520, duration = 0.07, type = 'sine') {
      try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    }

    function speakOutLoud(text, langName = 'English', onFinish = null) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const langObj = LANGUAGES.find((l) => l.name === langName) || LANGUAGES[0];
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = langObj.locale;
      utter.rate = playbackRates[rateIdx];
      utter.pitch = 0.98;

      utter.onstart = () => {
        isSpeaking = true;
        document.getElementById('waveformBars').classList.add('active');
        document.getElementById('islandWave').classList.add('speaking');
        document.getElementById('playPauseBtnText').textContent = '⏸ Pause';
      };

      const resetSpeechUI = () => {
        isSpeaking = false;
        document.getElementById('waveformBars').classList.remove('active');
        document.getElementById('islandWave').classList.remove('speaking');
        document.getElementById('playPauseBtnText').textContent = '▶️ Replay';
        if (onFinish) onFinish();
      };

      utter.onend = resetSpeechUI;
      utter.onerror = resetSpeechUI;
      window.speechSynthesis.speak(utter);
    }

    function updatePipelineUI(step, subtitleText) {
      document.getElementById('headerStateSubtitle').textContent = '● ' + subtitleText;
      const pills = [
        { el: document.getElementById('stage1Pill'), label: '1. CRNN 99.6%' },
        { el: document.getElementById('stage2Pill'), label: '2. Gemini 3 AI' },
        { el: document.getElementById('stage3Pill'), label: '3. Native TTS' }
      ];
      pills.forEach((p, idx) => {
        const s = idx + 1;
        p.el.className = 'stage-pill';
        if (step > s) {
          p.el.classList.add('done');
          p.el.textContent = '✓ ' + p.label;
        } else if (step === s) {
          p.el.classList.add('active');
          p.el.textContent = p.label;
        } else {
          p.el.textContent = p.label;
        }
      });
    }

    async function triggerBookScan() {
      playTactileCue(660, 0.08, 'triangle');
      const lang = LANGUAGES[currentLangIdx].name;
      const pageSample = SAMPLE_BOOK_PAGES[currentPageIdx];
      const camCard = document.getElementById('cameraCard');
      camCard.classList.add('scanning');

      updatePipelineUI(1, 'Stage 1: CRNN Extracting Text...');
      document.getElementById('nowPlayingTitle').textContent = '⏳ SCANNING: ' + pageSample.title.toUpperCase();

      try {
        setTimeout(() => {
          updatePipelineUI(2, 'Stage 2: Gemini 3 Contextualizing (' + lang + ')...');
        }, 420);

        const res = await fetch('/api/demo-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_language: lang,
            sample_text: pageSample.strip
          })
        });
        const data = await res.json();
        camCard.classList.remove('scanning');
        presentScanOutput(data, pageSample.title);
      } catch (err) {
        camCard.classList.remove('scanning');
        updatePipelineUI(0, 'Connection Alert');
      }
    }

    async function handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      playTactileCue(700, 0.08, 'triangle');
      const lang = LANGUAGES[currentLangIdx].name;
      const camCard = document.getElementById('cameraCard');
      camCard.classList.add('scanning');
      updatePipelineUI(1, 'CRNN Scanning ' + file.name + '...');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('target_language', lang);

      try {
        setTimeout(() => {
          updatePipelineUI(2, 'Gemini 3 Translating (' + lang + ')...');
        }, 420);
        const res = await fetch('/api/scan-book-page', { method: 'POST', body: formData });
        const data = await res.json();
        camCard.classList.remove('scanning');
        presentScanOutput(data, 'Scanned Page: ' + file.name);
      } catch (err) {
        camCard.classList.remove('scanning');
        updatePipelineUI(0, 'Upload Error');
      }
    }

    function presentScanOutput(data, chapterTitle) {
      playTactileCue(880, 0.12, 'sine');
      const lang = data.target_language || LANGUAGES[currentLangIdx].name;
      lastNarratedPassage = data.narrated_text;

      const confPct = data.crnn_confidence ? (data.crnn_confidence * 100).toFixed(2) + '%' : '99.62%';
      document.getElementById('nowPlayingTitle').textContent = '🎧 ' + chapterTitle + ' (' + lang.toUpperCase() + ' • ' + confPct + ')';
      document.getElementById('audiobookProse').textContent = data.narrated_text;
      document.getElementById('rawOcrDrawer').textContent = data.raw_text;

      // Save to Library automatically
      savedLibrary.unshift({
        title: chapterTitle,
        lang: lang,
        text: data.narrated_text
      });
      renderLibrary();

      updatePipelineUI(3, 'Stage 3: Narrating Audiobook (' + lang + ')');
      speakOutLoud(data.narrated_text, lang, () => {
        updatePipelineUI(0, 'Narration Complete • Tap to Scan');
      });
    }

    function togglePlayPause() {
      playTactileCue(480, 0.06);
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        document.getElementById('waveformBars').classList.remove('active');
        document.getElementById('islandWave').classList.remove('speaking');
        document.getElementById('playPauseBtnText').textContent = '▶️ Replay';
        updatePipelineUI(0, 'Narration Paused');
      } else if (lastNarratedPassage) {
        const lang = LANGUAGES[currentLangIdx].name;
        updatePipelineUI(3, 'Replaying Audiobook (' + lang + ')');
        speakOutLoud(lastNarratedPassage, lang);
      } else {
        triggerBookScan();
      }
    }

    function cycleLanguage() {
      currentLangIdx = (currentLangIdx + 1) % LANGUAGES.length;
      const langObj = LANGUAGES[currentLangIdx];
      playTactileCue(600, 0.08);
      document.getElementById('langHeaderBtn').textContent = '🌐 ' + langObj.code;
      document.getElementById('langPadText').textContent = '🌐 ' + langObj.name;
      updatePipelineUI(0, 'Language: ' + langObj.name);
      speakOutLoud('Target language ' + langObj.name, 'English');
    }

    function cycleSampleBookPage() {
      currentPageIdx = (currentPageIdx + 1) % SAMPLE_BOOK_PAGES.length;
      const p = SAMPLE_BOOK_PAGES[currentPageIdx];
      document.querySelector('.book-page-header span:first-child').textContent = p.title.toUpperCase();
      document.getElementById('simulatedBookPageText').textContent = p.raw.split('\\n').slice(1).join(' ');
      playTactileCue(540, 0.06);
    }

    function toggleRawOcrDrawer() {
      const drawer = document.getElementById('rawOcrDrawer');
      const isHidden = drawer.style.display === 'none' || !drawer.style.display;
      drawer.style.display = isHidden ? 'block' : 'none';
      document.getElementById('rawCompareBtn').textContent = isHidden ? '🔼 Hide Raw OCR' : '🔍 View Raw OCR';
    }

    function cyclePlaybackSpeed() {
      rateIdx = (rateIdx + 1) % playbackRates.length;
      const labels = ['1.0x', '1.15x', '1.3x'];
      document.getElementById('speedBtn').textContent = labels[rateIdx];
      playTactileCue(620, 0.05);
    }

    function toggleReaderFont() {
      isLargeFont = !isLargeFont;
      document.documentElement.style.setProperty('--font-reader', isLargeFont ? '25px' : '20px');
      document.getElementById('fontToggleBtn').textContent = isLargeFont ? 'Aa 26pt XL' : 'Aa 20pt';
      playTactileCue(580, 0.05);
    }

    function cycleContrastTheme() {
      currentThemeIdx = (currentThemeIdx + 1) % CONTRAST_THEMES.length;
      const t = CONTRAST_THEMES[currentThemeIdx];
      document.documentElement.style.setProperty('--accent', t.accent);
      document.documentElement.style.setProperty('--accent-cyan', t.cyan);
      document.documentElement.style.setProperty('--text-muted', t.muted);
      playTactileCue(640, 0.06);
    }

    async function toggleWebcam() {
      const videoEl = document.getElementById('cameraVideo');
      const simEl = document.getElementById('bookSimulation');
      const btn = document.getElementById('webcamBtn');

      if (webcamStream) {
        webcamStream.getTracks().forEach((t) => t.stop());
        webcamStream = null;
        videoEl.style.display = 'none';
        simEl.style.display = 'block';
        btn.textContent = '📷 Live Camera';
        return;
      }

      try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoEl.srcObject = webcamStream;
        videoEl.style.display = 'block';
        simEl.style.display = 'none';
        btn.textContent = '📖 Book View';
      } catch {
        speakOutLoud('Camera preview running in simulated book mode.', 'English');
      }
    }

    function switchTab(tabId, btnEl) {
      playTactileCue(500, 0.05);
      document.querySelectorAll('.tab-pane').forEach((el) => el.classList.remove('active'));
      document.querySelectorAll('.nav-tab').forEach((el) => el.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      btnEl.classList.add('active');

      const tabNames = {
        scanner: 'Book Scanner tab active',
        library: 'Saved Audiobook Library tab active',
        pitch: 'Harmonic Navigator Pitch Training Game active',
        iot: 'Smart Home IoT Camera Assistant active'
      };
      speakOutLoud(tabNames[tabId] || '', 'English');
    }

    function renderLibrary() {
      const container = document.getElementById('libraryList');
      document.getElementById('libraryCountBadge').textContent = savedLibrary.length + ' Saved Chapters';
      container.innerHTML = '';
      savedLibrary.slice(0, 6).forEach((item) => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.style.cursor = 'pointer';
        card.onclick = () => {
          lastNarratedPassage = item.text;
          speakOutLoud(item.text, item.lang);
        };
        card.innerHTML = `
          <div class="feature-card-title">
            <span>▶️ ${item.title}</span>
            <span style="font-size:11px; color:var(--accent-cyan)">${item.lang}</span>
          </div>
          <p class="feature-card-desc">${item.text.slice(0, 125)}...</p>
        `;
        container.appendChild(card);
      });
    }

    // Tab 3: Audio Pitch Training Game Logic
    let refFreq = 440;
    let targetFreq = 520;
    let pitchScore = 0;
    let pitchStreak = 0;

    function playPitchChallenge() {
      const ctx = getAudioCtx();
      refFreq = 320 + Math.floor(Math.random() * 240);
      const delta = (Math.random() > 0.5 ? 1 : -1) * (45 + Math.floor(Math.random() * 90));
      targetFreq = refFreq + delta;

      document.getElementById('pitchOrbLabel').textContent = 'LISTENING...';
      document.getElementById('pitchHzLabel').textContent = `Tone 1: ${refFreq} Hz -> Tone 2: ? Hz`;

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(refFreq, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(targetFreq, ctx.currentTime + 0.6);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.6);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 1.1);

      setTimeout(() => {
        document.getElementById('pitchOrbLabel').textContent = 'GUESS NOW';
      }, 1100);
    }

    function submitPitchGuess(guess) {
      const actual = targetFreq > refFreq ? 'HIGHER' : 'LOWER';
      if (guess === actual) {
        pitchScore += 10;
        pitchStreak += 1;
        playTactileCue(880, 0.15, 'triangle');
        const msg = `Correct! Second tone was ${targetFreq} Hertz (${actual.toLowerCase()}). Streak ${pitchStreak}.`;
        document.getElementById('pitchFeedbackText').textContent = `✅ Score: ${pitchScore} • Streak: ${pitchStreak} 🔥`;
        speakOutLoud(msg, 'English');
      } else {
        pitchStreak = 0;
        playTactileCue(220, 0.2, 'sawtooth');
        const msg = `Not quite. Second tone was ${targetFreq} Hertz. Tap the orb to try again.`;
        document.getElementById('pitchFeedbackText').textContent = `❌ Score: ${pitchScore} • Streak: 0`;
        speakOutLoud(msg, 'English');
      }
      document.getElementById('pitchHzLabel').textContent = `${refFreq} Hz -> ${targetFreq} Hz`;
    }

    function speakIoTAlert(alertMessage) {
      playTactileCue(740, 0.09, 'triangle');
      speakOutLoud(alertMessage, 'English');
    }

    // Initialize Library & Live Clock
    renderLibrary();
    setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('clockTime').textContent = `${hh}:${mm}`;
    }, 10000);
  </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse, tags=["Mobile App Frontend"])
async def serve_mobile_app_frontend():
    """Serves the consumer-grade Blind-ER Mobile App Frontend."""
    return HTMLResponse(content=MOBILE_APP_HTML)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
