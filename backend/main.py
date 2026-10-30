"""
Blind-ER — FastAPI Backend Entrypoint & Live Accessible Mobile App Frontend
Implements the Apple-inspired Minimalist High-Contrast Voice-First UX:
  - Step 1: `AccessibleTouchable` (1 Tap = TTS Readout, 2 Taps = Execute Action)
  - Screen 1: `OnboardingScreen` (Auto-play voice intro + Visual Impairment Profile)
  - Screen 2: `HomeScreen` (Top 60% Massive "Book Scanner" Hero + Bottom 40% 2x2 Grid)
  - Screen 3: `BookScannerScreen` via `FeatureLayoutTemplate` (Top 75% Camera & Text +
    Bottom 25% Fixed 4-to-5 Button Bar: Back | Capture | Read/Stop | Next | More)
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
  <title>Blind-ER — Voice-First Assistive App</title>
  <style>
    :root {
      color-scheme: dark;
      --apple-surface: #000000;
      --apple-primary: #1D1D1F;
      --apple-raised: #27292C;
      --apple-canvas: #FFFFFF;
      --apple-faint: #F5F5F7;
      --apple-muted: #86868B;
      --apple-focus: #0071E3;
      --apple-accent: #6086BD;
      --high-vis-yellow: #FFD600;
    }

    @media (forced-colors: active) {
      :root {
        --apple-surface: Canvas;
        --apple-primary: Canvas;
        --apple-canvas: CanvasText;
        --high-vis-yellow: Highlight;
        --apple-focus: LinkText;
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
      background: #0C0F12;
      color: var(--apple-canvas);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    /* Apple iPhone Frame */
    .device-shell {
      width: 412px;
      height: 868px;
      background: #000000;
      border-radius: 48px;
      padding: 12px;
      border: 3px solid #333538;
      display: flex;
      flex-direction: column;
    }

    .device-viewport {
      flex: 1;
      background: var(--apple-surface);
      border-radius: 36px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      border: 2px solid #27292C;
    }

    /* Minimal Status Header */
    .ios-bar {
      height: 44px;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--apple-faint);
      border-bottom: 1px solid #1B1D20;
      flex-shrink: 0;
    }

    .tts-live-pill {
      background: #1D1D1F;
      border: 1px solid var(--high-vis-yellow);
      color: var(--high-vis-yellow);
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }

    /* Screen Container */
    .app-screen {
      display: none;
      flex: 1;
      flex-direction: column;
      background: var(--apple-surface);
    }

    .app-screen.active {
      display: flex;
    }

    /* AccessibleTouchable Universal Styling */
    .a11y-touchable {
      cursor: pointer;
      transition: transform 0.08s ease, border-color 0.12s ease, background-color 0.12s ease;
      position: relative;
    }

    .a11y-touchable:focus-visible,
    .a11y-touchable.focused-touch {
      outline: 3px solid var(--apple-focus);
      outline-offset: -3px;
      border-color: var(--apple-focus) !important;
    }

    .a11y-touchable:active {
      transform: scale(0.97);
    }

    /* ===================================================================== */
    /* SCREEN 1: ONBOARDING SCREEN                                           */
    /* ===================================================================== */
    .onboarding-wrap {
      flex: 1;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
    }

    .onboarding-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .eyebrow {
      color: var(--high-vis-yellow);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .display-title {
      color: var(--apple-canvas);
      font-size: 32px;
      font-weight: 600;
      line-height: 1.15;
    }

    .body-sub {
      color: var(--apple-muted);
      font-size: 16px;
      font-weight: 400;
      line-height: 1.35;
    }

    .onboarding-options {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .profile-card {
      flex: 1;
      width: 100%;
      padding: 24px;
      border-radius: 11px;
      border: 3px solid var(--high-vis-yellow);
      background: var(--apple-primary);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      text-align: left;
    }

    .profile-card.option-b {
      background: #1B1D20;
      border-color: var(--apple-canvas);
    }

    .profile-card-title {
      font-size: 30px;
      font-weight: 600;
      line-height: 1.18;
      color: var(--high-vis-yellow);
      margin: 6px 0 8px;
    }

    .profile-card.option-b .profile-card-title {
      color: var(--apple-canvas);
    }

    .profile-card-desc {
      font-size: 16px;
      font-weight: 400;
      color: var(--apple-faint);
      line-height: 1.35;
    }

    /* ===================================================================== */
    /* SCREEN 2: MINIMALIST HOME SCREEN (60% HERO / 40% 2x2 GRID)            */
    /* ===================================================================== */
    .home-wrap {
      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .home-hero-60 {
      flex: 6;
      width: 100%;
      background: var(--high-vis-yellow);
      color: #000000;
      border: 3px solid var(--apple-canvas);
      border-radius: 11px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .hero-eyebrow {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #1D1D1F;
      margin-bottom: 12px;
    }

    .hero-icon {
      font-size: 52px;
      margin-bottom: 12px;
    }

    .hero-label {
      font-size: 42px;
      font-weight: 600;
      color: #000000;
      line-height: 1.1;
      margin-bottom: 10px;
    }

    .hero-hint {
      font-size: 16px;
      font-weight: 600;
      color: #1D1D1F;
    }

    .home-secondary-40 {
      flex: 4;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 16px;
    }

    .secondary-tile {
      background: var(--apple-primary);
      border: 2px solid var(--apple-faint);
      border-radius: 11px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 6px;
    }

    .tile-icon { font-size: 26px; }
    .tile-label {
      font-size: 19px;
      font-weight: 600;
      color: var(--apple-canvas);
    }

    /* ===================================================================== */
    /* SCREEN 3: FEATURE LAYOUT TEMPLATE (75% HERO / 25% BOTTOM BAR)         */
    /* ===================================================================== */
    .feature-template-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .feature-hero-75 {
      flex: 7.5;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow: hidden;
    }

    .scanner-camera-box {
      flex: 4.2;
      background: var(--apple-primary);
      border: 3px solid var(--high-vis-yellow);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 14px;
    }

    .book-strip-preview {
      width: 90%;
      background: #F5F5F7;
      color: #1D1D1F;
      padding: 12px 14px;
      font-family: Georgia, serif;
      font-size: 13px;
      line-height: 1.4;
      border-left: 4px solid var(--high-vis-yellow);
    }

    .camera-Meta-row {
      position: absolute;
      top: 8px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .upload-pill {
      background: #000000;
      color: var(--high-vis-yellow);
      border: 1.5px solid var(--high-vis-yellow);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }

    .scanner-text-overlay {
      flex: 5.8;
      background: var(--apple-primary);
      border: 3px solid var(--apple-canvas);
      padding: 18px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .overlay-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .overlay-scroll {
      flex: 1;
      overflow-y: auto;
    }

    .overlay-reader-text {
      color: var(--apple-canvas);
      font-size: 23px;
      font-weight: 600;
      line-height: 1.42;
      user-select: text;
    }

    /* Fixed 25% Bottom Control Bar (4 to 5 Massive Flexbox Buttons) */
    .feature-bottom-bar-25 {
      flex: 2.5;
      background: #000000;
      border-top: 3px solid var(--high-vis-yellow);
      padding: 10px 8px;
      display: flex;
      flex-direction: row;
      gap: 8px;
    }

    .bar-btn {
      flex: 1;
      height: 100%;
      border-radius: 8px;
      border: 3px solid var(--apple-canvas);
      background: var(--apple-primary);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 6px 4px;
      text-align: center;
      gap: 6px;
    }

    .bar-btn.capture-primary {
      background: var(--high-vis-yellow);
      border-color: var(--apple-canvas);
      color: #000000;
    }

    .bar-btn.read-secondary {
      background: var(--apple-primary);
      border-color: var(--high-vis-yellow);
    }

    .bar-btn.more-overflow {
      background: #1B1D20;
      border-color: var(--apple-accent);
    }

    .bar-icon {
      font-size: 26px;
      font-weight: 600;
      line-height: 1;
    }

    .bar-label {
      font-size: 16px;
      font-weight: 600;
      color: var(--apple-canvas);
    }

    .bar-btn.capture-primary .bar-icon,
    .bar-btn.capture-primary .bar-label {
      color: #000000;
    }

    .bar-btn.read-secondary .bar-label,
    .bar-btn.more-overflow .bar-label {
      color: var(--high-vis-yellow);
    }

    /* Spoken Subtitle Banner */
    .tts-caption-bar {
      background: #1D1D1F;
      border-top: 1px solid #333538;
      padding: 8px 16px;
      font-size: 12px;
      color: var(--high-vis-yellow);
      font-weight: 600;
      text-align: center;
      flex-shrink: 0;
      min-height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 480px) {
      body { padding: 0; }
      .device-shell { width: 100vw; height: 100vh; border-radius: 0; padding: 0; border: none; }
      .device-viewport { border-radius: 0; border: none; }
    }
  </style>
</head>
<body>

  <main class="device-shell" aria-label="Blind-ER Assistive Mobile App">
    <div class="device-viewport">

      <!-- Top Status Bar -->
      <div class="ios-bar">
        <span>9:41</span>
        <span class="tts-live-pill" id="a11yModeBadge">1-Tap: Read • 2-Tap: Select</span>
        <span>5G 100%</span>
      </div>

      <!-- ================================================================= -->
      <!-- SCREEN 1: AUDIO ONBOARDING & SETUP (OnboardingScreen.js)          -->
      <!-- ================================================================= -->
      <section class="app-screen active" id="screen-onboarding" aria-label="Audio Onboarding Screen">
        <div class="onboarding-wrap">
          <div class="onboarding-header" onclick="playOnboardingIntro()" style="cursor:pointer">
            <span class="eyebrow">BLIND-ER • VOICE-FIRST SETUP (TAP TO HEAR INTRO)</span>
            <h1 class="display-title">Select your visual experience level.</h1>
            <p class="body-sub">
              Tap any item once to hear what it is. Double-tap to select it.
            </p>
          </div>

          <div class="onboarding-options">
            <!-- Option A -->
            <button
              type="button"
              class="profile-card a11y-touchable"
              data-label="Option A: Partially Blind or Low Vision"
              data-hint="Sets interface to high contrast yellow on black with large text. Double tap to select."
              data-action="select-low-vision"
            >
              <span class="eyebrow">OPTION A • HIGH CONTRAST</span>
              <div class="profile-card-title">Partially Blind /<br/>Low Vision</div>
              <p class="profile-card-desc">
                High-contrast color blocking &amp; oversized SF Pro typography
              </p>
            </button>

            <!-- Option B -->
            <button
              type="button"
              class="profile-card option-b a11y-touchable"
              data-label="Option B: Fully Blind"
              data-hint="Relies entirely on audio feedback and maximizes edge to edge touch targets. Double tap to select."
              data-action="select-fully-blind"
            >
              <span class="eyebrow" style="color:#6086BD">OPTION B • AUDIO-FIRST</span>
              <div class="profile-card-title">Fully Blind</div>
              <p class="profile-card-desc">
                Complete voice guidance &amp; maximum full-width touch zones
              </p>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 2: MINIMALIST HOME SCREEN (HomeScreen.js)                  -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-home" aria-label="Minimalist Home Screen">
        <div class="home-wrap">
          <!-- Top 60% Hero Element: Massive "Book Scanner" Button -->
          <button
            type="button"
            class="home-hero-60 a11y-touchable"
            data-label="Book Scanner"
            data-hint="Double tap to open camera."
            data-action="nav-scanner"
          >
            <span class="hero-eyebrow">PRIMARY AI TOOL • TOP 60%</span>
            <span class="hero-icon" aria-hidden="true">📖</span>
            <span class="hero-label">Book Scanner</span>
            <span class="hero-hint">1 Tap: Hear Label • 2 Taps: Open Camera</span>
          </button>

          <!-- Bottom 40% Secondary Elements: 2x2 Grid of Massive Hitboxes -->
          <div class="home-secondary-40">
            <button
              type="button"
              class="secondary-tile a11y-touchable"
              style="border-color: var(--high-vis-yellow);"
              data-label="Meta Smart Glasses"
              data-hint="Ray-Ban Meta Smart Glasses live P O V monitoring. Double tap to connect."
              data-action="nav-hardware-meta"
            >
              <span class="tile-icon" aria-hidden="true">🕶️</span>
              <span class="tile-label" style="color: var(--high-vis-yellow);">Meta Glasses</span>
            </button>

            <button
              type="button"
              class="secondary-tile a11y-touchable"
              style="border-color: #6086BD;"
              data-label="Be My Eyes Extension"
              data-hint="Connect to Be My Eyes volunteer and AI visual bridge. Double tap to open."
              data-action="nav-hardware-bemyeyes"
            >
              <span class="tile-icon" aria-hidden="true">🤝</span>
              <span class="tile-label">Be My Eyes</span>
            </button>

            <button
              type="button"
              class="secondary-tile a11y-touchable"
              data-label="Auditory Games"
              data-hint="Audio pitch training game. Double tap to play a pitch challenge."
              data-action="play-pitch-demo"
            >
              <span class="tile-icon" aria-hidden="true">🎯</span>
              <span class="tile-label">Auditory Games</span>
            </button>

            <button
              type="button"
              class="secondary-tile a11y-touchable"
              data-label="Settings"
              data-hint="Double tap to return to visual impairment onboarding setup."
              data-action="nav-onboarding"
            >
              <span class="tile-icon" aria-hidden="true">⚙️</span>
              <span class="tile-label">Settings</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 4: HARDWARE & EXTENSION HUB (HardwareHubScreen.js)         -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-hardware" aria-label="Ray-Ban Meta Smart Glasses and Be My Eyes Hub">
        <div class="feature-template-wrap">

          <!-- TOP / MIDDLE AREA (75% HERO CONTENT) -->
          <div class="feature-hero-75">
            <!-- Ray-Ban Meta Smart Glasses Live POV HUD -->
            <div
              class="scanner-camera-box a11y-touchable"
              id="hwHudBox"
              data-label="Ray-Ban Meta Smart Glasses Live Point of View Feed"
              data-hint="Double tap to trigger real-time scene monitoring."
              data-action="hw-meta-live"
            >
              <video
                id="hwWebcamVideo"
                autoplay
                playsinline
                muted
                style="display:none; position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.55;"
              ></video>

              <div class="camera-meta-row" onclick="event.stopPropagation()" style="z-index:2;">
                <span class="eyebrow" id="hwDeviceBanner">🕶️ META GLASSES • BLE 94% • 12ms</span>
                <button type="button" class="upload-pill" onclick="toggleHardwareWebcam(event)" id="hwCamToggleBtn">
                  📷 Live POV Cam
                </button>
              </div>

              <div class="book-strip-preview" id="hwSceneBox" style="z-index:2; background:#0C0F12; color:#FFFFFF; border:2px solid var(--high-vis-yellow);">
                <div style="font-family:-apple-system,sans-serif; font-size:11px; font-weight:700; color:var(--high-vis-yellow); margin-bottom:4px;" id="hwSceneTitle">
                  POV SCENE 1/3: URBAN CROSSWALK &amp; TRAFFIC SIGNAL
                </div>
                <div style="font-family:monospace; font-size:14px; font-weight:700; color:#FFFFFF; margin-bottom:4px;" id="hwSceneBanner">
                  [HUD TARGET] WALK SIGNAL: 14 SEC • 5TH AVE
                </div>
                <div style="font-family:-apple-system,sans-serif; font-size:12px; color:#F5F5F7;" id="hwSceneDesc">
                  Pedestrian crossing countdown active. Tactile paving aligned at 12 o'clock; cyclist stopped on left.
                </div>
              </div>
            </div>

            <!-- Bone-Conduction Audio & Be My Eyes Bridge Output Card -->
            <div class="scanner-text-overlay">
              <div class="overlay-top-row">
                <span class="eyebrow" id="hwBridgeBadge">🔊 META GLASSES SPATIAL AUDIO</span>
                <span class="tts-live-pill" id="hwAutoPill">MANUAL</span>
              </div>
              <div class="overlay-scroll">
                <p class="overlay-reader-text" id="hwOutputText" style="font-size:20px;">
                  Ray-Ban Meta Smart Glasses connected via Bluetooth LE. Double-tap "Meta Live" for hands-free spatial monitoring, or double-tap "Be My Eyes" to bridge a live volunteer + AI interpreter.
                </p>
              </div>
            </div>
          </div>

          <!-- BOTTOM CONTROL BAR (25% FIXED, 5 MASSIVE FLEXBOX BUTTONS) -->
          <div class="feature-bottom-bar-25" role="menubar" aria-label="Hardware Hub Control Bar">
            <!-- Button 1 (Far Left): Back -->
            <button
              type="button"
              class="bar-btn a11y-touchable"
              data-label="Back"
              data-hint="Double tap to stop hardware stream and return to Home Screen."
              data-action="nav-home"
            >
              <span class="bar-icon" aria-hidden="true">←</span>
              <span class="bar-label">Back</span>
            </button>

            <!-- Button 2 (Center Left): Meta Glasses Live Scan -->
            <button
              type="button"
              class="bar-btn capture-primary a11y-touchable"
              data-label="Meta Glasses Live Scan"
              data-hint="Double tap to scan your current point of view with Ray-Ban Meta Smart Glasses."
              data-action="hw-meta-live"
            >
              <span class="bar-icon" aria-hidden="true">🕶️</span>
              <span class="bar-label">Meta Live</span>
            </button>

            <!-- Button 3 (Center Right): Be My Eyes App Extension Bridge -->
            <button
              type="button"
              class="bar-btn read-secondary a11y-touchable"
              data-label="Be My Eyes Extension Bridge"
              data-hint="Double tap to stream your smart glasses view to the Be My Eyes volunteer and AI visual assistant."
              data-action="hw-bemyeyes"
            >
              <span class="bar-icon" aria-hidden="true">🤝</span>
              <span class="bar-label">Be My Eyes</span>
            </button>

            <!-- Button 4 (Far Right): Next POV Scene -->
            <button
              type="button"
              class="bar-btn a11y-touchable"
              data-label="Next Environment Scene"
              data-hint="Double tap to switch between Crosswalk, Pharmacy Medicine Bottle, and Bookstore scenes."
              data-action="hw-next-scene"
            >
              <span class="bar-icon" aria-hidden="true">→</span>
              <span class="bar-label">Scene</span>
            </button>

            <!-- Button 5 (Overflow Rule — Max 5 Buttons): Auto-Monitor Loop -->
            <button
              type="button"
              class="bar-btn more-overflow a11y-touchable"
              id="hwMoreAutoBtn"
              data-label="More Continuous Monitoring Menu"
              data-hint="Double tap to toggle continuous real-time smart glasses monitoring every 8 seconds."
              data-action="hw-more-auto"
            >
              <span class="bar-icon" aria-hidden="true">•••</span>
              <span class="bar-label" id="hwMoreAutoLabel">Auto</span>
            </button>
          </div>

        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 3: BOOK SCANNER FEATURE TEMPLATE (BookScannerScreen.js)    -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-scanner" aria-label="Book to Audio Scanner">
        <div class="feature-template-wrap">

          <!-- TOP / MIDDLE AREA (75% HERO CONTENT) -->
          <div class="feature-hero-75">
            <!-- Camera View -->
            <div
              class="scanner-camera-box a11y-touchable"
              data-label="Camera Viewfinder"
              data-hint="Point at book page. Double tap to capture page."
              data-action="scanner-capture"
            >
              <div class="camera-meta-row" onclick="event.stopPropagation()">
                <span class="eyebrow" id="crnnBadgeText">CRNN 99.6% • DOCUMENT LENS</span>
                <label class="upload-pill">
                  📁 Upload Photo
                  <input type="file" accept="image/*" style="display:none" onchange="handleFileUpload(event)" />
                </label>
              </div>

              <div class="book-strip-preview" id="bookPreviewBox">
                <strong>CHAPTER IV: THE SILENT LIGHTHOUSE (p. 42)</strong><br/>
                The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying with it the bitter scent of salt and approaching storm...
              </div>
            </div>

            <!-- Large Text Display Overlay -->
            <div class="scanner-text-overlay">
              <div class="overlay-top-row">
                <span class="eyebrow" id="scannerLangBadge">AUDIOBOOK OUTPUT (ENGLISH)</span>
                <span class="tts-live-pill" id="scannerStatePill">READY</span>
              </div>
              <div class="overlay-scroll">
                <p class="overlay-reader-text" id="scannerOutputText">
                  Double-tap "Capture" in the bottom bar to extract text with CRNN and narrate with Gemini 3 Flash. Tap any button once to hear what it does.
                </p>
              </div>
            </div>
          </div>

          <!-- BOTTOM CONTROL BAR (25% FIXED, 5 MASSIVE FLEXBOX BUTTONS) -->
          <div class="feature-bottom-bar-25" role="menubar" aria-label="Feature Control Bar">
            <!-- Button 1 (Far Left): Back / Before -->
            <button
              type="button"
              class="bar-btn a11y-touchable"
              data-label="Back"
              data-hint="Double tap to return to the Home Screen."
              data-action="nav-home"
            >
              <span class="bar-icon" aria-hidden="true">←</span>
              <span class="bar-label">Back</span>
            </button>

            <!-- Button 2 (Center Left): Capture -->
            <button
              type="button"
              class="bar-btn capture-primary a11y-touchable"
              data-label="Capture"
              data-hint="Double tap to scan the book page and translate with AI."
              data-action="scanner-capture"
            >
              <span class="bar-icon" aria-hidden="true">◎</span>
              <span class="bar-label">Capture</span>
            </button>

            <!-- Button 3 (Center Right): Read / Stop -->
            <button
              type="button"
              class="bar-btn read-secondary a11y-touchable"
              id="readStopBtn"
              data-label="Read Aloud"
              data-hint="Double tap to start or stop reading the scanned passage."
              data-action="scanner-read-stop"
            >
              <span class="bar-icon" id="readStopIcon" aria-hidden="true">🔊</span>
              <span class="bar-label" id="readStopLabel">Read</span>
            </button>

            <!-- Button 4 (Far Right): Next -->
            <button
              type="button"
              class="bar-btn a11y-touchable"
              data-label="Next Page"
              data-hint="Double tap to advance to the next book page and scan."
              data-action="scanner-next"
            >
              <span class="bar-icon" aria-hidden="true">→</span>
              <span class="bar-label">Next</span>
            </button>

            <!-- Button 5 (Overflow Rule — Max 5 Buttons): More Auditory Menu -->
            <button
              type="button"
              class="bar-btn more-overflow a11y-touchable"
              data-label="More Auditory Menu"
              data-hint="Double tap to cycle target translation language."
              data-action="scanner-more"
            >
              <span class="bar-icon" aria-hidden="true">•••</span>
              <span class="bar-label">More</span>
            </button>
          </div>

        </div>
      </section>

      <!-- Live Spoken TTS Caption Footer -->
      <div class="tts-caption-bar" id="ttsCaptionBar" aria-live="polite">
        🔊 Tap once on any item to hear its voice label. Double-tap to select.
      </div>

    </div>
  </main>

  <script>
    const DOUBLE_TAP_MS = 360;
    const LANGUAGES = ['English', 'Malay', 'Spanish', 'French', 'Mandarin'];
    const LOCALES = {
      English: 'en-US',
      Malay: 'ms-MY',
      Spanish: 'es-ES',
      French: 'fr-FR',
      Mandarin: 'zh-CN'
    };

    const BOOK_PAGES = [
      {
        heading: 'CHAPTER IV: THE SILENT LIGHTHOUSE (p. 42)',
        strip: 'Silent Light.',
        preview: 'The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying with it the bitter scent of salt and approaching storm...'
      },
      {
        heading: 'CHAPTER V: BENEATH NORTHERN STARS (p. 43)',
        strip: 'Dark storm.',
        preview: 'Elara raised her lantern toward the stone tower. Beyond the breakers, a distant bell echoed three times across the freezing bay...'
      }
    ];

    const HARDWARE_SCENES = [
      {
        id: 'CROSSWALK',
        title: 'POV SCENE 1/3: URBAN CROSSWALK & TRAFFIC SIGNAL',
        banner: '[HUD TARGET] WALK SIGNAL: 14 SEC • 5TH AVE',
        desc: 'Pedestrian crossing countdown active. Tactile paving aligned at 12 o\'clock; cyclist stopped on left.'
      },
      {
        id: 'PHARMACY',
        title: 'POV SCENE 2/3: PRESCRIPTION MEDICINE BOTTLE',
        banner: '[HUD TARGET] AMOXICILLIN 500MG • 1 CAP 8H',
        desc: 'Holding amber pharmacy bottle. High-contrast label detected by Meta Glasses 12MP POV camera.'
      },
      {
        id: 'BOOKSTORE',
        title: 'POV SCENE 3/3: HANDS-FREE BOOK READING',
        banner: '[HUD TARGET] CHAPTER IV: THE SILENT LIGHTHOUSE',
        desc: 'Open hardcover book resting on table. Hands-free page tracking via Ray-Ban Meta Smart Glasses.'
      }
    ];

    let langIndex = 0;
    let pageIndex = 0;
    let hwSceneIndex = 0;
    let hwAutoInterval = null;
    let hwStream = null;
    let isSpeakingPassage = false;
    let lastNarratedText = '';
    let audioCtx = null;

    function playHapticTone(freq = 520, duration = 0.06) {
      try {
        if (!audioCtx) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch {}
    }

    function speakTTS(text, lang = 'English', onEnd = null) {
      document.getElementById('ttsCaptionBar').textContent = '🔊 "' + text.slice(0, 88) + (text.length > 88 ? '..."' : '"');
      if (!('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LOCALES[lang] || 'en-US';
      u.rate = 0.96;
      u.onend = () => {
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(u);
    }

    function playOnboardingIntro() {
      speakTTS(
        'Welcome to Blind-ER. This app uses a custom voice interface. Tap any item once to hear what it is. Double-tap to select it. Please select your level of visual impairment to optimize your experience.'
      );
    }

    function navigateToScreen(screenId, announcement) {
      document.querySelectorAll('.app-screen').forEach((s) => s.classList.remove('active'));
      document.getElementById('screen-' + screenId).classList.add('active');
      if (announcement) {
        speakTTS(announcement);
      }
    }

    // =======================================================================
    // STEP 1: AccessibleTouchable Engine (1 Tap = TTS Readout, 2 Taps = Act)
    // =======================================================================
    function attachAccessibleTouchableEngine() {
      const elements = document.querySelectorAll('.a11y-touchable');
      elements.forEach((el) => {
        let lastTap = 0;
        let singleTapTimer = null;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const now = Date.now();
          const delta = now - lastTap;

          document.querySelectorAll('.a11y-touchable').forEach((b) => b.classList.remove('focused-touch'));
          el.classList.add('focused-touch');

          const label = el.getAttribute('data-label') || el.innerText.trim();
          const hint = el.getAttribute('data-hint') || 'Double tap to select.';
          const action = el.getAttribute('data-action');

          if (delta > 0 && delta < DOUBLE_TAP_MS) {
            // DOUBLE TAP -> Execute primary action
            if (singleTapTimer) {
              clearTimeout(singleTapTimer);
              singleTapTimer = null;
            }
            lastTap = 0;
            playHapticTone(840, 0.1);
            executeAccessibleAction(action);
          } else {
            // ONE TAP -> Do NOT execute action; speak button label & hint via TTS
            lastTap = now;
            singleTapTimer = setTimeout(() => {
              playHapticTone(440, 0.05);
              speakTTS(label + '. ' + hint);
              singleTapTimer = null;
            }, DOUBLE_TAP_MS);
          }
        });
      });
    }

    async function executeAccessibleAction(actionName) {
      if (actionName === 'select-low-vision') {
        document.getElementById('a11yModeBadge').textContent = 'Mode: Low Vision (AAA)';
        navigateToScreen(
          'home',
          'Partially Blind, Low Vision mode selected. Home Screen. Top 60 percent is Book Scanner. Tap once to hear, double tap to select.'
        );
      } else if (actionName === 'select-fully-blind') {
        document.getElementById('a11yModeBadge').textContent = 'Mode: Fully Blind (Audio)';
        navigateToScreen(
          'home',
          'Fully Blind audio mode selected. Home Screen. Top 60 percent is Book Scanner. Tap once to hear, double tap to select.'
        );
      } else if (actionName === 'nav-scanner') {
        navigateToScreen(
          'scanner',
          'Book Scanner opened. Top area holds camera and text. Bottom bar has 5 buttons: Back, Capture, Read, Next, and More.'
        );
      } else if (actionName === 'nav-hardware-meta') {
        document.getElementById('hwBridgeBadge').textContent = '🔊 META GLASSES SPATIAL AUDIO';
        navigateToScreen(
          'hardware',
          'Ray-Ban Meta Smart Glasses connected via Bluetooth Low Energy. Battery 94 percent. Double tap Meta Live for real-time scene monitoring, or double tap Be My Eyes for volunteer bridge.'
        );
      } else if (actionName === 'nav-hardware-bemyeyes') {
        document.getElementById('hwBridgeBadge').textContent = '🤝 BE MY EYES VOLUNTEER + AI BRIDGE';
        navigateToScreen(
          'hardware',
          'Be My Eyes Assistive Extension ready. Double tap Be My Eyes in the bottom bar to stream your smart glasses view to an AI and live volunteer interpreter.'
        );
      } else if (actionName === 'nav-home') {
        if (hwAutoInterval) {
          clearInterval(hwAutoInterval);
          hwAutoInterval = null;
          document.getElementById('hwAutoPill').textContent = 'MANUAL';
        }
        isSpeakingPassage = false;
        updateReadStopUI(false);
        navigateToScreen('home', 'Returned to Home Screen.');
      } else if (actionName === 'nav-onboarding') {
        navigateToScreen('onboarding', 'Returned to Visual Impairment Setup.');
      } else if (actionName === 'play-pitch-demo') {
        playHapticTone(440, 0.25);
        setTimeout(() => playHapticTone(660, 0.25), 350);
        speakTTS('Auditory Pitch Training Game: Reference tone 440 Hertz, second tone 660 Hertz, Higher Pitch.');
      } else if (actionName === 'iot-status') {
        speakTTS('Smart Home I O T Camera Report: Living room path is clear. Your keys are on the dining table at 10 o clock.');
      } else if (actionName === 'read-saved') {
        const textToRead = lastNarratedText || 'Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland.';
        speakTTS(textToRead, LANGUAGES[langIndex]);
      } else if (actionName === 'scanner-capture') {
        await runBookCapturePipeline();
      } else if (actionName === 'scanner-read-stop') {
        toggleReadOrStop();
      } else if (actionName === 'scanner-next') {
        pageIndex = (pageIndex + 1) % BOOK_PAGES.length;
        const p = BOOK_PAGES[pageIndex];
        document.getElementById('bookPreviewBox').innerHTML = `<strong>${p.heading}</strong><br/>${p.preview}`;
        speakTTS('Next page loaded. Capturing page.');
        await runBookCapturePipeline();
      } else if (actionName === 'scanner-more') {
        langIndex = (langIndex + 1) % LANGUAGES.length;
        const newLang = LANGUAGES[langIndex];
        document.getElementById('scannerLangBadge').textContent = `AUDIOBOOK OUTPUT (${newLang.toUpperCase()})`;
        speakTTS(`More Menu: Target language changed to ${newLang}. Double tap Capture to translate.`);
      } else if (actionName === 'hw-meta-live') {
        await runHardwareAssist('META_GLASSES');
      } else if (actionName === 'hw-bemyeyes') {
        await runHardwareAssist('BE_MY_EYES');
      } else if (actionName === 'hw-next-scene') {
        cycleHardwareScene();
      } else if (actionName === 'hw-more-auto') {
        toggleHardwareAutoMonitor();
      }
    }

    function cycleHardwareScene() {
      hwSceneIndex = (hwSceneIndex + 1) % HARDWARE_SCENES.length;
      const sc = HARDWARE_SCENES[hwSceneIndex];
      document.getElementById('hwSceneTitle').textContent = sc.title;
      document.getElementById('hwSceneBanner').textContent = sc.banner;
      document.getElementById('hwSceneDesc').textContent = sc.desc;
      speakTTS(`Environment switched to ${sc.title}. Double tap Meta Live or Be My Eyes to analyze.`);
    }

    async function runHardwareAssist(deviceMode) {
      const sc = HARDWARE_SCENES[hwSceneIndex];
      const targetLanguage = LANGUAGES[langIndex];
      const isBeMyEyes = deviceMode === 'BE_MY_EYES';

      document.getElementById('hwBridgeBadge').textContent = isBeMyEyes
        ? '🤝 BE MY EYES VOLUNTEER + AI BRIDGE'
        : '🔊 META GLASSES SPATIAL AUDIO';
      document.getElementById('hwAutoPill').textContent = isBeMyEyes ? 'BRIDGING...' : 'SCANNING POV...';

      speakTTS(
        isBeMyEyes
          ? 'Connecting Ray-Ban Meta video stream to Be My Eyes extension bridge.'
          : 'Ray-Ban Meta Smart Glasses scanning point of view.'
      );

      try {
        const res = await fetch('/api/hardware-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_mode: deviceMode,
            scene_id: sc.id,
            target_language: targetLanguage
          })
        });
        const data = await res.json();
        document.getElementById('hwOutputText').textContent = data.spoken_guidance;
        const conf = data.crnn_confidence ? (data.crnn_confidence * 100).toFixed(1) + '%' : '99.6%';
        document.getElementById('hwDeviceBanner').textContent = isBeMyEyes
          ? `🤝 BE MY EYES • CRNN ${conf} • LIVE`
          : `🕶️ META GLASSES • CRNN ${conf} • 12ms`;
        document.getElementById('hwAutoPill').textContent = hwAutoInterval ? 'AUTO: LIVE 8s' : 'LIVE READY';
        speakTTS(data.spoken_guidance, targetLanguage);
      } catch (err) {
        document.getElementById('hwAutoPill').textContent = 'OFFLINE';
        speakTTS('Hardware bridge error. Please verify backend server.');
      }
    }

    function toggleHardwareAutoMonitor() {
      if (hwAutoInterval) {
        clearInterval(hwAutoInterval);
        hwAutoInterval = null;
        document.getElementById('hwAutoPill').textContent = 'MANUAL';
        document.getElementById('hwMoreAutoLabel').textContent = 'Auto';
        speakTTS('Continuous Meta Glasses monitoring paused.');
      } else {
        document.getElementById('hwAutoPill').textContent = 'AUTO: LIVE 8s';
        document.getElementById('hwMoreAutoLabel').textContent = 'Stop';
        speakTTS('Continuous real-time Meta Glasses monitoring enabled. Scanning every 8 seconds.');
        runHardwareAssist('META_GLASSES');
        hwAutoInterval = setInterval(() => {
          hwSceneIndex = (hwSceneIndex + 1) % HARDWARE_SCENES.length;
          const sc = HARDWARE_SCENES[hwSceneIndex];
          document.getElementById('hwSceneTitle').textContent = sc.title;
          document.getElementById('hwSceneBanner').textContent = sc.banner;
          document.getElementById('hwSceneDesc').textContent = sc.desc;
          runHardwareAssist('META_GLASSES');
        }, 8500);
      }
    }

    async function toggleHardwareWebcam(event) {
      event.stopPropagation();
      const video = document.getElementById('hwWebcamVideo');
      const btn = document.getElementById('hwCamToggleBtn');
      if (hwStream) {
        hwStream.getTracks().forEach((t) => t.stop());
        hwStream = null;
        video.style.display = 'none';
        btn.textContent = '📷 Live POV Cam';
        speakTTS('Simulated Ray-Ban Meta P O V feed active.');
        return;
      }
      try {
        hwStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = hwStream;
        video.style.display = 'block';
        btn.textContent = '⏹ Stop POV Cam';
        speakTTS('Live camera connected to Ray-Ban Meta Smart Glasses HUD.');
      } catch {
        speakTTS('Camera permission unavailable. Using simulated Meta Glasses P O V stream.');
      }
    }

    function updateReadStopUI(speaking) {
      isSpeakingPassage = speaking;
      const btn = document.getElementById('readStopBtn');
      document.getElementById('readStopIcon').textContent = speaking ? '⏹' : '🔊';
      document.getElementById('readStopLabel').textContent = speaking ? 'Stop' : 'Read';
      btn.setAttribute('data-label', speaking ? 'Stop Audio' : 'Read Aloud');
    }

    async function runBookCapturePipeline() {
      const targetLanguage = LANGUAGES[langIndex];
      const currentPage = BOOK_PAGES[pageIndex];
      document.getElementById('scannerStatePill').textContent = 'SCANNING...';
      speakTTS('Capturing book page and running C R N N and Gemini AI.');

      try {
        const res = await fetch('/api/demo-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_language: targetLanguage,
            sample_text: currentPage.strip
          })
        });
        const data = await res.json();
        lastNarratedText = data.narrated_text;
        document.getElementById('scannerOutputText').textContent = data.narrated_text;
        const conf = data.crnn_confidence ? (data.crnn_confidence * 100).toFixed(2) + '%' : '99.62%';
        document.getElementById('crnnBadgeText').textContent = `CRNN ${conf} • ${ data.llm_model || 'GEMINI 3' }`;
        document.getElementById('scannerStatePill').textContent = 'NARRATING';

        updateReadStopUI(true);
        speakTTS(data.narrated_text, targetLanguage, () => {
          updateReadStopUI(false);
          document.getElementById('scannerStatePill').textContent = 'DONE';
        });
      } catch (err) {
        document.getElementById('scannerStatePill').textContent = 'ERROR';
        speakTTS('Scan failed. Please check backend connection.');
      }
    }

    async function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const targetLanguage = LANGUAGES[langIndex];
      document.getElementById('scannerStatePill').textContent = 'UPLOADING...';
      speakTTS('Scanning uploaded book image.');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('target_language', targetLanguage);

      try {
        const res = await fetch('/api/scan-book-page', { method: 'POST', body: formData });
        const data = await res.json();
        lastNarratedText = data.narrated_text;
        document.getElementById('scannerOutputText').textContent = data.narrated_text;
        document.getElementById('scannerStatePill').textContent = 'NARRATING';
        updateReadStopUI(true);
        speakTTS(data.narrated_text, targetLanguage, () => {
          updateReadStopUI(false);
          document.getElementById('scannerStatePill').textContent = 'DONE';
        });
      } catch {
        speakTTS('Image upload failed.');
      }
    }

    function toggleReadOrStop() {
      if (isSpeakingPassage) {
        window.speechSynthesis.cancel();
        updateReadStopUI(false);
        document.getElementById('scannerStatePill').textContent = 'PAUSED';
        speakTTS('Audio stopped.');
      } else {
        const text = lastNarratedText || 'No book page captured yet. Double tap Capture to scan a page.';
        updateReadStopUI(true);
        speakTTS(text, LANGUAGES[langIndex], () => {
          updateReadStopUI(false);
        });
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      attachAccessibleTouchableEngine();
      // Attempt auto-play of onboarding voice prompt on load
      setTimeout(() => {
        playOnboardingIntro();
      }, 400);
    });
  </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse, tags=["Mobile App Frontend"])
async def serve_mobile_app_frontend():
    """Serves the Apple-minimalist Voice-First Blind-ER Mobile App Frontend."""
    return HTMLResponse(content=MOBILE_APP_HTML)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
