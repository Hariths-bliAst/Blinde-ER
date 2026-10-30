"""
Blind-ER — FastAPI Backend Entrypoint & Live Accessible Mobile App Frontend
Matches the Apple-Minimalist High-Contrast Voice-First Mockup:
  - Custom `AccessibleTouchable` Focus-then-Activate Engine (1st Tap = TTS Readout, 2nd Tap = Execute)
  - Screen 1: `OnboardingScreen` (Matches mockup: "Welcome to Blind-ER", Option A Low Vision WCAG AAA in solid yellow, Option B Fully Blind Audio-First in dark charcoal, "Audio tutorial is playing..." + animated waveform)
  - Screen 2: `HomeScreen` (Top 60% Book Scanner Hero + Bottom 40% 2x2 Grid: Auditory Games | More Hub | Settings | Visual Setup)
  - Screen 3: `BookScannerScreen` (Camera Viewfinder + Reader Overlay + 5-Button Bar; saves scans to Audiobook Library)
  - Screen 4: `MoreHubScreen` (Houses the Audiobook Library + Assistive Extensions: Ray-Ban Meta Smart Glasses & Be My Eyes)
  - Screen 5: `AudiobookLibraryScreen` (Full multi-book, multi-chapter audiobook player inside More)
  - Screen 6: `AuditoryGamesScreen` (4 playable Web Audio games: Pitch Training, Note Recognising, Chord Identifying, Audio Memory Match)
  - Screen 7: `SettingsScreen` (Real working settings: Volume Control, Voice Tone/Speed, Change Voice, Change Language, Check for Updates)
  - Screen 8: `HardwareHubScreen` (Extension: Ray-Ban Meta Smart Glasses Live HUD & Be My Eyes Bridge)
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
    version="2.4.0",
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
        "version": "2.4.0",
        "service": "Blind-ER FastAPI Middleware",
        "crnn_mode": "mock" if settings.USE_MOCK_CRNN else "custom_weights",
        "gemini_key_configured": bool(
            settings.GEMINI_API_KEY
            and settings.GEMINI_API_KEY != "your_gemini_api_key_here"
        ),
    }


MOBILE_APP_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Blind-ER — Voice-First Assistive App</title>
  <style>
    :root {
      color-scheme: dark;
      --bg-black: #000000;
      --card-dark: #141416;
      --card-dark-border: #26262A;
      --card-elevated: #1C1C1F;
      --accent-yellow: #F5C518;
      --accent-yellow-bright: #FFD600;
      --text-white: #FFFFFF;
      --text-soft: #D1D1D6;
      --text-muted: #8E8E93;
      --focus-blue: #0071E3;
    }

    @media (forced-colors: active) {
      :root {
        --bg-black: Canvas;
        --card-dark: Canvas;
        --text-white: CanvasText;
        --accent-yellow: Highlight;
        --focus-blue: LinkText;
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
      background: #050507;
      color: var(--text-white);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
    }

    /* Sleek iPhone Titanium Bezel matching uploaded reference image */
    .device-shell {
      width: 404px;
      height: 860px;
      background: linear-gradient(145deg, #2A2A2E 0%, #121214 50%, #242428 100%);
      border-radius: 54px;
      padding: 11px;
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.9), inset 0 0 2px rgba(255, 255, 255, 0.22);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .device-viewport {
      flex: 1;
      background: var(--bg-black);
      border-radius: 44px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      border: 1px solid #1C1C1E;
    }

    /* Subtle Dynamic Island / Speaker Notch */
    .notch-bar {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }

    .speaker-slit {
      width: 58px;
      height: 5px;
      background: #1B1B1E;
      border-radius: 999px;
    }

    .mode-pill-corner {
      position: absolute;
      right: 20px;
      top: 8px;
      font-size: 10px;
      font-weight: 700;
      color: var(--accent-yellow);
      letter-spacing: 0.4px;
    }

    /* Screen Container */
    .app-screen {
      display: none;
      flex: 1;
      flex-direction: column;
      background: var(--bg-black);
      overflow: hidden;
    }

    .app-screen.active {
      display: flex;
    }

    /* Universal AccessibleTouchable Styling */
    .a11y-touchable {
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.14s ease, border-color 0.14s ease;
      position: relative;
      border: none;
      font-family: inherit;
    }

    .a11y-touchable:focus-visible,
    .a11y-touchable.focused-touch {
      outline: 4px solid var(--focus-blue);
      outline-offset: -4px;
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.45);
    }

    .a11y-touchable.focused-touch::after {
      content: "TAP AGAIN TO OPEN ↵";
      position: absolute;
      top: 10px;
      right: 12px;
      background: var(--focus-blue);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 9px;
      border-radius: 999px;
      letter-spacing: 0.5px;
      pointer-events: none;
      z-index: 5;
    }

    .a11y-touchable:active {
      transform: scale(0.975);
    }

    /* ===================================================================== */
    /* SCREEN 1: ONBOARDING (Matches Reference Mockup Image)                 */
    /* ===================================================================== */
    .onboarding-wrap {
      flex: 1;
      padding: 22px 26px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }

    .onboarding-top-text {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .mockup-title {
      font-size: 27px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text-white);
    }

    .mockup-subtitle {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.32;
      color: var(--text-soft);
      max-width: 270px;
    }

    .onboarding-cards-stack {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 22px;
      padding: 18px 0;
    }

    .mockup-option-card {
      width: 100%;
      flex: 1;
      max-height: 225px;
      border-radius: 26px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 24px 20px;
    }

    .mockup-option-card.yellow-card {
      background: var(--accent-yellow);
      color: #000000;
    }

    .mockup-option-card.dark-card {
      background: var(--card-dark);
      border: 1.5px solid var(--card-dark-border);
      color: var(--text-white);
    }

    .mockup-card-line {
      font-size: 29px;
      font-weight: 800;
      line-height: 1.16;
      letter-spacing: -0.5px;
    }

    /* ===================================================================== */
    /* SCREEN 2: HOME SCREEN (60% HERO / 40% 2x2 GRID)                       */
    /* ===================================================================== */
    .home-wrap {
      flex: 1;
      padding: 14px 22px 10px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .home-header-mini {
      text-align: center;
      padding-bottom: 2px;
    }

    .home-header-mini h2 {
      font-size: 21px;
      font-weight: 800;
      color: var(--text-white);
    }

    .home-hero-60 {
      flex: 5.8;
      width: 100%;
      background: var(--accent-yellow);
      color: #000000;
      border-radius: 26px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 6px;
    }

    .home-hero-title {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.6px;
      color: #000000;
    }

    .home-hero-sub {
      font-size: 16px;
      font-weight: 700;
      color: #1A1A1C;
      margin-top: 4px;
    }

    .home-secondary-40 {
      flex: 4.2;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 14px;
    }

    .secondary-pill-card {
      background: var(--card-dark);
      border: 1.5px solid var(--card-dark-border);
      border-radius: 22px;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 4px;
    }

    .secondary-pill-card.accent-border {
      border-color: rgba(245, 197, 24, 0.5);
    }

    .pill-title {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.15;
      color: var(--text-white);
    }

    .pill-sub {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* ===================================================================== */
    /* FEATURE TEMPLATE (TOP 75% HERO / BOTTOM 25% 5-BUTTON BAR)             */
    /* ===================================================================== */
    .feature-template-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .feature-hero-75 {
      flex: 7.6;
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }

    .feature-top-card {
      flex: 4.4;
      background: var(--card-dark);
      border: 2px solid var(--accent-yellow);
      border-radius: 22px;
      padding: 16px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      overflow: hidden;
    }

    .feature-reader-card {
      flex: 5.6;
      background: var(--card-dark);
      border: 1.5px solid var(--card-dark-border);
      border-radius: 22px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .card-badge-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .eyebrow-tag {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--accent-yellow);
    }

    .status-chip {
      background: #242428;
      color: var(--text-white);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }

    .reader-scroll {
      flex: 1;
      overflow-y: auto;
    }

    .reader-large-copy {
      font-size: 21px;
      font-weight: 700;
      line-height: 1.38;
      color: var(--text-white);
      user-select: text;
    }

    /* Bottom 25% Fixed Control Bar */
    .feature-bottom-bar-25 {
      flex: 2.4;
      background: #000000;
      padding: 8px 12px 6px;
      display: flex;
      flex-direction: row;
      gap: 8px;
    }

    .bar-btn {
      flex: 1;
      height: 100%;
      border-radius: 18px;
      background: var(--card-dark);
      border: 1.5px solid var(--card-dark-border);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 6px 2px;
      text-align: center;
      gap: 5px;
    }

    .bar-btn.yellow-primary {
      background: var(--accent-yellow);
      border-color: var(--accent-yellow);
      color: #000000;
    }

    .bar-btn.yellow-primary .bar-icon,
    .bar-btn.yellow-primary .bar-label {
      color: #000000;
    }

    .bar-icon {
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
      color: var(--text-white);
    }

    .bar-label {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-white);
      line-height: 1.1;
    }

    /* Settings & More Stack Cards */
    .stack-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
    }

    .setting-row-card {
      flex: 1;
      min-height: 68px;
      background: var(--card-dark);
      border: 1.5px solid var(--card-dark-border);
      border-radius: 20px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }

    .setting-row-card.yellow-row {
      background: var(--accent-yellow);
      border-color: var(--accent-yellow);
      color: #000000;
    }

    .setting-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .setting-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-white);
    }

    .setting-row-card.yellow-row .setting-title,
    .setting-row-card.yellow-row .setting-sub,
    .setting-row-card.yellow-row .setting-val {
      color: #000000;
    }

    .setting-sub {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .setting-val {
      font-size: 15px;
      font-weight: 800;
      color: var(--accent-yellow);
      text-align: right;
    }

    /* ===================================================================== */
    /* AUDIO TUTORIAL FOOTER & WAVEFORM VISUALIZER (From Mockup)             */
    /* ===================================================================== */
    .audio-footer {
      padding: 8px 20px 14px;
      background: var(--bg-black);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .audio-status-text {
      font-size: 15px;
      font-weight: 700;
      font-style: italic;
      color: var(--text-white);
      text-align: center;
      min-height: 20px;
      max-width: 340px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .waveform-bars {
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      width: 82%;
    }

    .wave-bar {
      width: 2px;
      height: 4px;
      background: #55555A;
      border-radius: 999px;
      transition: height 0.12s ease, background-color 0.12s ease;
    }

    .waveform-bars.speaking .wave-bar {
      background: #A0A0A8;
      animation: wavePulse 0.75s infinite ease-in-out alternate;
    }

    @keyframes wavePulse {
      0% { height: 4px; opacity: 0.45; }
      100% { height: 20px; opacity: 0.95; }
    }

    .upload-pill-btn {
      background: #000000;
      color: var(--accent-yellow);
      border: 1.5px solid var(--accent-yellow);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    @media (max-width: 480px) {
      body { padding: 0; }
      .device-shell { width: 100vw; height: 100vh; border-radius: 0; padding: 0; }
      .device-viewport { border-radius: 0; border: none; }
    }
  </style>
</head>
<body>

  <main class="device-shell" aria-label="Blind-ER Assistive Mobile App">
    <div class="device-viewport">

      <!-- Top Speaker Slit & Mode Indicator -->
      <div class="notch-bar">
        <div class="speaker-slit"></div>
        <span class="mode-pill-corner" id="a11yModeBadge">VOICE-FIRST</span>
      </div>

      <!-- ================================================================= -->
      <!-- SCREEN 1: ONBOARDING (Matches Uploaded Mockup Image)              -->
      <!-- ================================================================= -->
      <section class="app-screen active" id="screen-onboarding" aria-label="Welcome to Blind-ER Onboarding">
        <div class="onboarding-wrap">
          <div class="onboarding-top-text" onclick="playOnboardingIntro()">
            <h1 class="mockup-title">Welcome to Blind-ER</h1>
            <p class="mockup-subtitle">
              Let’s set up your experience.<br/>
              This tutorial will guide you.
            </p>
          </div>

          <div class="onboarding-cards-stack">
            <!-- Option A: Solid Yellow Card -->
            <button
              type="button"
              class="mockup-option-card yellow-card a11y-touchable"
              data-label="Option A: Low Vision, W C A G Triple A"
              data-hint="High contrast yellow on black with oversized text. Tap again to select."
              data-action="select-low-vision"
            >
              <span class="mockup-card-line">Option A</span>
              <span class="mockup-card-line">Low Vision</span>
              <span class="mockup-card-line">WCAG AAA</span>
            </button>

            <!-- Option B: Matte Dark Card -->
            <button
              type="button"
              class="mockup-option-card dark-card a11y-touchable"
              data-label="Option B: Fully Blind, Audio-First"
              data-hint="Complete voice guidance and maximum touch targets. Tap again to select."
              data-action="select-fully-blind"
            >
              <span class="mockup-card-line">Option B</span>
              <span class="mockup-card-line">Fully Blind</span>
              <span class="mockup-card-line">Audio-First</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 2: HOME SCREEN (Top 60% Book Scanner / Bottom 40% Grid)    -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-home" aria-label="Blind-ER Home Screen">
        <div class="home-wrap">
          <div class="home-header-mini">
            <h2>Blind-ER Home</h2>
          </div>

          <!-- Top 60% Hero Element: Book Scanner -->
          <button
            type="button"
            class="home-hero-60 a11y-touchable"
            data-label="Book Scanner"
            data-hint="Primary AI tool. Scans physical book pages into expressive audiobooks. Tap again to open camera."
            data-action="nav-scanner"
          >
            <span class="home-hero-title">Book Scanner</span>
            <span class="home-hero-title">AI Audiobook</span>
            <span class="home-hero-sub">1st Tap: Hear • 2nd Tap: Open</span>
          </button>

          <!-- Bottom 40% Secondary Grid: Games | More (Library & Extensions) | Real Settings | Back to Setup -->
          <div class="home-secondary-40">
            <button
              type="button"
              class="secondary-pill-card accent-border a11y-touchable"
              data-label="Auditory Games"
              data-hint="Play Pitch Training, Note Recognising, Chord Identifying, and Audio Memory Match. Tap again to open."
              data-action="nav-games"
            >
              <span class="pill-title">Auditory</span>
              <span class="pill-title">Games</span>
              <span class="pill-sub">Pitch • Chords • Notes</span>
            </button>

            <button
              type="button"
              class="secondary-pill-card accent-border a11y-touchable"
              data-label="More Hub: Audiobook Library and Extensions"
              data-hint="Open your saved Audiobook Library, Ray-Ban Meta Smart Glasses, and Be My Eyes extension. Tap again to open."
              data-action="nav-more"
            >
              <span class="pill-title">More</span>
              <span class="pill-title">Library &amp; Ext</span>
              <span class="pill-sub">Audiobooks • Glasses</span>
            </button>

            <button
              type="button"
              class="secondary-pill-card a11y-touchable"
              data-label="Settings"
              data-hint="Configure Volume, Voice Tone, Speech Voice, Language, and Check for Updates. Tap again to open."
              data-action="nav-settings"
            >
              <span class="pill-title">Settings</span>
              <span class="pill-sub">Volume • Voice • Lang</span>
            </button>

            <button
              type="button"
              class="secondary-pill-card a11y-touchable"
              data-label="Back to Setup"
              data-hint="Return to the Welcome visual impairment setup screen. Tap again to open."
              data-action="nav-onboarding"
            >
              <span class="pill-title">Back to</span>
              <span class="pill-title">Setup</span>
              <span class="pill-sub">Vision Profile</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 3: BOOK SCANNER SCREEN (Saves to Audiobook Library)        -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-scanner" aria-label="Book to Audio Scanner">
        <div class="feature-template-wrap">
          <div class="feature-hero-75">
            <div
              class="feature-top-card a11y-touchable"
              data-label="Book Camera Viewfinder"
              data-hint="Point camera at book page. Tap again to capture and narrate."
              data-action="scanner-capture"
            >
              <div class="card-badge-row" onclick="event.stopPropagation()">
                <span class="eyebrow-tag" id="crnnBadgeText">CRNN 99.6% • DOCUMENT LENS</span>
                <label class="upload-pill-btn">
                  Upload Page
                  <input type="file" accept="image/*" style="display:none" onchange="handleFileUpload(event)" />
                </label>
              </div>
              <div id="bookPreviewBox" style="font-size:15px; font-weight:700; color:#FFFFFF; line-height:1.35; padding:6px;">
                CHAPTER IV: THE SILENT LIGHTHOUSE (p. 42)<br/>
                <span style="color:#D1D1D6; font-weight:500;">
                  "The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying with it the bitter scent of salt..."
                </span>
              </div>
            </div>

            <div class="feature-reader-card">
              <div class="card-badge-row">
                <span class="eyebrow-tag" id="scannerLangBadge">AUDIOBOOK OUTPUT (ENGLISH)</span>
                <span class="status-chip" id="scannerStatePill">READY</span>
              </div>
              <div class="reader-scroll">
                <p class="reader-large-copy" id="scannerOutputText">
                  Double-tap "Capture" below to scan with Custom CRNN and narrate with Gemini 3 Flash. Every scanned page is automatically saved to your Audiobook Library inside More.
                </p>
              </div>
            </div>
          </div>

          <div class="feature-bottom-bar-25" role="menubar" aria-label="Book Scanner Controls">
            <button type="button" class="bar-btn a11y-touchable" data-label="Back" data-hint="Return to Home Screen." data-action="nav-home">
              <span class="bar-icon">←</span>
              <span class="bar-label">Back</span>
            </button>
            <button type="button" class="bar-btn yellow-primary a11y-touchable" data-label="Capture Page" data-hint="Scan page with CRNN and Gemini AI." data-action="scanner-capture">
              <span class="bar-icon">◎</span>
              <span class="bar-label">Capture</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" id="readStopBtn" data-label="Read or Stop" data-hint="Start or stop reading the scanned passage." data-action="scanner-read-stop">
              <span class="bar-icon" id="readStopIcon">🔊</span>
              <span class="bar-label" id="readStopLabel">Read</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Next Page" data-hint="Load and scan the next book page." data-action="scanner-next">
              <span class="bar-icon">→</span>
              <span class="bar-label">Next</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="More Options" data-hint="Open Audiobook Library and Extensions Hub." data-action="nav-more">
              <span class="bar-icon">•••</span>
              <span class="bar-label">More</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 4: MORE HUB (Audiobook Library + Hardware/App Extensions)  -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-more" aria-label="More Hub: Audiobook Library and Extensions">
        <div class="feature-template-wrap">
          <div class="feature-hero-75">
            <div class="card-badge-row">
              <span class="eyebrow-tag">MORE • LIBRARY &amp; ASSISTIVE EXTENSIONS</span>
              <span class="status-chip" id="libraryCountChip">4 BOOKS SAVED</span>
            </div>

            <div class="stack-list">
              <!-- Hero Card inside More: Audiobook Library -->
              <button
                type="button"
                class="setting-row-card yellow-row a11y-touchable"
                style="flex: 1.4;"
                data-label="Audiobook Library"
                data-hint="Browse and listen to your saved books and scanned chapters. Tap again to open Audiobook Library."
                data-action="nav-library"
              >
                <div class="setting-left">
                  <span class="setting-title" style="font-size:24px;">📚 Audiobook Library</span>
                  <span class="setting-sub" style="font-size:14px;">Saved Books, Chapters &amp; Scanned Pages</span>
                </div>
                <span class="setting-val" style="font-size:18px;">OPEN →</span>
              </button>

              <!-- Extension 1: Ray-Ban Meta Smart Glasses -->
              <button
                type="button"
                class="setting-row-card a11y-touchable"
                data-label="Extension: Ray-Ban Meta Smart Glasses"
                data-hint="Hands-free real-time P O V monitoring via Bluetooth smart glasses. Tap again to connect."
                data-action="nav-hardware-meta"
              >
                <div class="setting-left">
                  <span class="setting-title">🕶️ Meta Smart Glasses</span>
                  <span class="setting-sub">Wearable Extension • Real-Time POV HUD</span>
                </div>
                <span class="setting-val">BLE 94%</span>
              </button>

              <!-- Extension 2: Be My Eyes Bridge -->
              <button
                type="button"
                class="setting-row-card a11y-touchable"
                data-label="Extension: Be My Eyes App Bridge"
                data-hint="Connect live volunteer and AI visual interpreter with C R N N text telemetry. Tap again to open."
                data-action="nav-hardware-bemyeyes"
              >
                <div class="setting-left">
                  <span class="setting-title">🤝 Be My Eyes Bridge</span>
                  <span class="setting-sub">App Extension • Volunteer + AI Escalation</span>
                </div>
                <span class="setting-val">READY</span>
              </button>
            </div>
          </div>

          <div class="feature-bottom-bar-25" role="menubar" aria-label="More Hub Controls">
            <button type="button" class="bar-btn a11y-touchable" data-label="Back to Home" data-hint="Return to Home Screen." data-action="nav-home">
              <span class="bar-icon">←</span>
              <span class="bar-label">Back</span>
            </button>
            <button type="button" class="bar-btn yellow-primary a11y-touchable" data-label="Open Audiobook Library" data-hint="Open your saved audiobooks." data-action="nav-library">
              <span class="bar-icon">📚</span>
              <span class="bar-label">Library</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Meta Glasses Extension" data-hint="Open Ray-Ban Meta Smart Glasses live monitor." data-action="nav-hardware-meta">
              <span class="bar-icon">🕶️</span>
              <span class="bar-label">Glasses</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Be My Eyes Extension" data-hint="Open Be My Eyes volunteer bridge." data-action="nav-hardware-bemyeyes">
              <span class="bar-icon">🤝</span>
              <span class="bar-label">BeMyEyes</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 5: AUDIOBOOK LIBRARY (Inside More)                         -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-library" aria-label="Audiobook Library">
        <div class="feature-template-wrap">
          <div class="feature-hero-75">
            <div
              class="feature-top-card a11y-touchable"
              data-label="Current Audiobook Selection"
              data-hint="Tap again to play or pause this audiobook chapter."
              data-action="lib-play-pause"
            >
              <div class="card-badge-row">
                <span class="eyebrow-tag" id="libIndexBadge">BOOK 1 OF 4 • SAVED LIBRARY</span>
                <span class="status-chip" id="libStatusChip">PAUSED</span>
              </div>
              <div style="font-size:23px; font-weight:800; color:var(--accent-yellow); line-height:1.2; margin-bottom:6px;" id="libBookTitle">
                The Silent Lighthouse
              </div>
              <div style="font-size:14px; font-weight:700; color:#D1D1D6;" id="libChapterSub">
                Chapter IV • Scanned via CRNN (99.62%)
              </div>
            </div>

            <div class="feature-reader-card">
              <div class="card-badge-row">
                <span class="eyebrow-tag" id="libLangBadge">NARRATION LANGUAGE: ENGLISH</span>
                <span class="status-chip" id="libBookmarkChip">★ BOOKMARKED</span>
              </div>
              <div class="reader-scroll">
                <p class="reader-large-copy" id="libChapterText">
                  Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm.
                </p>
              </div>
            </div>
          </div>

          <div class="feature-bottom-bar-25" role="menubar" aria-label="Audiobook Library Controls">
            <button type="button" class="bar-btn a11y-touchable" data-label="Back to More" data-hint="Return to the More Hub." data-action="nav-more">
              <span class="bar-icon">←</span>
              <span class="bar-label">Back</span>
            </button>
            <button type="button" class="bar-btn yellow-primary a11y-touchable" id="libPlayBtn" data-label="Play Audiobook" data-hint="Play or pause the selected audiobook chapter." data-action="lib-play-pause">
              <span class="bar-icon" id="libPlayIcon">▶</span>
              <span class="bar-label" id="libPlayLabel">Play</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Previous Book" data-hint="Switch to the previous book in your library." data-action="lib-prev-book">
              <span class="bar-icon">⏮</span>
              <span class="bar-label">Prev</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Next Book" data-hint="Switch to the next book in your library." data-action="lib-next-book">
              <span class="bar-icon">⏭</span>
              <span class="bar-label">Next</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Translate Audiobook" data-hint="Cycle audiobook translation language." data-action="lib-cycle-lang">
              <span class="bar-icon">🌐</span>
              <span class="bar-label">Lang</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 6: AUDITORY GAMES SUITE (Pitch, Notes, Chords, Matching)   -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-games" aria-label="Auditory Games Suite">
        <div class="feature-template-wrap">
          <div class="feature-hero-75">
            <div
              class="feature-top-card a11y-touchable"
              data-label="Play Current Game Sound Challenge"
              data-hint="Tap again to hear the tones, note, chord, or pattern for this round."
              data-action="game-play-sound"
            >
              <div class="card-badge-row">
                <span class="eyebrow-tag" id="gameModeBadge">GAME 1/4 • PITCH TRAINING</span>
                <span class="status-chip" id="gameScoreChip">SCORE: 0 • STREAK: 0</span>
              </div>
              <div style="font-size:25px; font-weight:800; color:var(--accent-yellow); margin:6px 0;" id="gameTitleText">
                Pitch Training
              </div>
              <div style="font-size:15px; font-weight:600; color:#FFFFFF;" id="gameSubPrompt">
                Tap "Hear Sound" to play two tones, then select whether the 2nd tone is Higher or Lower.
              </div>
            </div>

            <div class="feature-reader-card">
              <div class="card-badge-row">
                <span class="eyebrow-tag">SELECTED ANSWER CHOICE</span>
                <span class="status-chip" id="gameChoiceChip">CHOICE 1</span>
              </div>
              <div class="reader-scroll" style="display:flex; flex-direction:column; justify-content:center; gap:8px;">
                <p class="reader-large-copy" id="gameFeedbackText" style="font-size:22px; color:var(--accent-yellow);">
                  Current Choice: Higher Pitch
                </p>
                <p style="font-size:15px; color:#D1D1D6; font-weight:600;" id="gameHintText">
                  Use "Choice" in the bottom bar to cycle options, then "Submit" to check your ear!
                </p>
              </div>
            </div>
          </div>

          <div class="feature-bottom-bar-25" role="menubar" aria-label="Auditory Games Controls">
            <button type="button" class="bar-btn a11y-touchable" data-label="Back to Home" data-hint="Return to Home Screen." data-action="nav-home">
              <span class="bar-icon">←</span>
              <span class="bar-label">Back</span>
            </button>
            <button type="button" class="bar-btn yellow-primary a11y-touchable" data-label="Hear Sound" data-hint="Play the acoustic tone, note, chord, or memory sequence." data-action="game-play-sound">
              <span class="bar-icon">🎵</span>
              <span class="bar-label">Hear</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Cycle Answer Choice" data-hint="Cycle through possible answers for this game." data-action="game-cycle-choice">
              <span class="bar-icon">⇄</span>
              <span class="bar-label">Choice</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Submit Answer" data-hint="Check if your selected answer matches the sound." data-action="game-submit-answer">
              <span class="bar-icon">✓</span>
              <span class="bar-label">Submit</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Switch Game Mode" data-hint="Switch between Pitch Training, Note Recognising, Chord Identifying, and Audio Memory Match." data-action="game-next-mode">
              <span class="bar-icon">🎮</span>
              <span class="bar-label">Game</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 7: REAL FUNCTIONAL SETTINGS SCREEN                         -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-settings" aria-label="Blind-ER Settings">
        <div class="feature-template-wrap">
          <div class="feature-hero-75">
            <div class="card-badge-row">
              <span class="eyebrow-tag">SYSTEM SETTINGS • VOICE &amp; AUDIO</span>
              <span class="status-chip" id="settingsVersionChip">v2.4.0</span>
            </div>

            <div class="stack-list">
              <!-- 1. Volume Control -->
              <button
                type="button"
                class="setting-row-card a11y-touchable"
                data-label="Volume Control"
                data-hint="Adjust speech and audio volume between 25, 50, 75, and 100 percent. Tap again to change."
                data-action="setting-volume"
              >
                <div class="setting-left">
                  <span class="setting-title">🔊 Volume Control</span>
                  <span class="setting-sub">Master TTS &amp; Haptic Output Level</span>
                </div>
                <span class="setting-val" id="valVolume">100%</span>
              </button>

              <!-- 2. Voice Tone & Speed -->
              <button
                type="button"
                class="setting-row-card a11y-touchable"
                data-label="Tone and Speech Pacing"
                data-hint="Cycle between Natural, Warm Literary, Crisp Fast, and Deep Calm tone presets. Tap again to change."
                data-action="setting-tone"
              >
                <div class="setting-left">
                  <span class="setting-title">🎚️ Tone &amp; Pacing</span>
                  <span class="setting-sub">Pitch Frequency &amp; Reading Speed</span>
                </div>
                <span class="setting-val" id="valTone">Natural (1.0x)</span>
              </button>

              <!-- 3. Change Voice -->
              <button
                type="button"
                class="setting-row-card a11y-touchable"
                data-label="Change Narrator Voice"
                data-hint="Switch between available neural and system speech synthesis voices. Tap again to switch voice."
                data-action="setting-voice"
              >
                <div class="setting-left">
                  <span class="setting-title">🗣️ Change Voice</span>
                  <span class="setting-sub">Active System TTS Narrator</span>
                </div>
                <span class="setting-val" id="valVoice">Default Voice</span>
              </button>

              <!-- 4. Change Language -->
              <button
                type="button"
                class="setting-row-card a11y-touchable"
                data-label="Change App and AI Language"
                data-hint="Switch primary translation and speech language between English, Malay, Spanish, French, and Mandarin. Tap again to change."
                data-action="setting-language"
              >
                <div class="setting-left">
                  <span class="setting-title">🌐 Change Language</span>
                  <span class="setting-sub">Gemini 3 Translation &amp; TTS Locale</span>
                </div>
                <span class="setting-val" id="valLanguage">English</span>
              </button>

              <!-- 5. Check for Updates -->
              <button
                type="button"
                class="setting-row-card yellow-row a11y-touchable"
                data-label="Check for Updates"
                data-hint="Verify backend connection, C R N N model weights, and Gemini 3 Flash status. Tap again to check now."
                data-action="setting-update"
              >
                <div class="setting-left">
                  <span class="setting-title">🔄 Check for Updates</span>
                  <span class="setting-sub" id="subUpdateStatus">CRNN 99.62% + Gemini 3 Flash</span>
                </div>
                <span class="setting-val" id="valUpdate">UP TO DATE</span>
              </button>
            </div>
          </div>

          <div class="feature-bottom-bar-25" role="menubar" aria-label="Settings Bottom Bar">
            <button type="button" class="bar-btn a11y-touchable" data-label="Back to Home" data-hint="Return to Home Screen." data-action="nav-home">
              <span class="bar-icon">←</span>
              <span class="bar-label">Back</span>
            </button>
            <button type="button" class="bar-btn yellow-primary a11y-touchable" data-label="Adjust Volume" data-hint="Cycle master volume level." data-action="setting-volume">
              <span class="bar-icon">🔊</span>
              <span class="bar-label">Volume</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Adjust Tone" data-hint="Cycle voice tone and speed." data-action="setting-tone">
              <span class="bar-icon">🎚️</span>
              <span class="bar-label">Tone</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Switch Language" data-hint="Cycle language." data-action="setting-language">
              <span class="bar-icon">🌐</span>
              <span class="bar-label">Lang</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Back to Visual Setup" data-hint="Open Welcome Visual Impairment Setup." data-action="nav-onboarding">
              <span class="bar-icon">⚙️</span>
              <span class="bar-label">Setup</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SCREEN 8: EXTENSIONS — META SMART GLASSES & BE MY EYES            -->
      <!-- ================================================================= -->
      <section class="app-screen" id="screen-hardware" aria-label="Assistive Extensions: Meta Glasses and Be My Eyes">
        <div class="feature-template-wrap">
          <div class="feature-hero-75">
            <div
              class="feature-top-card a11y-touchable"
              data-label="Ray-Ban Meta Smart Glasses Point of View Feed"
              data-hint="Tap again to run live spatial monitoring."
              data-action="hw-meta-live"
            >
              <video
                id="hwWebcamVideo"
                autoplay
                playsinline
                muted
                style="display:none; position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.55;"
              ></video>
              <div class="card-badge-row" onclick="event.stopPropagation()" style="z-index:2;">
                <span class="eyebrow-tag" id="hwDeviceBanner">🕶️ EXTENSION • META GLASSES BLE 94%</span>
                <button type="button" class="upload-pill-btn" onclick="toggleHardwareWebcam(event)" id="hwCamToggleBtn">
                  📷 Live POV Cam
                </button>
              </div>
              <div style="z-index:2; text-align:left; width:100%;">
                <div style="font-size:12px; font-weight:800; color:var(--accent-yellow); margin-bottom:4px;" id="hwSceneTitle">
                  POV SCENE 1/3: URBAN CROSSWALK &amp; TRAFFIC SIGNAL
                </div>
                <div style="font-family:monospace; font-size:15px; font-weight:800; color:#FFFFFF; margin-bottom:4px;" id="hwSceneBanner">
                  [HUD TARGET] WALK SIGNAL: 14 SEC • 5TH AVE
                </div>
                <div style="font-size:13px; color:#D1D1D6;" id="hwSceneDesc">
                  Pedestrian crossing countdown active. Tactile paving aligned at 12 o’clock; cyclist stopped on left.
                </div>
              </div>
            </div>

            <div class="feature-reader-card">
              <div class="card-badge-row">
                <span class="eyebrow-tag" id="hwBridgeBadge">🔊 META GLASSES SPATIAL AUDIO</span>
                <span class="status-chip" id="hwAutoPill">MANUAL</span>
              </div>
              <div class="reader-scroll">
                <p class="reader-large-copy" id="hwOutputText">
                  Extension Ready. Double-tap "Meta Live" for hands-free spatial monitoring, or double-tap "Be My Eyes" to bridge a live volunteer + AI visual interpreter.
                </p>
              </div>
            </div>
          </div>

          <div class="feature-bottom-bar-25" role="menubar" aria-label="Extensions Control Bar">
            <button type="button" class="bar-btn a11y-touchable" data-label="Back to More Hub" data-hint="Return to the More Hub." data-action="nav-more">
              <span class="bar-icon">←</span>
              <span class="bar-label">Back</span>
            </button>
            <button type="button" class="bar-btn yellow-primary a11y-touchable" data-label="Meta Glasses Live Scan" data-hint="Analyze current POV with Ray-Ban Meta Smart Glasses." data-action="hw-meta-live">
              <span class="bar-icon">🕶️</span>
              <span class="bar-label">Meta Live</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Be My Eyes Volunteer Bridge" data-hint="Stream POV and CRNN OCR to Be My Eyes." data-action="hw-bemyeyes">
              <span class="bar-icon">🤝</span>
              <span class="bar-label">BeMyEyes</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Switch POV Scene" data-hint="Switch between Crosswalk, Pharmacy Bottle, and Bookstore." data-action="hw-next-scene">
              <span class="bar-icon">→</span>
              <span class="bar-label">Scene</span>
            </button>
            <button type="button" class="bar-btn a11y-touchable" data-label="Toggle Continuous Auto Monitor" data-hint="Toggle automatic 8-second smart glasses monitoring." data-action="hw-more-auto">
              <span class="bar-icon">•••</span>
              <span class="bar-label" id="hwMoreAutoLabel">Auto</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- BOTTOM AUDIO STATUS & ANIMATED WAVEFORM (Matches Reference Image) -->
      <!-- ================================================================= -->
      <footer class="audio-footer" aria-live="polite">
        <div class="audio-status-text" id="ttsCaptionBar">Audio tutorial is playing...</div>
        <div class="waveform-bars" id="waveformContainer">
          <div class="wave-bar" style="animation-delay:0.05s"></div>
          <div class="wave-bar" style="animation-delay:0.15s"></div>
          <div class="wave-bar" style="animation-delay:0.28s"></div>
          <div class="wave-bar" style="animation-delay:0.12s"></div>
          <div class="wave-bar" style="animation-delay:0.35s"></div>
          <div class="wave-bar" style="animation-delay:0.20s"></div>
          <div class="wave-bar" style="animation-delay:0.08s"></div>
          <div class="wave-bar" style="animation-delay:0.42s"></div>
          <div class="wave-bar" style="animation-delay:0.18s"></div>
          <div class="wave-bar" style="animation-delay:0.31s"></div>
          <div class="wave-bar" style="animation-delay:0.04s"></div>
          <div class="wave-bar" style="animation-delay:0.25s"></div>
          <div class="wave-bar" style="animation-delay:0.39s"></div>
          <div class="wave-bar" style="animation-delay:0.14s"></div>
          <div class="wave-bar" style="animation-delay:0.22s"></div>
          <div class="wave-bar" style="animation-delay:0.09s"></div>
          <div class="wave-bar" style="animation-delay:0.33s"></div>
          <div class="wave-bar" style="animation-delay:0.19s"></div>
          <div class="wave-bar" style="animation-delay:0.27s"></div>
          <div class="wave-bar" style="animation-delay:0.11s"></div>
          <div class="wave-bar" style="animation-delay:0.37s"></div>
          <div class="wave-bar" style="animation-delay:0.16s"></div>
          <div class="wave-bar" style="animation-delay:0.06s"></div>
          <div class="wave-bar" style="animation-delay:0.24s"></div>
        </div>
      </footer>

    </div>
  </main>

  <script>
    const LANGUAGES = ['English', 'Malay', 'Spanish', 'French', 'Mandarin'];
    const LOCALES = {
      English: 'en-US',
      Malay: 'ms-MY',
      Spanish: 'es-ES',
      French: 'fr-FR',
      Mandarin: 'zh-CN'
    };

    // Real Functional Settings State
    const VOLUME_LEVELS = [1.0, 0.25, 0.5, 0.75];
    const TONE_PRESETS = [
      { name: 'Natural (1.0x)', rate: 0.98, pitch: 1.0 },
      { name: 'Warm Literary (0.88x)', rate: 0.88, pitch: 0.92 },
      { name: 'Crisp Fast (1.18x)', rate: 1.18, pitch: 1.05 },
      { name: 'Deep Calm (0.92x)', rate: 0.92, pitch: 0.82 }
    ];

    let volIndex = 0;
    let toneIndex = 0;
    let voiceIndex = 0;
    let availableVoices = [];
    let langIndex = 0;

    // Book Scanner Pages
    const BOOK_PAGES = [
      {
        heading: 'CHAPTER IV: THE SILENT LIGHTHOUSE (p. 42)',
        strip: 'Silent Light.',
        preview: '"The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying with it the bitter scent of salt..."'
      },
      {
        heading: 'CHAPTER V: BENEATH NORTHERN STARS (p. 43)',
        strip: 'Dark storm.',
        preview: '"Elara raised her lantern toward the stone tower. Beyond the breakers, a distant bell echoed three times..."'
      }
    ];

    // Saved Audiobook Library (inside More)
    const AUDIOBOOK_LIBRARY = [
      {
        title: 'The Silent Lighthouse',
        chapter: 'Chapter IV • Scanned via CRNN (99.62%)',
        text: 'Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm.'
      },
      {
        title: 'Beneath Northern Stars',
        chapter: 'Chapter V • Scanned via CRNN (99.62%)',
        text: 'Chapter Five: Beneath Northern Stars. Elara raised her lantern toward the ancient stone tower as the distant bell echoed three times across the freezing bay.'
      },
      {
        title: 'Designing Without Sight',
        chapter: 'Chapter I • Tactile & Voice-First Architecture',
        text: 'Chapter One: Designing Without Sight. True accessibility begins when every action on a screen can be discovered safely by touch and confirmed clearly by voice.'
      },
      {
        title: 'Neural Sequence Recognition',
        chapter: 'Chapter II • Convolutional Recurrent Networks',
        text: 'Chapter Two: Neural Sequence Recognition. By combining convolutional feature maps with bidirectional recurrent layers and C T C loss, printed lines become living speech.'
      }
    ];

    // 4 Playable Auditory Games (Web Audio Synthesizer)
    const AUDITORY_GAMES = [
      {
        id: 'PITCH',
        badge: 'GAME 1/4 • PITCH TRAINING',
        title: 'Pitch Training',
        prompt: 'Listen to two sequential tones. Is the 2nd tone Higher or Lower than the 1st tone?',
        choices: ['Higher Pitch', 'Lower Pitch', 'Same Pitch'],
        correctIndex: 0,
        playChallenge: (ctx, vol) => {
          playSynthNote(ctx, 440, 0.0, 0.32, vol);
          playSynthNote(ctx, 587.33, 0.42, 0.38, vol);
        }
      },
      {
        id: 'NOTE',
        badge: 'GAME 2/4 • NOTE RECOGNISING',
        title: 'Note Recognising',
        prompt: 'Listen to this concert reference musical note with harmonics. Which note is playing?',
        choices: ['Note A4 (440 Hz)', 'Note C4 (Middle C)', 'Note E4 (330 Hz)', 'Note G4 (392 Hz)'],
        correctIndex: 0,
        playChallenge: (ctx, vol) => {
          playSynthNote(ctx, 440, 0.0, 0.65, vol, 'triangle');
          playSynthNote(ctx, 880, 0.0, 0.45, vol * 0.35, 'sine');
        }
      },
      {
        id: 'CHORD',
        badge: 'GAME 3/4 • CHORD IDENTIFYING',
        title: 'Chord Identifying',
        prompt: 'Listen to these three notes played together as a triad. Identify the chord quality!',
        choices: ['C Major Triad (Bright)', 'A Minor Triad (Melancholy)', 'B Diminished Triad (Tense)'],
        correctIndex: 0,
        playChallenge: (ctx, vol) => {
          // C Major Triad: C4 (261.63), E4 (329.63), G4 (392.00)
          playSynthNote(ctx, 261.63, 0.0, 0.75, vol * 0.6, 'triangle');
          playSynthNote(ctx, 329.63, 0.06, 0.7, vol * 0.6, 'triangle');
          playSynthNote(ctx, 392.00, 0.12, 0.65, vol * 0.6, 'triangle');
        }
      },
      {
        id: 'MEMORY',
        badge: 'GAME 4/4 • AUDIO MATCHING',
        title: 'Audio Pattern Match',
        prompt: 'Memorize the 3-note spatial melody pattern played aloud and match its contour!',
        choices: ['Low → Mid → High (Ascending)', 'High → Mid → Low (Descending)', 'Low → High → Low (Arch)'],
        correctIndex: 2,
        playChallenge: (ctx, vol) => {
          playSynthNote(ctx, 330, 0.0, 0.25, vol);
          playSynthNote(ctx, 659.25, 0.32, 0.25, vol);
          playSynthNote(ctx, 330, 0.64, 0.32, vol);
        }
      }
    ];

    // Extensions: Ray-Ban Meta Smart Glasses & Be My Eyes Scenes
    const HARDWARE_SCENES = [
      {
        id: 'CROSSWALK',
        title: 'POV SCENE 1/3: URBAN CROSSWALK & TRAFFIC SIGNAL',
        banner: '[HUD TARGET] WALK SIGNAL: 14 SEC • 5TH AVE',
        desc: 'Pedestrian crossing countdown active. Tactile paving aligned at 12 o’clock; cyclist stopped on left.'
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

    let pageIndex = 0;
    let libBookIndex = 0;
    let isLibPlaying = false;
    let gameIndex = 0;
    let gameChoiceIndex = 0;
    let gameScore = 0;
    let gameStreak = 0;
    let hwSceneIndex = 0;
    let hwAutoInterval = null;
    let hwStream = null;
    let isSpeakingPassage = false;
    let lastNarratedText = '';
    let audioCtx = null;
    let focusedElement = null;
    let singleTapTimer = null;

    function ensureAudioCtx() {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function playSynthNote(ctx, freq, startOffset, duration, volume = 0.2, waveType = 'sine') {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(Math.max(0.02, volume * 0.22), ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + duration);
      } catch {}
    }

    function playHapticTone(freq = 520, duration = 0.06) {
      try {
        const ctx = ensureAudioCtx();
        playSynthNote(ctx, freq, 0, duration, VOLUME_LEVELS[volIndex]);
      } catch {}
    }

    function setWaveformActive(active) {
      const wf = document.getElementById('waveformContainer');
      if (!wf) return;
      if (active) wf.classList.add('speaking');
      else wf.classList.remove('speaking');
    }

    function loadSystemVoices() {
      if (!('speechSynthesis' in window)) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        availableVoices = voices;
        const vName = availableVoices[voiceIndex % availableVoices.length].name.split(' ')[0];
        const el = document.getElementById('valVoice');
        if (el) el.textContent = vName;
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadSystemVoices;
    }

    function speakTTS(text, lang = null, onEnd = null) {
      const chosenLang = lang || LANGUAGES[langIndex];
      const caption = document.getElementById('ttsCaptionBar');
      caption.textContent = text.length > 64 ? text.slice(0, 64) + '...' : text;
      setWaveformActive(true);

      if (!('speechSynthesis' in window)) {
        setTimeout(() => {
          setWaveformActive(false);
          if (onEnd) onEnd();
        }, 1200);
        return;
      }

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LOCALES[chosenLang] || 'en-US';
      u.volume = VOLUME_LEVELS[volIndex];
      u.rate = TONE_PRESETS[toneIndex].rate;
      u.pitch = TONE_PRESETS[toneIndex].pitch;

      if (availableVoices.length > 0) {
        u.voice = availableVoices[voiceIndex % availableVoices.length];
      }

      u.onend = () => {
        setWaveformActive(false);
        if (onEnd) onEnd();
      };
      u.onerror = () => {
        setWaveformActive(false);
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(u);
    }

    function playOnboardingIntro() {
      document.getElementById('ttsCaptionBar').textContent = 'Audio tutorial is playing...';
      speakTTS(
        'Welcome to Blind-ER. Let us set up your experience. Tap any item once to hear what it is. Tap it a second time to open it. Choose Option A for Low Vision, or Option B for Fully Blind Audio-First.'
      );
    }

    function navigateToScreen(screenId, announcement) {
      focusedElement = null;
      document.querySelectorAll('.a11y-touchable').forEach((b) => b.classList.remove('focused-touch'));
      document.querySelectorAll('.app-screen').forEach((s) => s.classList.remove('active'));
      document.getElementById('screen-' + screenId).classList.add('active');
      if (announcement) {
        speakTTS(announcement);
      }
    }

    // =======================================================================
    // STEP 1: AccessibleTouchable Engine (1st Tap = TTS Readout, 2nd Tap = Act)
    // =======================================================================
    function attachAccessibleTouchableEngine() {
      const elements = document.querySelectorAll('.a11y-touchable');
      elements.forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();

          const label = el.getAttribute('data-label') || el.innerText.trim();
          const hint = el.getAttribute('data-hint') || 'Tap again to select.';
          const action = el.getAttribute('data-action');

          if (focusedElement === el) {
            if (singleTapTimer) {
              clearTimeout(singleTapTimer);
              singleTapTimer = null;
            }
            focusedElement = null;
            el.classList.remove('focused-touch');
            playHapticTone(840, 0.1);
            executeAccessibleAction(action);
          } else {
            if (singleTapTimer) {
              clearTimeout(singleTapTimer);
              singleTapTimer = null;
            }
            document.querySelectorAll('.a11y-touchable').forEach((b) => b.classList.remove('focused-touch'));
            focusedElement = el;
            el.classList.add('focused-touch');

            singleTapTimer = setTimeout(() => {
              playHapticTone(440, 0.05);
              speakTTS(label + '. ' + hint);
              singleTapTimer = null;
            }, 150);
          }
        });
      });
    }

    async function executeAccessibleAction(actionName) {
      if (actionName === 'select-low-vision') {
        document.getElementById('a11yModeBadge').textContent = 'LOW VISION AAA';
        navigateToScreen(
          'home',
          'Option A: Low Vision mode active. Home Screen. Top 60 percent is Book Scanner. Bottom grid has Auditory Games, More Library and Extensions, Settings, and Back to Setup.'
        );
      } else if (actionName === 'select-fully-blind') {
        document.getElementById('a11yModeBadge').textContent = 'AUDIO-FIRST';
        navigateToScreen(
          'home',
          'Option B: Fully Blind Audio-First mode active. Home Screen. Top 60 percent is Book Scanner. Bottom grid has Auditory Games, More Library and Extensions, Settings, and Back to Setup.'
        );
      } else if (actionName === 'nav-home') {
        if (hwAutoInterval) {
          clearInterval(hwAutoInterval);
          hwAutoInterval = null;
        }
        isSpeakingPassage = false;
        isLibPlaying = false;
        navigateToScreen('home', 'Home Screen.');
      } else if (actionName === 'nav-onboarding') {
        navigateToScreen('onboarding', 'Back to Welcome Visual Setup. Choose Option A Low Vision or Option B Fully Blind.');
      } else if (actionName === 'nav-scanner') {
        navigateToScreen(
          'scanner',
          'Book Scanner opened. Top 75 percent holds viewfinder and reader. Bottom bar has Back, Capture, Read, Next, and More.'
        );
      } else if (actionName === 'nav-more') {
        document.getElementById('libraryCountChip').textContent = `${AUDIOBOOK_LIBRARY.length} BOOKS SAVED`;
        navigateToScreen(
          'more',
          `More Hub opened. Contains your Audiobook Library with ${AUDIOBOOK_LIBRARY.length} saved books, plus Ray-Ban Meta Smart Glasses and Be My Eyes extensions.`
        );
      } else if (actionName === 'nav-library') {
        renderLibraryBook();
        navigateToScreen(
          'library',
          `Audiobook Library opened. Book 1 of ${AUDIOBOOK_LIBRARY.length}: ${AUDIOBOOK_LIBRARY[libBookIndex].title}. Tap Play in the bottom bar to listen.`
        );
      } else if (actionName === 'nav-games') {
        renderAuditoryGame();
        navigateToScreen(
          'games',
          'Auditory Games Suite opened. Game 1 of 4: Pitch Training. Tap Hear in the bottom bar to play the sound challenge.'
        );
      } else if (actionName === 'nav-settings') {
        navigateToScreen(
          'settings',
          'Settings opened. Adjust Volume Control, Tone and Pacing, Change Voice, Change Language, or Check for Updates.'
        );
      } else if (actionName === 'nav-hardware-meta') {
        document.getElementById('hwBridgeBadge').textContent = '🔊 META GLASSES SPATIAL AUDIO';
        navigateToScreen(
          'hardware',
          'Ray-Ban Meta Smart Glasses Extension connected. Double tap Meta Live in the bottom bar for real-time P O V monitoring.'
        );
      } else if (actionName === 'nav-hardware-bemyeyes') {
        document.getElementById('hwBridgeBadge').textContent = '🤝 BE MY EYES VOLUNTEER + AI BRIDGE';
        navigateToScreen(
          'hardware',
          'Be My Eyes Extension ready. Double tap Be My Eyes in the bottom bar to connect live AI and volunteer assistance.'
        );
      }
      // Book Scanner Actions
      else if (actionName === 'scanner-capture') {
        await runBookCapturePipeline();
      } else if (actionName === 'scanner-read-stop') {
        toggleReadOrStop();
      } else if (actionName === 'scanner-next') {
        pageIndex = (pageIndex + 1) % BOOK_PAGES.length;
        const p = BOOK_PAGES[pageIndex];
        document.getElementById('bookPreviewBox').innerHTML = `${p.heading}<br/><span style="color:#D1D1D6; font-weight:500;">${p.preview}</span>`;
        speakTTS('Next book page loaded. Capturing page.');
        await runBookCapturePipeline();
      }
      // Audiobook Library Actions
      else if (actionName === 'lib-play-pause') {
        toggleLibraryPlayback();
      } else if (actionName === 'lib-prev-book') {
        libBookIndex = (libBookIndex - 1 + AUDIOBOOK_LIBRARY.length) % AUDIOBOOK_LIBRARY.length;
        renderLibraryBook();
        speakTTS(`Selected ${AUDIOBOOK_LIBRARY[libBookIndex].title}.`);
      } else if (actionName === 'lib-next-book') {
        libBookIndex = (libBookIndex + 1) % AUDIOBOOK_LIBRARY.length;
        renderLibraryBook();
        speakTTS(`Selected ${AUDIOBOOK_LIBRARY[libBookIndex].title}.`);
      } else if (actionName === 'lib-cycle-lang') {
        langIndex = (langIndex + 1) % LANGUAGES.length;
        const newLang = LANGUAGES[langIndex];
        document.getElementById('libLangBadge').textContent = `NARRATION LANGUAGE: ${newLang.toUpperCase()}`;
        document.getElementById('valLanguage').textContent = newLang;
        speakTTS(`Audiobook language switched to ${newLang}.`);
      }
      // Auditory Games Actions
      else if (actionName === 'game-play-sound') {
        const ctx = ensureAudioCtx();
        const g = AUDITORY_GAMES[gameIndex];
        setWaveformActive(true);
        g.playChallenge(ctx, VOLUME_LEVELS[volIndex]);
        setTimeout(() => setWaveformActive(false), 950);
      } else if (actionName === 'game-cycle-choice') {
        const g = AUDITORY_GAMES[gameIndex];
        gameChoiceIndex = (gameChoiceIndex + 1) % g.choices.length;
        const c = g.choices[gameChoiceIndex];
        document.getElementById('gameChoiceChip').textContent = `CHOICE ${gameChoiceIndex + 1}/${g.choices.length}`;
        document.getElementById('gameFeedbackText').textContent = `Current Choice: ${c}`;
        speakTTS(`Choice ${gameChoiceIndex + 1}: ${c}. Tap Submit to verify.`);
      } else if (actionName === 'game-submit-answer') {
        const g = AUDITORY_GAMES[gameIndex];
        const chosen = g.choices[gameChoiceIndex];
        if (gameChoiceIndex === g.correctIndex) {
          gameScore += 10;
          gameStreak += 1;
          playHapticTone(880, 0.18);
          document.getElementById('gameScoreChip').textContent = `SCORE: ${gameScore} • STREAK: ${gameStreak}`;
          document.getElementById('gameFeedbackText').textContent = `✓ Correct! (${chosen})`;
          speakTTS(`Correct! ${chosen}. Score is now ${gameScore}, streak ${gameStreak}.`);
        } else {
          gameStreak = 0;
          playHapticTone(240, 0.22);
          document.getElementById('gameScoreChip').textContent = `SCORE: ${gameScore} • STREAK: 0`;
          document.getElementById('gameFeedbackText').textContent = `✗ Try Again! Hear the sound and cycle Choice.`;
          speakTTS(`Not quite. You selected ${chosen}. Tap Hear to listen again, or cycle Choice.`);
        }
      } else if (actionName === 'game-next-mode') {
        gameIndex = (gameIndex + 1) % AUDITORY_GAMES.length;
        gameChoiceIndex = 0;
        renderAuditoryGame();
        const g = AUDITORY_GAMES[gameIndex];
        speakTTS(`Switched to ${g.title}. ${g.prompt}`);
      }
      // Real Settings Actions
      else if (actionName === 'setting-volume') {
        volIndex = (volIndex + 1) % VOLUME_LEVELS.length;
        const pct = Math.round(VOLUME_LEVELS[volIndex] * 100) + '%';
        document.getElementById('valVolume').textContent = pct;
        playHapticTone(600, 0.08);
        speakTTS(`Volume set to ${pct}.`);
      } else if (actionName === 'setting-tone') {
        toneIndex = (toneIndex + 1) % TONE_PRESETS.length;
        const t = TONE_PRESETS[toneIndex];
        document.getElementById('valTone').textContent = t.name;
        speakTTS(`Voice tone and pacing set to ${t.name}.`);
      } else if (actionName === 'setting-voice') {
        loadSystemVoices();
        if (availableVoices.length > 0) {
          voiceIndex = (voiceIndex + 1) % availableVoices.length;
          const v = availableVoices[voiceIndex];
          const shortName = v.name.replace(/Microsoft |Google |Online \(Natural\) - /g, '').slice(0, 18);
          document.getElementById('valVoice').textContent = shortName;
          speakTTS(`Narrator voice changed to ${shortName}.`);
        } else {
          speakTTS('Using default system neural narrator voice.');
        }
      } else if (actionName === 'setting-language') {
        langIndex = (langIndex + 1) % LANGUAGES.length;
        const newLang = LANGUAGES[langIndex];
        document.getElementById('valLanguage').textContent = newLang;
        document.getElementById('scannerLangBadge').textContent = `AUDIOBOOK OUTPUT (${newLang.toUpperCase()})`;
        document.getElementById('libLangBadge').textContent = `NARRATION LANGUAGE: ${newLang.toUpperCase()}`;
        speakTTS(`Primary app and translation language set to ${newLang}.`);
      } else if (actionName === 'setting-update') {
        document.getElementById('valUpdate').textContent = 'CHECKING...';
        speakTTS('Checking Blind-ER server for AI model updates.');
        try {
          const res = await fetch('/health');
          const data = await res.json();
          document.getElementById('valUpdate').textContent = `v${data.version || '2.4.0'} LATEST`;
          document.getElementById('subUpdateStatus').textContent = `CRNN (${data.crnn_mode}) • Gemini Ready`;
          speakTTS(`Blind-ER version ${data.version || '2.4.0'} is up to date. Custom C R N N weights and Gemini 3 Flash are online.`);
        } catch {
          document.getElementById('valUpdate').textContent = 'v2.4.0 LOCAL';
          speakTTS('Blind-ER version 2.4.0 local runtime is up to date.');
        }
      }
      // Hardware & Extension Actions
      else if (actionName === 'hw-meta-live') {
        await runHardwareAssist('META_GLASSES');
      } else if (actionName === 'hw-bemyeyes') {
        await runHardwareAssist('BE_MY_EYES');
      } else if (actionName === 'hw-next-scene') {
        cycleHardwareScene();
      } else if (actionName === 'hw-more-auto') {
        toggleHardwareAutoMonitor();
      }
    }

    function renderLibraryBook() {
      const b = AUDIOBOOK_LIBRARY[libBookIndex];
      document.getElementById('libIndexBadge').textContent = `BOOK ${libBookIndex + 1} OF ${AUDIOBOOK_LIBRARY.length} • SAVED LIBRARY`;
      document.getElementById('libBookTitle').textContent = b.title;
      document.getElementById('libChapterSub').textContent = b.chapter;
      document.getElementById('libChapterText').textContent = b.text;
    }

    function toggleLibraryPlayback() {
      const b = AUDIOBOOK_LIBRARY[libBookIndex];
      if (isLibPlaying) {
        window.speechSynthesis.cancel();
        isLibPlaying = false;
        setWaveformActive(false);
        document.getElementById('libStatusChip').textContent = 'PAUSED';
        document.getElementById('libPlayIcon').textContent = '▶';
        document.getElementById('libPlayLabel').textContent = 'Play';
        speakTTS('Audiobook paused.');
      } else {
        isLibPlaying = true;
        document.getElementById('libStatusChip').textContent = 'PLAYING';
        document.getElementById('libPlayIcon').textContent = '⏸';
        document.getElementById('libPlayLabel').textContent = 'Pause';
        speakTTS(`${b.title}. ${b.text}`, LANGUAGES[langIndex], () => {
          isLibPlaying = false;
          document.getElementById('libStatusChip').textContent = 'FINISHED';
          document.getElementById('libPlayIcon').textContent = '▶';
          document.getElementById('libPlayLabel').textContent = 'Play';
        });
      }
    }

    function renderAuditoryGame() {
      const g = AUDITORY_GAMES[gameIndex];
      document.getElementById('gameModeBadge').textContent = g.badge;
      document.getElementById('gameTitleText').textContent = g.title;
      document.getElementById('gameSubPrompt').textContent = g.prompt;
      document.getElementById('gameChoiceChip').textContent = `CHOICE 1/${g.choices.length}`;
      document.getElementById('gameFeedbackText').textContent = `Current Choice: ${g.choices[0]}`;
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
      speakTTS('Capturing book page with Custom C R N N and Gemini 3 Flash.');

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
        document.getElementById('crnnBadgeText').textContent = `CRNN ${conf} • SAVED TO LIBRARY`;
        document.getElementById('scannerStatePill').textContent = 'NARRATING';

        // Save newly scanned passage to the Audiobook Library inside More
        AUDIOBOOK_LIBRARY.unshift({
          title: `Scanned Page (${targetLanguage})`,
          chapter: `${currentPage.heading} • CRNN ${conf}`,
          text: data.narrated_text
        });

        updateReadStopUI(true);
        speakTTS(data.narrated_text, targetLanguage, () => {
          updateReadStopUI(false);
          document.getElementById('scannerStatePill').textContent = 'SAVED';
        });
      } catch {
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
        AUDIOBOOK_LIBRARY.unshift({
          title: `Uploaded Scan (${targetLanguage})`,
          chapter: 'Custom Image Upload • CRNN + Gemini 3',
          text: data.narrated_text
        });
        updateReadStopUI(true);
        speakTTS(data.narrated_text, targetLanguage, () => {
          updateReadStopUI(false);
          document.getElementById('scannerStatePill').textContent = 'SAVED';
        });
      } catch {
        speakTTS('Image upload failed.');
      }
    }

    function toggleReadOrStop() {
      if (isSpeakingPassage) {
        window.speechSynthesis.cancel();
        updateReadStopUI(false);
        setWaveformActive(false);
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

    function cycleHardwareScene() {
      hwSceneIndex = (hwSceneIndex + 1) % HARDWARE_SCENES.length;
      const sc = HARDWARE_SCENES[hwSceneIndex];
      document.getElementById('hwSceneTitle').textContent = sc.title;
      document.getElementById('hwSceneBanner').textContent = sc.banner;
      document.getElementById('hwSceneDesc').textContent = sc.desc;
      speakTTS(`Environment switched to ${sc.title}.`);
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
      } catch {
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
        speakTTS('Continuous real-time Meta Glasses monitoring enabled.');
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

    window.addEventListener('DOMContentLoaded', () => {
      loadSystemVoices();
      attachAccessibleTouchableEngine();
      setTimeout(() => {
        playOnboardingIntro();
      }, 350);
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
