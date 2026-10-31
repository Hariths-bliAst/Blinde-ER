/* Blind-ER web app logic
 *  - Tap engine: 1st tap = hear label, 2nd tap = activate (keyboard / screen-reader
 *    activations, which have event.detail === 0, activate immediately).
 *  - Narrator: sentence-chunked TTS with true pause/resume (keeps sentence + word position).
 *  - AI Mode: Web Speech recognition -> on-device keyword matcher -> Gemini fallback.
 *  - Camera AI: live camera frame -> /api/describe-scene (Gemini vision).
 *  Voice policy: speak only what the user needs; use short earcons for everything else.
 */
'use strict';

const $ = (id) => document.getElementById(id);

// ===========================================================================
// State & data
// ===========================================================================
const LANGUAGES = ['English', 'Malay', 'Spanish', 'French', 'Mandarin'];
const LOCALES = { English: 'en-US', Malay: 'ms-MY', Spanish: 'es-ES', French: 'fr-FR', Mandarin: 'zh-CN' };
const VOLUME_LEVELS = [0.25, 0.5, 0.75, 1.0];
const TONE_PRESETS = [
  { name: 'Natural', rate: 1.0, pitch: 1.0 },
  { name: 'Calm', rate: 0.88, pitch: 0.92 },
  { name: 'Fast', rate: 1.2, pitch: 1.04 },
  { name: 'Deep', rate: 0.95, pitch: 0.82 },
];
const PARENT_SCREEN = {
  home: 'home', scanner: 'home', camera: 'home', more: 'home', games: 'home',
  settings: 'home', library: 'more', hardware: 'more', onboarding: 'onboarding',
};
const SCREEN_NAMES = {
  home: 'Home', scanner: 'Book Scanner', camera: 'Camera', more: 'Library and more',
  library: 'Library', games: 'Games', settings: 'Settings', hardware: 'Wearables', onboarding: 'Setup',
};

const state = {
  screen: 'onboarding',
  langIndex: 0,
  volIndex: 3,
  toneIndex: 0,
  voiceIndex: 0,
  voices: [],
  lastSpoken: '',
  pageIndex: 0,
  libIndex: 0,
  lastScanText: '',
  pendingScanText: '',
  scannerAwaitingConfirmation: false,
  scannerPausedMenu: false,
  gameIndex: 0,
  gameChoice: 0,
  gameScore: 0,
  gameStreak: 0,
  hwScene: 0,
  cameraBusy: false,
  scanBusy: false,
  lastDescription: '',
  isOffline: !navigator.onLine,
};

const lang = () => LANGUAGES[state.langIndex];

const BOOK_PAGES = [
  { heading: 'CHAPTER IV: THE SILENT LIGHTHOUSE', strip: 'Silent Light.',
    preview: '“The wind howled ac- ross the jagged cliffs of Northum- berland…”' },
  { heading: 'CHAPTER V: BENEATH NORTHERN STARS', strip: 'Dark storm.',
    preview: '“Elara raised her lantern toward the stone tower. A distant bell echoed…”' },
];

const LIBRARY = [
  { title: 'The Silent Lighthouse', chapter: 'Chapter IV',
    text: 'Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm. Elara clutched her weathered lantern tighter. "Someone left the beacon burning," she whispered into the darkness. Below her, the sea crashed like an ancient drum, summoning the lost ships home.' },
  { title: 'Beneath Northern Stars', chapter: 'Chapter V',
    text: 'Chapter Five: Beneath Northern Stars. Elara raised her lantern toward the ancient stone tower. The distant bell echoed three times across the freezing bay. Somewhere beyond the breakers, a ship answered with a single horn.' },
  { title: 'Designing Without Sight', chapter: 'Chapter I',
    text: 'Chapter One: Designing Without Sight. True accessibility begins when every action on a screen can be discovered safely by touch. Every action should be confirmed clearly by voice. Nothing should ever depend on seeing a tiny icon.' },
  { title: 'Songs of the Harbor', chapter: 'Chapter II',
    text: 'Chapter Two: Songs of the Harbor. The fishermen sang as they mended their nets at dawn. Their voices drifted over the water like gulls. By noon the harbor was quiet again.' },
];

const GAMES = [
  { badge: 'GAME 1/4 • PITCH', title: 'Pitch Training', prompt: 'Is the second tone higher or lower?',
    choices: ['Higher', 'Lower', 'Same'], correct: 0,
    play: (ctx, v) => {
      // 1.3s initial delay ensures TalkBack / VoiceOver / prompt TTS finishes before notes play
      const delay = 1.3;
      const noteDur = 0.85; // Elongated tones for clear pitch discrimination
      const gap = 0.45;
      note(ctx, 440, delay, noteDur, v, 'triangle');
      note(ctx, 587.33, delay + noteDur + gap, noteDur, v, 'triangle');
    } },
  { badge: 'GAME 2/4 • NOTES', title: 'Note Recognising', prompt: 'Which note is playing?',
    choices: ['A4', 'C4', 'E4', 'G4'], correct: 0,
    play: (ctx, v) => {
      const delay = 1.3;
      note(ctx, 440, delay, 0.95, v, 'triangle');
      note(ctx, 880, delay + 0.1, 0.75, v * 0.35, 'triangle');
    } },
  { badge: 'GAME 3/4 • CHORDS', title: 'Chord Identifying', prompt: 'Is the chord major, minor, or diminished?',
    choices: ['Major', 'Minor', 'Diminished'], correct: 0,
    play: (ctx, v) => {
      const delay = 1.3;
      note(ctx, 261.63, delay, 1.1, v * 0.6, 'triangle');
      note(ctx, 329.63, delay + 0.1, 1.0, v * 0.6, 'triangle');
      note(ctx, 392, delay + 0.2, 0.9, v * 0.6, 'triangle');
    } },
  { badge: 'GAME 4/4 • PATTERN', title: 'Pattern Match', prompt: 'What shape does the melody make?',
    choices: ['Going up', 'Going down', 'Up then down'], correct: 2,
    play: (ctx, v) => {
      const delay = 1.3;
      note(ctx, 330, delay, 0.55, v, 'triangle');
      note(ctx, 659.25, delay + 0.65, 0.55, v, 'triangle');
      note(ctx, 330, delay + 1.3, 0.65, v, 'triangle');
    } },
];

const HW_SCENES = [
  { id: 'CROSSWALK', title: 'Urban Crosswalk', desc: 'Simulated glasses view: street crossing' },
  { id: 'PHARMACY', title: 'Medicine Bottle', desc: 'Simulated glasses view: pharmacy label' },
  { id: 'BOOKSTORE', title: 'Book Reading', desc: 'Simulated glasses view: open book' },
];

// ===========================================================================
// Network helper with strict timeouts
// ===========================================================================
async function fetchJSON(url, options = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const t = new Error('timeout');
      t.timeout = true;
      throw t;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const NETWORK_ERROR_MSG = (err) =>
  err && err.timeout ? 'Network timeout. Please try again.' : 'Connection problem. Please try again.';

// ===========================================================================
// Earcons (non-verbal audio cues)
// ===========================================================================
let audioCtx = null;
function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function note(ctx, freq, start, dur, vol = 0.2, type = 'sine') {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(Math.max(0.02, vol * 0.22), ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  } catch { /* audio unavailable */ }
}

const EARCONS = {
  tap: [[520, 0, 0.05]],
  select: [[660, 0, 0.06], [880, 0.07, 0.08]],
  listen: [[700, 0, 0.07], [1050, 0.08, 0.1]],
  heard: [[900, 0, 0.06]],
  thinking: [[440, 0, 0.08], [550, 0.12, 0.08]],
  done: [[880, 0, 0.12]],
  error: [[260, 0, 0.18], [200, 0.2, 0.22]],
  boundary: [[300, 0, 0.08]],
};
function earcon(name) {
  const ctx = ensureAudioCtx();
  if (!ctx || !EARCONS[name]) return;
  const v = VOLUME_LEVELS[state.volIndex];
  EARCONS[name].forEach(([f, s, d]) => note(ctx, f, s, d, v));
  if (navigator.vibrate) navigator.vibrate(name === 'select' ? 30 : name === 'error' ? [60, 40, 60] : 10);
}

// ===========================================================================
// Assistant visual state
// ===========================================================================
function setAssistant(mode) {
  document.body.dataset.assistant = mode; // idle | listening | thinking | speaking
}

function setCaption(text) {
  $('ttsCaptionBar').textContent = text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

// ===========================================================================
// Speech output (short prompts)
// ===========================================================================
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

function makeUtterance(text, language) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LOCALES[language || lang()] || 'en-US';
  u.volume = VOLUME_LEVELS[state.volIndex];
  u.rate = TONE_PRESETS[state.toneIndex].rate;
  u.pitch = TONE_PRESETS[state.toneIndex].pitch;
  if (state.voices.length && (!language || language === 'English')) {
    u.voice = state.voices[state.voiceIndex % state.voices.length];
  }
  return u;
}

let promptGen = 0;
window.activeSpeechUtterance = null;

function speak(text, { language, onEnd } = {}) {
  if (!text) return;
  state.lastSpoken = text;
  setCaption(text);
  narrator.interrupt();          // keep book position instead of losing it
  ai.pauseForSpeech();           // don't let the mic hear our own voice

  const gen = ++promptGen;
  const finish = () => {
    if (gen !== promptGen) return;
    window.activeSpeechUtterance = null;
    setAssistant('idle');
    ai.resumeAfterSpeech();
    if (onEnd) onEnd();
  };

  if (!synth) {
    earcon('tap');
    setTimeout(finish, 600);
    return;
  }
  try { synth.cancel(); } catch { /* ignore */ }
  const u = makeUtterance(text, language);
  // Prevent Chrome V8 garbage collection from prematurely killing active speech
  window.activeSpeechUtterance = u;
  u.onstart = () => { if (gen === promptGen) setAssistant('speaking'); };
  u.onend = finish;
  u.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    earcon('error'); // muted / failed TTS -> audible + haptic fallback
    finish();
  };
  synth.speak(u);
}

function loadVoices() {
  if (!synth) return;
  const voices = synth.getVoices().filter((v) => v.lang && v.lang.startsWith('en'));
  if (voices.length) {
    state.voices = voices;
    $('valVoice').textContent = shortVoiceName(voices[state.voiceIndex % voices.length]);
  }
}
function shortVoiceName(v) {
  return v.name.replace(/Microsoft |Google |Online \(Natural\) - |English.*$/g, '').trim().slice(0, 16) || 'Default';
}
if (synth) synth.onvoiceschanged = loadVoices;

// ===========================================================================
// Narrator — sentence-chunked reading with real pause / resume
// ===========================================================================
function splitSentences(text, language) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter(LOCALES[language] || 'en', { granularity: 'sentence' });
    return [...seg.segment(clean)].map((s) => s.segment.trim()).filter(Boolean);
  }
  return clean.match(/[^.!?。！？]+[.!?。！？]+["'”’)]*|[^.!?。！？]+$/g).map((s) => s.trim()).filter(Boolean);
}

const narrator = {
  owner: null,          // 'scanner' | 'library'
  sentences: [],
  index: 0,             // current sentence
  offset: 0,            // char offset inside current sentence (word-level resume)
  language: 'English',
  playing: false,
  paused: false,
  gen: 0,

  load(owner, text, language) {
    this.stop(false);
    this.owner = owner;
    this.language = language;
    this.sentences = splitSentences(text, language);
    this.index = 0;
    this.offset = 0;
    this.notify();
  },

  hasContent(owner) {
    return this.owner === owner && this.sentences.length > 0;
  },

  play() {
    if (!this.sentences.length || !synth) return;
    promptGen++;              // invalidate any pending short prompt callbacks
    synth.cancel();
    this.playing = true;
    this.paused = false;
    this.speakCurrent();
    this.notify();
  },

  speakCurrent() {
    const gen = ++this.gen;
    if (this.index >= this.sentences.length) {
      this.playing = false;
      this.paused = false;
      this.index = 0;
      this.offset = 0;
      setAssistant('idle');
      earcon('done');
      this.notify('finished');
      return;
    }
    const base = this.offset;
    const text = this.sentences[this.index].slice(base);
    const u = makeUtterance(text, this.language);
    u.onstart = () => { if (gen === this.gen) setAssistant('speaking'); };
    u.onboundary = (e) => {
      if (gen === this.gen && e.name === 'word') this.offset = base + e.charIndex;
    };
    u.onend = () => {
      if (gen !== this.gen) return;   // stale (paused/cancelled)
      this.index += 1;
      this.offset = 0;
      this.notify();
      this.speakCurrent();
    };
    u.onerror = (e) => {
      if (gen !== this.gen || e.error === 'interrupted' || e.error === 'canceled') return;
      this.playing = false;
      this.paused = true;
      earcon('error');
      setAssistant('idle');
      this.notify();
    };
    setCaption(this.sentences[this.index]);
    synth.speak(u);
  },

  pause() {
    if (!this.playing) return;
    this.gen++;                // ignore the onend that cancel() fires
    this.playing = false;
    this.paused = true;
    synth.cancel();
    setAssistant('idle');
    this.notify();
  },

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  },

  restart() {
    this.index = 0;
    this.offset = 0;
    this.play();
  },

  replayLast() {
    this.index = Math.max(0, this.index - 1);
    this.offset = 0;
    this.play();
  },

  // Called before any short prompt: pause (keep position) rather than lose it.
  interrupt() {
    if (this.playing) this.pause();
  },

  stop(notify = true) {
    this.gen++;
    const wasActive = this.playing;
    this.playing = false;
    this.paused = false;
    this.index = 0;
    this.offset = 0;
    if (wasActive && synth) synth.cancel();
    if (notify) this.notify();
  },

  notify() {
    updateReaderUI();
  },
};

function updateReaderUI() {
  const n = narrator;
  const total = n.sentences.length;
  const ratio = total ? Math.min(1, (n.index + (n.offset ? 0.5 : 0)) / total) : 0;
  const label = n.playing ? 'Pause' : n.paused ? 'Resume' : null;

  // Scanner controls
  const sOwn = n.owner === 'scanner';
  const sLabel = sOwn && label ? label : 'Read';
  $('readStopLabel').textContent = sLabel;
  $('readStopIcon').textContent = sOwn && n.playing ? '⏸' : '▶';
  $('readStopBtn').dataset.label = sLabel;
  $('scannerProgress').style.transform = `scaleX(${sOwn ? ratio : 0})`;
  if (sOwn && !state.scanBusy) {
    $('scannerStatePill').textContent = n.playing ? 'READING' : n.paused ? 'PAUSED' : total ? 'SAVED' : 'READY';
  }

  // Library controls
  const lOwn = n.owner === 'library';
  const lLabel = lOwn && label ? label : 'Play';
  $('libPlayLabel').textContent = lLabel;
  $('libPlayIcon').textContent = lOwn && n.playing ? '⏸' : '▶';
  $('libPlayBtn').dataset.label = lLabel;
  $('libProgress').style.transform = `scaleX(${lOwn ? ratio : 0})`;
  $('libStatusChip').textContent = lOwn ? (n.playing ? 'PLAYING' : n.paused ? 'PAUSED' : 'READY') : 'READY';
  $('libProgressChip').textContent = lOwn && total ? `${Math.min(n.index + 1, total)} / ${total}` : `0 / ${splitSentences(LIBRARY[state.libIndex].text).length}`;
}

// ===========================================================================
// Navigation
// ===========================================================================
function navigate(screen, { announce = true } = {}) {
  if (!$(`screen-${screen}`)) return;
  const leaving = state.screen;
  if (leaving === 'camera' && screen !== 'camera') camera.stop();
  if (leaving === 'scanner' && screen !== 'scanner') {
    bookCamera.stop();
    state.scannerAwaitingConfirmation = false;
    state.scannerPausedMenu = false;
  }
  if ((leaving === 'scanner' || leaving === 'library') && screen !== leaving && narrator.owner === leaving) {
    narrator.pause(); // keep the position so they can come back and resume
  }

  const swap = () => {
    clearFocus();
    document.querySelectorAll('.app-screen').forEach((s) => s.classList.remove('active'));
    $(`screen-${screen}`).classList.add('active');
    state.screen = screen;
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(swap);
  else swap();

  if (screen === 'scanner') {
    bookCamera.start();
    renderScannerBottomBar();
  }
  if (screen === 'library') renderLibraryBook();
  if (screen === 'games') renderGame();
  if (screen === 'more') $('libraryCountChip').textContent = `${LIBRARY.length} books saved`;

  if (screen === 'camera') {
    camera.start();
  } else if (announce) {
    speak(SCREEN_NAMES[screen]);
  }
}

function goBack() {
  navigate(PARENT_SCREEN[state.screen] || 'home');
}

// ===========================================================================
// Tap engine
// ===========================================================================
let focusedEl = null;
let activationLockUntil = 0;
const ACTIVATION_DEBOUNCE_MS = 350;

function clearFocus() {
  focusedEl = null;
  document.querySelectorAll('.focused-touch').forEach((b) => b.classList.remove('focused-touch'));
}

function activate(el) {
  const now = performance.now();
  if (now < activationLockUntil) return;     // swallow accidental rapid taps
  activationLockUntil = now + ACTIVATION_DEBOUNCE_MS;
  clearFocus();
  earcon('select');
  runAction(el.dataset.action);
}

function attachTapEngine() {
  document.querySelectorAll('.a11y-touchable').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-stop-tap]')) return;
      e.stopPropagation();
      ensureAudioCtx();

      // Keyboard Enter/Space and screen-reader double-tap produce detail === 0: act directly.
      if (e.detail === 0 || focusedEl === el) {
        activate(el);
        return;
      }
      clearFocus();
      focusedEl = el;
      el.classList.add('focused-touch');
      earcon('tap');
      const label = el.dataset.label || el.innerText.trim();
      const hint = el.dataset.hint;
      speak(hint ? `${label}. ${hint}` : label);
    });
  });

  // Boundary cue: touching empty space in the upper area.
  let lastBoundary = 0;
  document.querySelectorAll('.feature-hero, .home-wrap').forEach((area) => {
    area.addEventListener('click', (e) => {
      if (e.target !== area) return;
      // Do not interrupt active speech when tapping empty space
      if ((synth && synth.speaking) || document.body.dataset.assistant === 'speaking') {
        return;
      }
      const now = performance.now();
      if (now - lastBoundary < 3000) { earcon('boundary'); return; }
      lastBoundary = now;
      earcon('boundary');
      speak(area.classList.contains('feature-hero')
        ? 'Navigation area: buttons along the bottom edge.'
        : 'Empty space.');
    });
  });
}

// ===========================================================================
// Actions
// ===========================================================================
const ACTIONS = {
  'select-low-vision': () => { $('modeBadge').textContent = 'LOW VISION'; navigate('home'); },
  'select-fully-blind': () => { $('modeBadge').textContent = 'AUDIO FIRST'; navigate('home'); },
  'go-back': goBack,
  'nav-home': () => navigate('home'),
  'nav-onboarding': () => navigate('onboarding'),
  'nav-scanner': () => navigate('scanner'),
  'nav-camera': () => navigate('camera'),
  'nav-more': () => navigate('more'),
  'nav-library': () => navigate('library'),
  'nav-games': () => navigate('games'),
  'nav-settings': () => navigate('settings'),
  'nav-hardware-meta': () => { $('hwDeviceBanner').textContent = '🕶️ SMART GLASSES'; navigate('hardware'); },
  'nav-hardware-bemyeyes': () => { $('hwDeviceBanner').textContent = '🤝 BE MY EYES'; navigate('hardware'); },
  'ai-toggle': () => ai.toggle(),

  // Scanner
  'scanner-capture': () => runBookCapture(),
  'scanner-read-toggle': () => scannerReadToggle(),
  'scanner-confirm-read': () => {
    state.scannerAwaitingConfirmation = false;
    renderScannerBottomBar();
    if (state.pendingScanText) {
      startScannerNarration(state.pendingScanText);
      state.pendingScanText = '';
    } else if (narrator.hasContent('scanner')) {
      narrator.play();
      speak('Reading.');
    }
  },
  'scanner-cancel-read': () => {
    state.scannerAwaitingConfirmation = false;
    state.pendingScanText = '';
    narrator.stop();
    renderScannerBottomBar();
    speak('Reading cancelled. Ready to scan next page.');
  },
  'scanner-resume-current': () => {
    state.scannerPausedMenu = false;
    renderScannerBottomBar();
    narrator.play();
    speak('Resuming.');
  },
  'scanner-replay-last': () => {
    state.scannerPausedMenu = false;
    renderScannerBottomBar();
    narrator.replayLast();
    speak('Replaying last sentence.');
  },
  'scanner-restart-page': () => {
    state.scannerPausedMenu = false;
    renderScannerBottomBar();
    narrator.restart();
    speak('Restarting from beginning of page.');
  },
  'scanner-restart': () => {
    if (narrator.hasContent('scanner')) narrator.restart();
    else speak('Nothing to read yet. Tap Capture first.');
  },
  'scanner-next': () => {
    state.pageIndex = (state.pageIndex + 1) % BOOK_PAGES.length;
    renderPagePreview();
    runBookCapture();
  },

  // Library
  'lib-play-toggle': () => libraryPlayToggle(),
  'lib-prev-book': () => switchBook(-1),
  'lib-next-book': () => switchBook(1),

  // Camera
  'camera-describe': () => camera.describe(''),
  'camera-ask': () => camera.ask(),
  'camera-read-text': () => camera.describe('Read out all the text you can see, in reading order. If there is no readable text, say so.'),
  'camera-repeat': () => speak(state.lastDescription || 'Nothing described yet.'),

  // Games
  'game-play-sound': () => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    setAssistant('speaking');
    GAMES[state.gameIndex].play(ctx, VOLUME_LEVELS[state.volIndex]);
    setTimeout(() => setAssistant('idle'), 1000);
  },
  'game-cycle-choice': () => {
    const g = GAMES[state.gameIndex];
    state.gameChoice = (state.gameChoice + 1) % g.choices.length;
    renderGameChoice();
    speak(g.choices[state.gameChoice]);
  },
  'game-submit-answer': () => {
    const g = GAMES[state.gameIndex];
    if (state.gameChoice === g.correct) {
      state.gameScore += 10;
      state.gameStreak += 1;
      earcon('done');
      speak(`Correct. Score ${state.gameScore}.`);
    } else {
      state.gameStreak = 0;
      earcon('error');
      speak('Try again.');
    }
    $('gameScoreChip').textContent = `SCORE ${state.gameScore} • STREAK ${state.gameStreak}`;
  },
  'game-next-mode': () => {
    state.gameIndex = (state.gameIndex + 1) % GAMES.length;
    state.gameChoice = 0;
    renderGame();
    speak(`${GAMES[state.gameIndex].title}. ${GAMES[state.gameIndex].prompt}`);
  },

  // Settings
  'setting-volume': () => setVolume((state.volIndex + 1) % VOLUME_LEVELS.length),
  'setting-tone': () => {
    state.toneIndex = (state.toneIndex + 1) % TONE_PRESETS.length;
    $('valTone').textContent = TONE_PRESETS[state.toneIndex].name;
    speak(TONE_PRESETS[state.toneIndex].name);
  },
  'setting-voice': () => {
    loadVoices();
    if (!state.voices.length) { speak('Default voice.'); return; }
    state.voiceIndex = (state.voiceIndex + 1) % state.voices.length;
    const name = shortVoiceName(state.voices[state.voiceIndex]);
    $('valVoice').textContent = name;
    speak(name);
  },
  'setting-language': () => {
    state.langIndex = (state.langIndex + 1) % LANGUAGES.length;
    const l = lang();
    $('valLanguage').textContent = l;
    $('scannerLangBadge').textContent = `AUDIOBOOK • ${l.toUpperCase()}`;
    $('libLangBadge').textContent = `NARRATION • ${l.toUpperCase()}`;
    if (ai.rec) ai.restartRecognizer();
    speak(l);
  },
  'setting-update': async () => {
    $('valUpdate').textContent = 'CHECKING…';
    try {
      const data = await fetchJSON('/health', {}, 8000);
      $('valUpdate').textContent = `v${data.version || '2.4.0'}`;
      speak('Up to date.');
    } catch (err) {
      $('valUpdate').textContent = 'OFFLINE';
      speak(NETWORK_ERROR_MSG(err));
    }
  },

  // Wearables
  'hw-meta-live': () => runHardwareAssist('META_GLASSES'),
  'hw-bemyeyes': () => runHardwareAssist('BE_MY_EYES'),
  'hw-next-scene': () => {
    state.hwScene = (state.hwScene + 1) % HW_SCENES.length;
    const s = HW_SCENES[state.hwScene];
    $('hwSceneTitle').textContent = s.title;
    $('hwSceneDesc').textContent = s.desc;
    speak(s.title);
  },
};

function runAction(name) {
  const fn = ACTIONS[name];
  if (fn) fn();
}

function setVolume(i) {
  state.volIndex = Math.max(0, Math.min(VOLUME_LEVELS.length - 1, i));
  const pct = `${Math.round(VOLUME_LEVELS[state.volIndex] * 100)}%`;
  $('valVolume').textContent = pct;
  speak(`Volume ${pct}`);
}

// ===========================================================================
// Book scanner with Real Phone Camera Integration & Guided Prompts
// ===========================================================================
const bookCamera = {
  stream: null,

  async start() {
    const box = $('scannerVfBox');
    const msg = $('bookScannerFallbackMsg');
    if (this.stream) return;

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      if (msg) msg.textContent = 'Double-tap Capture to take a photo of the book.';
      return;
    }
    if (msg) msg.textContent = 'Starting phone camera…';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (state.screen !== 'scanner') { this.stop(); return; }
      const video = $('bookScannerVideo');
      if (video) {
        video.srcObject = this.stream;
        await video.play().catch(() => {});
      }
      if (box) box.classList.add('live');
    } catch {
      this.stream = null;
      if (box) box.classList.remove('live');
      if (msg) msg.textContent = 'Camera ready. Double-tap Capture to take photo.';
    }
  },

  stop() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
    const video = $('bookScannerVideo');
    if (video) video.srcObject = null;
    const box = $('scannerVfBox');
    if (box) box.classList.remove('live');
  },

  captureFrame() {
    const video = $('bookScannerVideo');
    if (!this.stream || !video || !video.videoWidth) return Promise.resolve(null);
    const canvas = $('bookScannerCanvas');
    // Scale to max 640px to maximize speed and minimize latency
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.75));
  },
};

function renderPagePreview() {
  const p = BOOK_PAGES[state.pageIndex];
  $('bookPreviewHeading').textContent = p.heading;
  $('bookPreviewText').textContent = p.preview;
}

function renderScannerBottomBar() {
  const b1 = $('scannerBtn1');
  const b2 = $('scannerBtn2');
  const b3 = $('readStopBtn');
  const b4 = $('scannerBtn4');
  const b5 = $('scannerBtn5');
  if (!b1 || !b2 || !b3 || !b4 || !b5) return;

  if (state.scannerAwaitingConfirmation) {
    b1.dataset.action = 'scanner-cancel-read';
    b1.dataset.label = 'Cancel reading';
    $('scannerBtn1Icon').textContent = '✕';
    $('scannerBtn1Label').textContent = 'Cancel';

    b2.dataset.action = 'scanner-confirm-read';
    b2.dataset.label = 'Start reading';
    $('scannerBtn2Icon').textContent = '▶';
    $('scannerBtn2Label').textContent = 'Start Reading';

    b3.style.display = 'none';
    b4.style.display = 'none';
    b5.style.display = 'none';
    return;
  }

  if (state.scannerPausedMenu) {
    b1.dataset.action = 'go-back';
    b1.dataset.label = 'Back';
    $('scannerBtn1Icon').textContent = '←';
    $('scannerBtn1Label').textContent = 'Back';

    b2.dataset.action = 'scanner-resume-current';
    b2.dataset.label = 'Resume current';
    $('scannerBtn2Icon').textContent = '▶';
    $('scannerBtn2Label').textContent = 'Resume';

    b3.style.display = 'flex';
    b3.dataset.action = 'scanner-replay-last';
    b3.dataset.label = 'Replay last sentence';
    $('readStopIcon').textContent = '↺';
    $('readStopLabel').textContent = 'Replay Last';

    b4.style.display = 'flex';
    b4.dataset.action = 'scanner-restart-page';
    b4.dataset.label = 'Restart from beginning of page';
    $('scannerBtn4Icon').textContent = '⏮';
    $('scannerBtn4Label').textContent = 'Page Start';

    b5.style.display = 'none';
    return;
  }

  // Normal scanner state
  b1.dataset.action = 'go-back';
  b1.dataset.label = 'Back';
  $('scannerBtn1Icon').textContent = '←';
  $('scannerBtn1Label').textContent = 'Back';

  b2.dataset.action = 'scanner-capture';
  b2.dataset.label = 'Capture page';
  $('scannerBtn2Icon').textContent = '◎';
  $('scannerBtn2Label').textContent = 'Capture';

  b3.style.display = 'flex';
  b3.dataset.action = 'scanner-read-toggle';
  const label = narrator.playing ? 'Pause' : narrator.paused ? 'Resume' : 'Read';
  b3.dataset.label = label;
  $('readStopIcon').textContent = narrator.playing ? '⏸' : '▶';
  $('readStopLabel').textContent = label;

  b4.style.display = 'flex';
  b4.dataset.action = 'scanner-restart';
  b4.dataset.label = 'Restart reading';
  $('scannerBtn4Icon').textContent = '↺';
  $('scannerBtn4Label').textContent = 'Restart';

  b5.style.display = 'flex';
  b5.dataset.action = 'scanner-next';
  b5.dataset.label = 'Next page';
  $('scannerBtn5Icon').textContent = '→';
  $('scannerBtn5Label').textContent = 'Next';
}

function startScannerNarration(text) {
  state.lastScanText = text;
  $('scannerOutputText').textContent = text;
  narrator.load('scanner', text, lang());
  narrator.play();
  speak('Reading page.');
}

function saveToLibrary(title, chapter, text) {
  LIBRARY.unshift({ title, chapter, text });
  state.libIndex = 0;
}

async function runBookCapture(payloadFn) {
  if (state.scanBusy) { earcon('boundary'); return; }

  // If no custom payload function, check for real phone camera capture
  if (!payloadFn) {
    const blob = await bookCamera.captureFrame();
    if (blob) {
      const fd = new FormData();
      fd.append('image', blob, 'camera_book_page.jpg');
      fd.append('target_language', lang());
      if (state.isOffline) fd.append('offline_mode', 'true');
      payloadFn = () => fetchJSON('/api/scan-book-page', { method: 'POST', body: fd }, 30000);
    } else if (!bookCamera.stream) {
      // If camera stream not active, trigger the phone's native camera shutter via input
      $('scannerUpload').click();
      return;
    }
  }

  state.scanBusy = true;
  state.scannerAwaitingConfirmation = false;
  state.scannerPausedMenu = false;
  narrator.stop();
  $('scannerStatePill').textContent = state.isOffline ? 'OFFLINE CRNN…' : 'SCANNING…';
  setAssistant('thinking');
  setCaption(state.isOffline ? 'Running on-device CRNN OCR…' : 'Scanning page…');
  earcon('thinking');

  try {
    const data = payloadFn
      ? await payloadFn()
      : await fetchJSON('/api/demo-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_language: lang(),
            sample_text: BOOK_PAGES[state.pageIndex].strip,
            offline_mode: state.isOffline,
          }),
        }, 25000);

    const text = typeof data?.narrated_text === 'string' ? data.narrated_text.trim() : '';
    state.scanBusy = false;
    if (!text) {
      $('scannerStatePill').textContent = 'NO TEXT';
      earcon('error');
      speak('No book text detected. Align camera with the page and try again.');
      return;
    }

    const isOfflineScan = data?.offline_mode || state.isOffline;
    saveToLibrary(`Scanned page (${lang()})`, isOfflineScan ? 'CRNN Offline OCR' : 'Scanned Document', text);
    state.lastScanText = text;
    state.pendingScanText = text;
    $('scannerOutputText').textContent = text;
    $('scannerStatePill').textContent = isOfflineScan ? 'CRNN READY' : 'DETECTED';
    $('scannerLensBadge').textContent = isOfflineScan ? 'ON-DEVICE CRNN • OFFLINE' : 'LIVE CAMERA • DOCUMENT LENS';

    // Per user requirement: Ask before starting to read
    state.scannerAwaitingConfirmation = true;
    renderScannerBottomBar();
    setCaption(isOfflineScan ? 'Offline text ready. Start reading?' : 'Start reading? Double-tap Start Reading or Cancel.');
    earcon('select');
    speak(isOfflineScan
      ? 'Page text detected using on-device CRNN model. Would you like me to start reading? Double-tap Start Reading to begin, or double-tap Cancel.'
      : 'Page text detected. Would you like me to start reading? Double-tap Start Reading to begin, or double-tap Cancel.'
    );
  } catch (err) {
    state.scanBusy = false;
    $('scannerStatePill').textContent = 'ERROR';
    earcon('error');
    speak(NETWORK_ERROR_MSG(err));
  }
}

function scannerReadToggle() {
  if (narrator.hasContent('scanner')) {
    if (narrator.playing) {
      narrator.pause();
      state.scannerPausedMenu = true;
      renderScannerBottomBar();
      setCaption('Paused');
      earcon('select');
      // Per user requirement: When paused, offer current, reread last sentence, or start of page
      speak(`Paused at sentence ${narrator.index + 1}. Double-tap Resume to continue, double-tap Replay to reread the last sentence, or double-tap Page Start to restart from the beginning.`);
      return;
    } else {
      state.scannerPausedMenu = false;
      renderScannerBottomBar();
      narrator.play();
      speak('Resuming.');
      return;
    }
  }
  if (state.pendingScanText) {
    state.scannerAwaitingConfirmation = false;
    renderScannerBottomBar();
    startScannerNarration(state.pendingScanText);
    state.pendingScanText = '';
    return;
  }
  if (state.lastScanText) {
    narrator.load('scanner', state.lastScanText, lang());
    narrator.play();
    speak('Reading.');
    return;
  }
  speak('Nothing to read yet. Double-tap Capture first.');
}

function handleScannerUpload(file) {
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  fd.append('target_language', lang());
  runBookCapture(() => fetchJSON('/api/scan-book-page', { method: 'POST', body: fd }, 30000));
}

// ===========================================================================
// Library
// ===========================================================================
function renderLibraryBook() {
  const b = LIBRARY[state.libIndex];
  $('libIndexBadge').textContent = `BOOK ${state.libIndex + 1} OF ${LIBRARY.length}`;
  $('libBookTitle').textContent = b.title;
  $('libChapterSub').textContent = b.chapter;
  $('libChapterText').textContent = b.text;
  updateReaderUI();
}

function libraryPlayToggle() {
  const book = LIBRARY[state.libIndex];
  if (narrator.hasContent('library') && narrator.bookTitle === book.title) {
    narrator.toggle();
    return;
  }
  narrator.load('library', book.text, lang());
  narrator.bookTitle = book.title;
  narrator.play();
}

function switchBook(delta) {
  if (narrator.owner === 'library') narrator.stop();
  state.libIndex = (state.libIndex + delta + LIBRARY.length) % LIBRARY.length;
  renderLibraryBook();
  speak(LIBRARY[state.libIndex].title);
}

// ===========================================================================
// Games
// ===========================================================================
function renderGame() {
  const g = GAMES[state.gameIndex];
  $('gameModeBadge').textContent = g.badge;
  $('gameTitleText').textContent = g.title;
  $('gameSubPrompt').textContent = g.prompt;
  renderGameChoice();
}
function renderGameChoice() {
  const g = GAMES[state.gameIndex];
  $('gameChoiceChip').textContent = `CHOICE ${state.gameChoice + 1}/${g.choices.length}`;
  $('gameFeedbackText').textContent = g.choices[state.gameChoice];
}

// ===========================================================================
// Wearables (simulated)
// ===========================================================================
async function runHardwareAssist(deviceMode) {
  const s = HW_SCENES[state.hwScene];
  $('hwStatePill').textContent = 'WORKING…';
  setAssistant('thinking');
  earcon('thinking');
  try {
    const data = await fetchJSON('/api/hardware-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_mode: deviceMode, scene_id: s.id, target_language: lang() }),
    }, 20000);
    const text = data?.spoken_guidance || 'No guidance available.';
    $('hwOutputText').textContent = text;
    $('hwStatePill').textContent = 'READY';
    speak(text, { language: lang() });
  } catch (err) {
    $('hwStatePill').textContent = 'OFFLINE';
    earcon('error');
    speak(NETWORK_ERROR_MSG(err));
  }
}

// ===========================================================================
// Camera AI (Gemini vision)
// ===========================================================================
const camera = {
  stream: null,
  pendingQuestion: '',

  async start() {
    const vf = $('viewfinder');
    const msg = $('cameraMsg');
    if (this.stream) return;

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      // Phones opening the app over plain http (LAN IP) can't use live camera;
      // fall back to the native camera via <input capture>.
      msg.textContent = 'Double-tap Describe to take a photo.';
      speak('Camera. Double tap Describe to take a photo.');
      return;
    }
    msg.textContent = 'Starting camera…';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (state.screen !== 'camera') { this.stop(); return; }
      const video = $('cameraVideo');
      video.srcObject = this.stream;
      await video.play().catch(() => {});
      vf.classList.add('live');
      speak('Camera ready.');
    } catch (err) {
      this.stream = null;
      vf.classList.remove('live');
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      msg.textContent = denied
        ? 'Camera permission denied. Enable camera access in your browser settings.'
        : 'No camera found. Double-tap Describe to choose a photo.';
      earcon('error');
      speak(msg.textContent);
    }
  },

  stop() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
    $('cameraVideo').srcObject = null;
    $('viewfinder').classList.remove('live');
  },

  captureFrame() {
    const video = $('cameraVideo');
    if (!this.stream || !video.videoWidth) return Promise.resolve(null);
    // Optimized 640px scaling for ultra-fast network transfer and LLM processing
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = $('captureCanvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.75));
  },

  async describe(question) {
    if (state.cameraBusy) { earcon('boundary'); return; }
    if (state.isOffline) {
      earcon('error');
      speak('Camera AI scene description requires an internet connection. On-device book scanner is available offline.');
      return;
    }
    if (state.screen !== 'camera') navigate('camera', { announce: false });

    const blob = await this.captureFrame();
    if (!blob) {
      // No live stream: use the device camera / photo picker instead.
      this.pendingQuestion = question;
      $('cameraFileInput').click();
      return;
    }
    await this.send(blob, question);
  },

  async send(blob, question) {
    state.cameraBusy = true;
    narrator.interrupt();
    $('cameraStatePill').textContent = 'LOOKING…';
    setAssistant('thinking');
    setCaption('Looking…');
    earcon('thinking');

    const fd = new FormData();
    fd.append('image', blob, 'frame.jpg');
    fd.append('question', question || '');
    fd.append('target_language', lang());

    try {
      const data = await fetchJSON('/api/describe-scene', { method: 'POST', body: fd }, 30000);
      const text = (data?.description || '').trim() || 'I could not see anything clearly. Try again.';
      state.lastDescription = text;
      $('cameraOutputText').textContent = text;
      $('cameraStatePill').textContent = data?.status === 'success' ? 'DONE' : 'UNAVAILABLE';
      state.cameraBusy = false;
      speak(text, { language: lang() });
    } catch (err) {
      state.cameraBusy = false;
      $('cameraStatePill').textContent = 'ERROR';
      earcon('error');
      speak(NETWORK_ERROR_MSG(err));
    }
  },

  ask() {
    if (!ai.supported) {
      speak('Voice questions need Chrome or Edge. Describing instead.', { onEnd: () => this.describe('') });
      return;
    }
    speak('Ask your question.', {
      onEnd: () => ai.listenOnce((q) => this.describe(q)),
    });
  },
};

// ===========================================================================
// AI Mode — voice navigation
// ===========================================================================
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const LOCAL_COMMANDS = [
  [/\b(turn off|stop|disable|exit|close)\b.*\b(ai|voice)( mode)?\b|\bstop listening\b/, 'ai_mode_off'],
  [/\b(help|what can i say|commands)\b/, 'help'],
  [/\b(repeat|say (that|it) again|what did you say)\b/, 'repeat'],
  [/\bread (the |this |that )?(text|sign|label|writing)\b/, 'read_text'],
  [/(what('?s| is) (in front|around|this|that|here|ahead)|describe|look at|what do you see|what can you see|in front of me|my surroundings|where am i)/, 'describe'],
  [/\b(open|go to|show|take me to|switch to)\b.*\b(camera|vision)\b|^camera$/, 'camera'],
  [/\b(open|go to|show|take me to|switch to)\b.*\bscanner\b|\bbook scanner\b/, 'scanner'],
  [/\b(open|go to|show|take me to|switch to)\b.*\b(library|audiobooks?|books)\b|^library$/, 'library'],
  [/\b(open|go to|show|take me to|switch to)\b.*\bgames?\b|^games?$/, 'games'],
  [/\b(open|go to|show|take me to|switch to)\b.*\bsettings?\b|^settings?$/, 'settings'],
  [/\b(go )?home\b|\bmain menu\b/, 'home'],
  [/\bgo back\b|^back$/, 'back'],
  [/\b(yes|start reading|read now|begin reading|read page)\b/, 'read_now'],
  [/\b(no|cancel|don'?t read|cancel reading|skip)\b/, 'cancel_read'],
  [/\b(resume current|continue current|resume)\b/, 'resume_current'],
  [/\b(reread|replay|repeat (the )?last sentence|read (it )?again)\b/, 'reread_last'],
  [/\b(from the start|start of (the )?page|beginning of (the )?page|restart page)\b/, 'restart_page'],
  [/\bpause\b|\bwait\b|\bhold on\b/, 'pause'],
  [/\bstop\b|\bquiet\b|\bbe quiet\b/, 'stop'],
  [/\bnext page\b|\bturn (the )?page\b/, 'next_page'],
  [/\bnext (book|chapter)\b/, 'next_book'],
  [/\b(previous|last) (book|chapter)\b/, 'previous_book'],
  [/\b(scan|capture|take (a )?(photo|picture))\b/, 'capture'],
  [/\b(play|read)\b.*\b(book|audiobook|chapter)\b/, 'play_book'],
  [/\b(read|play|start reading)\b/, 'read'],
  [/\b(louder|volume up|increase (the )?volume|turn it up)\b/, 'volume_up'],
  [/\b(quieter|softer|volume down|lower (the )?volume|turn it down)\b/, 'volume_down'],
  [/\b(language|translate)\b/, 'language'],
];

const HELP_TEXT = 'Try: what is in front of me, open camera, scan page, read, pause, library, or go home.';

const ai = {
  supported: !!SR,
  on: false,
  rec: null,
  listening: false,
  oneShot: null,
  speechHold: false,
  networkErrors: 0,

  async requestMicPermission() {
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      const msg = 'Microphone access is blocked by mobile browsers on plain HTTP. Open the HTTPS link to allow your microphone.';
      setCaption(msg);
      earcon('error');
      speak(msg);
      return false;
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err) {
        console.warn('Microphone permission error:', err);
        const msg = 'Microphone permission was not allowed. Please tap the lock icon in your browser address bar and enable microphone.';
        setCaption(msg);
        earcon('error');
        speak(msg);
        return false;
      }
    }
    return true;
  },

  async toggle() {
    if (!this.supported) {
      earcon('error');
      speak('Voice control needs Chrome, Edge, or Safari with speech recognition enabled.');
      return;
    }
    if (!this.on) {
      // Direct user gesture: trigger browser microphone permission prompt immediately
      const granted = await this.requestMicPermission();
      if (!granted) return;
    }
    this.on = !this.on;
    $('aiOrbBtn').setAttribute('aria-pressed', String(this.on));
    $('aiOrbText').textContent = this.on ? 'AI ON' : 'AI';
    $('homeAiState').textContent = this.on ? 'Listening' : 'Off';
    if (this.on) {
      this.networkErrors = 0;
      speak('AI mode on.');           // listening starts automatically when speech ends
    } else {
      this.stopRecognizer();
      speak('AI mode off.');
    }
  },

  async listenOnce(callback) {
    const granted = await this.requestMicPermission();
    if (!granted) return;
    this.oneShot = callback;
    this.startRecognizer();
  },

  wantsMic() {
    return this.on || !!this.oneShot;
  },

  // ---- coordination with speech output ----
  pauseForSpeech() {
    this.speechHold = true;
    this.stopRecognizer();
  },
  resumeAfterSpeech() {
    this.speechHold = false;
    // Deliberate 1200ms buffering cooldown before reopening recognizer
    if (this.wantsMic()) setTimeout(() => this.startRecognizer(), 1200);
  },

  startRecognizer() {
    if (!this.supported || !this.wantsMic() || this.listening || this.speechHold) return;
    if (state.cameraBusy || state.scanBusy) return;

    const rec = new SR();
    rec.lang = LOCALES[lang()] || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      this.listening = true;
      if (!narrator.playing) setAssistant('listening');
      earcon('listen');
      setCaption(this.oneShot ? 'Listening for your question…' : 'Listening…');
    };
    rec.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      const text = res[0].transcript.trim();
      setCaption(`“${text}”`);
      if (res.isFinal) {
        this.networkErrors = 0;
        earcon('heard');
        this.handleTranscript(text);
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.on = false;
        this.oneShot = null;
        $('aiOrbBtn').setAttribute('aria-pressed', 'false');
        $('aiOrbText').textContent = 'AI';
        $('homeAiState').textContent = 'Off';
        earcon('error');
        speak('Microphone permission denied. Enable it in your browser settings.');
      } else if (e.error === 'network') {
        this.networkErrors += 1;
        if (this.networkErrors >= 3) {
          this.on = false;
          this.oneShot = null;
          $('aiOrbText').textContent = 'AI';
          $('homeAiState').textContent = 'Off';
          speak('Voice service unavailable. AI mode off.');
        }
      }
      // 'no-speech' and 'aborted' are normal: just loop again.
    };
    rec.onend = () => {
      this.listening = false;
      this.rec = null;
      if (document.body.dataset.assistant === 'listening') setAssistant('idle');
      if (this.wantsMic() && !this.speechHold) setTimeout(() => this.startRecognizer(), 300);
    };

    this.rec = rec;
    try { rec.start(); } catch { this.listening = false; this.rec = null; }
  },

  stopRecognizer() {
    if (this.rec) {
      try { this.rec.abort(); } catch { /* ignore */ }
    }
  },

  restartRecognizer() {
    this.stopRecognizer(); // onend restarts with the new language
  },

  async handleTranscript(text) {
    const t = text.toLowerCase().replace(/[.,!?]/g, '').trim();
    if (!t) return;

    if (this.oneShot) {
      const cb = this.oneShot;
      this.oneShot = null;
      this.stopRecognizer();
      cb(text);
      return;
    }

    // While speech or narration is active, reject echo so speaker voice never cuts off the AI
    if (synth && synth.speaking) {
      if (/\b(pause|stop|quiet|wait)\b/.test(t)) {
        try { synth.cancel(); } catch {}
        narrator.pause();
        setCaption('Paused');
        speak('Paused.');
      }
      return;
    }

    if (narrator.playing) {
      if (/\b(pause|stop|wait|hold on|quiet)\b/.test(t)) {
        narrator.pause();
        state.scannerPausedMenu = true;
        renderScannerBottomBar();
        setCaption('Paused');
        speak('Paused. Say resume, replay last sentence, or restart page.');
      }
      return;
    }

    const match = LOCAL_COMMANDS.find(([re]) => re.test(t));
    if (match) {
      runVoiceAction({ action: match[1], question: text });
      return;
    }

    // Free-form request: hold the recognizer while loading the answer
    this.pauseForSpeech();
    setAssistant('thinking');
    setCaption('Thinking…');
    earcon('thinking');
    try {
      const data = await fetchJSON('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, screen: state.screen, target_language: lang() }),
      }, 25000);
      runVoiceAction(data);
    } catch (err) {
      setAssistant('idle');
      speak(NETWORK_ERROR_MSG(err));
    }
  },
};

function runVoiceAction({ action, reply, question } = {}) {
  switch (action) {
    case 'home': navigate('home'); break;
    case 'back': goBack(); break;
    case 'scanner': navigate('scanner'); break;
    case 'camera': navigate('camera'); break;
    case 'library': navigate('library'); break;
    case 'games': navigate('games'); break;
    case 'settings': navigate('settings'); break;
    case 'describe': camera.describe(/describe|what('?s| is) in front|what do you see|what can you see/.test((question || '').toLowerCase()) ? '' : question || ''); break;
    case 'read_text': ACTIONS['camera-read-text'](); break;
    case 'capture':
      if (state.screen === 'camera') camera.describe('');
      else { if (state.screen !== 'scanner') navigate('scanner', { announce: false }); runBookCapture(); }
      break;
    case 'next_page':
      if (state.screen !== 'scanner') navigate('scanner', { announce: false });
      ACTIONS['scanner-next']();
      break;
    case 'read_now':
      ACTIONS['scanner-confirm-read']();
      break;
    case 'cancel_read':
      ACTIONS['scanner-cancel-read']();
      break;
    case 'resume_current':
      ACTIONS['scanner-resume-current']();
      break;
    case 'reread_last':
      ACTIONS['scanner-replay-last']();
      break;
    case 'restart_page':
      ACTIONS['scanner-restart-page']();
      break;
    case 'read':
    case 'resume':
      if (state.screen === 'library' || narrator.owner === 'library') libraryPlayToggleResume();
      else if (narrator.hasContent('scanner') || state.lastScanText) {
        if (state.screen !== 'scanner') navigate('scanner', { announce: false });
        if (!narrator.playing) scannerReadToggle();
      } else if (state.screen === 'camera' && state.lastDescription) speak(state.lastDescription);
      else speak('Nothing to read yet.');
      break;
    case 'pause':
      narrator.pause();
      if (state.screen === 'scanner') {
        state.scannerPausedMenu = true;
        renderScannerBottomBar();
        speak(`Paused at sentence ${narrator.index + 1}. Double-tap Resume to continue, double-tap Replay to reread the last sentence, or double-tap Page Start to restart.`);
      } else {
        setCaption('Paused');
      }
      break;
    case 'stop': narrator.stop(); if (synth) synth.cancel(); setAssistant('idle'); setCaption('Stopped'); break;
    case 'play_book':
      if (state.screen !== 'library') navigate('library', { announce: false });
      libraryPlayToggleResume();
      break;
    case 'next_book': if (state.screen !== 'library') navigate('library', { announce: false }); switchBook(1); break;
    case 'previous_book': if (state.screen !== 'library') navigate('library', { announce: false }); switchBook(-1); break;
    case 'volume_up': setVolume(state.volIndex + 1); break;
    case 'volume_down': setVolume(state.volIndex - 1); break;
    case 'language': ACTIONS['setting-language'](); break;
    case 'repeat': speak(state.lastSpoken || 'Nothing to repeat.'); break;
    case 'ai_mode_off': if (ai.on) ai.toggle(); break;
    case 'answer': speak(reply || 'Sorry, I do not know.'); break;
    case 'help':
    default:
      speak(reply && action !== 'help' ? reply : HELP_TEXT);
  }
}

// Voice "read/play" should never restart a paused book — always resume.
function libraryPlayToggleResume() {
  const book = LIBRARY[state.libIndex];
  if (narrator.hasContent('library') && narrator.bookTitle === book.title) {
    if (!narrator.playing) narrator.play();
    return;
  }
  libraryPlayToggle();
}

// ===========================================================================
// Offline Auto-Detection & Network Engine
// ===========================================================================
function updateNetworkStatus() {
  const wasOffline = state.isOffline;
  state.isOffline = !navigator.onLine;
  const badge = $('networkStatusBadge');
  if (badge) {
    badge.textContent = state.isOffline ? 'OFFLINE • CRNN ONLY' : 'ONLINE';
    badge.className = state.isOffline ? 'network-badge offline' : 'network-badge online';
  }
  if (state.isOffline && !wasOffline) {
    earcon('boundary');
    speak('Offline mode active. On-device book scanner is ready.');
  } else if (!state.isOffline && wasOffline) {
    earcon('select');
    speak('Internet reconnected. All AI features active.');
  }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// ===========================================================================
// Boot
// ===========================================================================
window.addEventListener('DOMContentLoaded', () => {
  updateNetworkStatus();
  loadVoices();
  attachTapEngine();
  renderPagePreview();
  renderLibraryBook();
  renderGame();

  $('scannerUpload').addEventListener('change', (e) => {
    handleScannerUpload(e.target.files[0]);
    e.target.value = '';
  });
  $('cameraFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) camera.send(file, camera.pendingQuestion);
    camera.pendingQuestion = '';
  });

  // Release the camera if the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) camera.stop();
    else if (state.screen === 'camera') camera.start();
  });

  // Browsers block speech until the first user gesture; greet on first touch.
  const greet = () => {
    if (state.screen === 'onboarding') {
      setCaption('Tap once to hear • twice to select');
    }
  };
  setTimeout(() => speak('Welcome to Blind-ER. Tap once to hear, twice to select.', { onEnd: greet }), 400);
});

