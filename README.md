# PESU (பேசு) — Bilingual Tamil + English AI Speaking Partner

> **"பேசு" (Pesu)** means **"Speak!"** in Tamil.
> PESU is a production-minded bilingual AI conversation experience engineered specifically for Tamil speakers who understand English but lack confidence speaking it ("enakku English pesa bayama irukku").

---

## 🌟 Key Capabilities & Features

### 1. Robust Multilingual Understanding
- **Spoken Tamil**: Uses `ta-IN` Web Speech Recognition with native language fallback.
- **Spoken English**: Uses `en-IN` (Indian English) and `en-US` recognition.
- **Tanglish & Romanized Tamil**: Understands phrases like *"Enakku interview-la self introduction English-la solla theriyala"*, *"office-la casual-ah epdi pesurathu"*, and *"enakku English pesa bayama irukku"*.
- **Pure Tamil Script**: Detects Tamil Unicode text (e.g., *"வணக்கம்"*, *"எனக்கு தயக்கமா இருக்கு"*).
- **Code-switching & Mixed Speech**: Understands messages that freely mix Tamil and English words without assuming every message is English.

### 2. Pedagogical Conversational Behaviors
- **Meaning First, Gentle Correction Second**: When a user makes a slip-up like *"I am go to office yesterday"*, PESU responds naturally to the intended meaning first, then provides a non-judgmental **💡 Speaking Tip** card with the improved version (*"I went to the office yesterday"*) and a simple explanation in both English and Tamil.
- **English Learning via Tamil Explanations**: When asked in Tamil/Tanglish how to say something, PESU provides natural English sentences, a phonetic pronunciation guide, and simple Tamil breakdowns.
- **Contextual Tamil Explanation Toggle ("தமிழ் விளக்கம்")**: Users can toggle or click to view Tamil explanations of any response, or ask *"Can you explain this in Tamil?"* to get an explanation of the previous reply without losing context.
- **Editable Speech Transcript Before Sending**: Speech-to-text transcript is placed in a review modal where users can edit misheard words, retry speaking, or confirm and send. Transcripts are never silently discarded.
- **Practice Session Summary (பயிற்சி சுருக்கம்)**: At any point, clicking **Summary** generates a progress report with a fluency boost score (%), phrases learned, and grammar tips practiced.

### 3. Voice Input & Voice Output Controls
- **Web Speech API**: Zero-cost, in-browser speech recognition with live waveform animation, listening states, and permission denial handling.
- **Speech Synthesis (TTS)**: Dynamic voice detection via `speechSynthesis.onvoiceschanged`. Automatically pairs Tamil responses with Tamil voices (when installed on the OS) and English responses with Indian English voices.
- **Voice Playback Controls**: **Listen**, **Stop**, **Repeat**, and speech speed control (0.8x to 1.2x).

### 4. 6 Dedicated Practice Scenarios (களங்கள்)
1. **Free Speaking Practice** (சுதந்திர உரையாடல்)
2. **Job Interview & Self Intro** (வேலை நேர்காணல் & சுய அறிமுகம்)
3. **Office & Team Discussions** (அலுவலக உரையாடல் & மீட்டிங்)
4. **Everyday Casual Conversation** (அன்றாட பேச்சு & நண்பர்கள்)
5. **Phone Calls & Enquiries** (தொலைபேசி அழைப்பு & விசாரிப்புகள்)
6. **Restaurant & Café Ordering** (ஹோட்டல் ஆர்டர்)

---

## 🛡️ Zero-Cost & Privacy Architecture

| Feature | Without API Key (Zero-Cost Default) | With Optional Gemini API Key |
|---|---|---|
| **Chat & Speaking Practice** | ✅ Works 100% offline via PESU Pedagogical Engine | ✅ Optional cloud-based open dialogue |
| **Tanglish & Tamil Understanding** | ✅ Fully supported | ✅ Fully supported |
| **Grammar Correction & Tips** | ✅ Built-in rule engine for common Tamil-speaker slips | ✅ Model-assisted feedback |
| **Speech-to-Text (Voice Input)** | ✅ Browser Web Speech API (`ta-IN`, `en-IN`) | ✅ Browser Web Speech API |
| **Text-to-Speech (Voice Output)** | ✅ Browser `speechSynthesis` | ✅ Browser `speechSynthesis` |
| **Practice Scenarios & Starters** | ✅ All 6 scenarios available | ✅ All 6 scenarios available |
| **Session Summaries** | ✅ Generates fluency score & phrase lists | ✅ Generates fluency score & phrase lists |
| **Cost** | **$0.00 (Zero cost)** | Free-tier quota |

### Privacy Guarantees
- **Audio Processing**: Raw audio is never sent to or stored on external servers; recognition is handled in the browser session.
- **Local Storage**: Conversation history and user preferences stay strictly inside the user's browser `localStorage`.
- **API Key Security**: If a custom Gemini key is added, it is stored only on the client device or passed through a secure serverless backend.

---

## 📁 Project Structure

```
Pesu/
├── api/
│   └── chat.ts                          # Serverless backend function (Vercel/Netlify)
├── public/
│   ├── favicon.svg                      # Custom PESU SVG branding
│   ├── manifest.webmanifest             # PWA installation manifest
│   └── sw.js                            # Offline Service Worker cache
├── src/
│   ├── components/
│   │   ├── AudioWaveform.tsx            # Animated live audio waveform
│   │   ├── ChatContainer.tsx            # Message stream & scenario starters
│   │   ├── Header.tsx                   # Brand, scenario pill, reset, summary, settings
│   │   ├── MessageBubble.tsx            # AI/User bubbles with corrections & Tamil explanations
│   │   ├── PracticeSummaryModal.tsx     # Session recap, fluency score & phrase list
│   │   ├── ScenarioSelector.tsx         # 6 roleplay scenario cards
│   │   ├── SettingsModal.tsx            # Provider switch, voice rate, API key input
│   │   ├── TranscriptReviewModal.tsx    # Live speech review & edit before sending
│   │   └── VoiceInputBar.tsx            # Multiline input, mic button, language switch
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiProvider.ts            # AI provider interface & response types
│   │   │   ├── geminiProvider.ts        # Google Gemini 2.0 Flash integration
│   │   │   ├── grammarRules.ts          # Grammar patterns for Tamil-speaker English
│   │   │   ├── localProvider.ts         # Zero-cost offline pedagogical tutor engine
│   │   │   └── scenarios.ts             # Roleplays, Tamil titles, starter prompts
│   │   ├── speech/
│   │   │   ├── speechRecognition.ts     # Web Speech API wrapper (ta-IN, en-IN, auto)
│   │   │   └── speechSynthesis.ts       # Speech synthesis with dynamic voice picker
│   │   └── storage/
│   │       └── storageService.ts        # Persistent localStorage state
│   ├── types/
│   │   ├── conversation.ts              # Data contracts for messages, scenarios, settings
│   │   └── speech.ts                    # Web speech typing augments
│   ├── utils/
│   │   └── languageDetector.ts          # Tamil script, Tanglish keywords & intent detection
│   ├── test-scenarios.ts                # Verification script for core scenarios
│   ├── App.tsx                          # Root application component
│   ├── index.css                        # Design system: glassmorphism, responsive styles
│   └── main.tsx                         # Entry point & PWA registration
├── index.html                           # HTML template with SEO tags
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
Node.js (v18+) and npm.

### Quick Run
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Building for Production
```bash
npm run build
```

---

## 🔑 Environment Variables (Optional)

If deploying to a hosting platform like Vercel or Netlify and using the server-side API proxy:

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (from Google AI Studio) | None (PESU operates 100% free offline without it) |

No API keys are required for the application to function.
