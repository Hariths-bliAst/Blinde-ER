# Slide 4: Accessible User Workflow (With Video Script)
> **Project:** Blind-ER — Context-Aware Book-to-Audiobook Scanner
> **Owner:** Nijad & Matthew

## Zero-Button, Full-Screen Gesture Experience
- **Voice-First Launch:** Upon opening, Blind-ER announces readiness via Android TalkBack / iOS VoiceOver with a tactile haptic pulse.
- **1 Tap Anywhere on Screen:** Captures the book page via the native document camera and starts the CRNN -> Gemini -> TTS pipeline. No aiming for small buttons.
- **2 Taps Anywhere on Screen:** Immediately pauses or replays the current audiobook passage.
- **Long Press Anywhere on Screen:** Cycles the target translation language (`English` -> `Spanish` -> `French` -> `Malay` -> `Mandarin`) with spoken confirmation.
- **WCAG AAA High-Contrast UI:** Pure black `#000000` background with Safety Yellow `#FFD600` and High-Vis Cyan `#00E5FF` 24pt–28pt typography for partially sighted users.

## Video Narration Script (1:35 – 2:10)
> *"For the user experience, we eliminated visual buttons completely. The entire phone screen acts as a single gesture responder paired with WCAG Triple-A high-contrast visuals. A single tap anywhere scans the page and starts the audiobook. A double tap anywhere pauses or replays the narration. And a long press anywhere switches the translation language with instant voice and haptic feedback."*
