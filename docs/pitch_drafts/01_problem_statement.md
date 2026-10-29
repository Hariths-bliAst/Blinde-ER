# Slide Section 1: Problem Statement & Market Gap Analysis
> **Project:** Blind-ER — Context-Aware Book-to-Audiobook Scanner
> **Owner:** Nijad (Pitch Deck & Feature Brainstorming Lead) — *Completed Deliverable*

---

## 1. The Global Accessibility Crisis (Key Statistics for Slides)
- **2.2 Billion People Globally** have near or distance vision impairment (World Health Organization), including **43 million people with total blindness** and **295 million with moderate-to-severe low vision**.
- **The "Book Famine" (<10% Accessible):** According to the World Blind Union (WBU), **less than 10% of all published physical books worldwide** (and less than 1% in developing nations) are ever converted into accessible formats such as Braille or human-narrated audiobooks.
- **Multilingual Barrier:** Even when a physical book exists, visually impaired readers who need it translated into their native language (e.g., Malay, Mandarin, Spanish, French) have almost zero accessible options.

---

## 2. Why Existing OCR-to-Speech Tools Fail Blind Readers

| Failure Mode in Standard OCR Apps | Real-World Impact on Visually Impaired Users | How **Blind-ER** Solves It |
| :--- | :--- | :--- |
| **1. Literal Reading of OCR Flaws** | Standard OCR reads hyphenated line-breaks (`"Northum- berland"`), stray page numbers (`"p. 42"`), and running headers aloud in the middle of sentences. | **Stage 2 Gemini 3 Flash Engine** repairs broken words and strips page headers before TTS playback. |
| **2. Robotic, Context-Blind Translation** | Word-for-word machine translation destroys idioms, character emotion, and literary genre style (reading a suspense thriller like a spreadsheet). | **Literary Narrator System Prompt** preserves emotional tone, pacing, and genre nuance across 5 languages. |
| **3. Sighted-Centric UIs (Tiny Buttons)** | Traditional scanning apps require aiming at a 40px shutter button, cropping bounding boxes, and tapping small language dropdowns. | **Zero-Button Full-Screen Gesture Responder** (`1 Tap` = Scan, `2 Taps` = Pause/Play, `Long Press` = Language). |

---

## 3. Timed Video Narration Script (0:00 – 0:50)
> **[0:00 – 0:20 | Slide 1 — Title]**
> *"Imagine holding a physical novel or textbook, wanting to immerse yourself in its story—but you are visually impaired. Globally, over 2.2 billion people live with vision impairment, yet more than 90% of printed books are never made accessible. Welcome to Blind-ER: an AI-powered, voice-first mobile platform that turns any physical book into an expressive, multilingual audiobook in seconds."*
>
> **[0:20 – 0:50 | Slide 2 — The Problem]**
> *"Why aren't existing OCR apps enough? Because standard OCR-to-speech tools read scanned pages literally and robotically. They read broken hyphenations, stray page numbers, and footnotes right in the middle of a sentence. When translating, they translate word-for-word—stripping away emotional nuance and literary flow. Worse still, they rely on tiny on-screen buttons that require sight just to press."*
