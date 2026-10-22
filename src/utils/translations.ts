import { InterfaceLanguage } from '../types/conversation';
export type { InterfaceLanguage };

export interface TranslationDictionary {
  brandName: string;
  brandTagline: string;
  brandSub: string;

  // Header
  practiceMode: string;
  changeScenario: string;
  summaryBtn: string;
  resetBtn: string;
  settingsBtn: string;
  languageToggle: string;
  localEngineTag: string;
  geminiEngineTag: string;

  // Chat Area
  welcomeBadge: string;
  quickStarters: string;
  listeningNow: string;
  speakingCoach: string;
  you: string;
  listen: string;
  stop: string;
  repeat: string;
  speakingTip: string;
  yourPhrase: string;
  naturalEnglish: string;
  tamilExplanation: string;
  listenInTamil: string;
  tryReplying: string;
  thinking: string;
  retryBtn: string;

  // Composer
  inputPlaceholder: string;
  listeningPlaceholder: string;
  startSpeakingTooltip: string;
  stopSpeakingTooltip: string;
  sendTooltip: string;
  privacyNotice: string;
  keyboardShortcut: string;
  doneSpeaking: string;
  listeningIn: string;

  // Scenarios
  scenariosTitle: string;
  scenariosSubtitle: string;
  activeTag: string;

  // Review Modal
  reviewTitle: string;
  reviewDesc: string;
  reviewPlaceholder: string;
  retrySpeaking: string;
  previewAudio: string;
  cancelBtn: string;
  confirmSendBtn: string;

  // Summary Modal
  summaryTitle: string;
  fluencyBoost: string;
  effortPraise: string;
  effortSub: string;
  messagesSent: string;
  practiceTime: string;
  speakingTips: string;
  keyPhrasesPracticed: string;
  noCorrectionsNeeded: string;
  startNewSession: string;
  continuePractice: string;

  // Settings Modal
  settingsTitle: string;
  aiEngineTitle: string;
  offlineTutorTitle: string;
  offlineTutorBadge: string;
  offlineTutorDesc: string;
  geminiTitle: string;
  geminiBadge: string;
  geminiDesc: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  hide: string;
  show: string;
  apiKeyNotice: string;
  getKeyLink: string;
  voiceSettingsTitle: string;
  speakingRate: string;
  rateSlowHint: string;
  rateNormalHint: string;
  rateFastHint: string;
  autoSpeakTitle: string;
  autoSpeakDesc: string;
  systemVoiceTitle: string;
  defaultVoice: string;
  interfaceLangTitle: string;
  interfaceLangDesc: string;
  alwaysTamilTitle: string;
  alwaysTamilDesc: string;
  privacyDataTitle: string;
  privacyDataDesc: string;
  clearHistoryBtn: string;
  historyClearedMsg: string;
  saveChangesBtn: string;

  // Reset confirmation
  confirmResetTitle: string;
  confirmResetDesc: string;
  confirmResetAction: string;
}

export const TRANSLATIONS: Record<InterfaceLanguage, TranslationDictionary> = {
  en: {
    brandName: 'PESU',
    brandTagline: 'English Speaking Partner',
    brandSub: 'Practice speaking English with confidence',

    practiceMode: 'Practice Scenario',
    changeScenario: 'Change Scenario',
    summaryBtn: 'Summary',
    resetBtn: 'Reset',
    settingsBtn: 'Settings',
    languageToggle: 'தமிழ் UI',
    localEngineTag: 'PESU Offline Tutor',
    geminiEngineTag: 'Gemini Cloud AI',

    welcomeBadge: 'Active Scenario',
    quickStarters: 'Quick Starters — tap to practice:',
    listeningNow: 'Listening to your voice...',
    speakingCoach: 'Speaking Coach',
    you: 'You',
    listen: 'Listen',
    stop: 'Stop',
    repeat: 'Repeat',
    speakingTip: '💡 Speaking Tip',
    yourPhrase: 'Your phrase:',
    naturalEnglish: 'Natural English:',
    tamilExplanation: 'Tamil Explanation',
    listenInTamil: 'Listen in Tamil',
    tryReplying: 'Try replying:',
    thinking: 'PESU is thinking...',
    retryBtn: 'Retry',

    inputPlaceholder: "Type in English, Tamil script, or Tanglish (e.g., 'shall we talk' or 'work romba irundhuchu')...",
    listeningPlaceholder: 'Listening to your speech... speak naturally in Tamil or English.',
    startSpeakingTooltip: 'Speak via microphone (Tamil or English)',
    stopSpeakingTooltip: 'Stop recording',
    sendTooltip: 'Send message (Enter)',
    privacyNotice: '🔒 Audio stays on your device. Zero cost.',
    keyboardShortcut: 'Enter ↵ to send',
    doneSpeaking: 'Done Speaking',
    listeningIn: 'Listening in',

    scenariosTitle: 'Choose Practice Scenario',
    scenariosSubtitle: 'Select a real-world situation to practice speaking with confidence',
    activeTag: 'Active',

    reviewTitle: 'Review & Edit Speech Transcript',
    reviewDesc: 'Check what was heard before sending. You can edit any misheard words or retry:',
    reviewPlaceholder: 'Edit your spoken transcript here...',
    retrySpeaking: 'Retry Speaking',
    previewAudio: 'Preview',
    cancelBtn: 'Cancel',
    confirmSendBtn: 'Confirm & Send',

    summaryTitle: 'Practice Session Summary',
    fluencyBoost: 'Fluency Boost',
    effortPraise: 'Great practice session!',
    effortSub: 'Regular conversation builds natural confidence and reduces hesitation.',
    messagesSent: 'Messages',
    practiceTime: 'Practice Time',
    speakingTips: 'Speaking Tips',
    keyPhrasesPracticed: 'Key Phrases Practiced:',
    noCorrectionsNeeded: 'Excellent job! You spoke naturally with no major errors.',
    startNewSession: 'Start New Session',
    continuePractice: 'Continue Practice',

    settingsTitle: 'Settings & Preferences',
    aiEngineTitle: 'AI Conversation Engine',
    offlineTutorTitle: 'PESU Offline Tutor (Zero Cost)',
    offlineTutorBadge: '100% Free / No Key',
    offlineTutorDesc: 'Rule-based pedagogical tutor with Tanglish detection, Tamil explanations, and scenario dialogues. Fast, private, and works offline.',
    geminiTitle: 'Google Gemini 2.0 Flash',
    geminiBadge: 'Generative AI',
    geminiDesc: 'Uses real generative AI for free-form dialogue via the secure serverless backend or your free AI Studio key.',
    apiKeyLabel: 'Gemini API Key (Optional client key)',
    apiKeyPlaceholder: 'AIzaSy... (leave blank to use serverless endpoint)',
    hide: 'Hide',
    show: 'Show',
    apiKeyNotice: 'Stored locally in your browser. Server-side key in Vercel is preferred.',
    getKeyLink: 'Get a free Gemini API key from Google AI Studio',
    voiceSettingsTitle: 'Voice & Speech Settings',
    speakingRate: 'Speaking Rate:',
    rateSlowHint: 'Slower (Great for learners)',
    rateNormalHint: 'Natural pace',
    rateFastHint: 'Faster pace',
    autoSpeakTitle: 'Auto-speak AI responses',
    autoSpeakDesc: 'Automatically read aloud the English response when received',
    systemVoiceTitle: 'Preferred Voice:',
    defaultVoice: 'Recommended System Voice',
    interfaceLangTitle: 'Interface Language (UI)',
    interfaceLangDesc: 'Switch the entire app interface between English and தமிழ்',
    alwaysTamilTitle: 'Always expand Tamil explanations',
    alwaysTamilDesc: 'Automatically show the Tamil explanation on every message',
    privacyDataTitle: 'Privacy & Local History',
    privacyDataDesc: 'Your conversation history is stored strictly on your device.',
    clearHistoryBtn: 'Clear Chat History',
    historyClearedMsg: '✓ Chat history cleared successfully.',
    saveChangesBtn: 'Save Changes',

    confirmResetTitle: 'Reset Conversation?',
    confirmResetDesc: 'This will restart your conversation in the current scenario.',
    confirmResetAction: 'Reset'
  },
  ta: {
    brandName: 'பேசு (PESU)',
    brandTagline: 'ஆங்கில உரையாடல் பயிற்சி',
    brandSub: 'தயக்கமின்றி ஆங்கிலம் பேசப் பழகுங்கள்',

    practiceMode: 'பயிற்சி களம்',
    changeScenario: 'களத்தை மாற்று',
    summaryBtn: 'சுருக்கம்',
    resetBtn: 'மீட்டமை',
    settingsBtn: 'அமைப்புகள்',
    languageToggle: 'English UI',
    localEngineTag: 'PESU ஆஃப்லைன் டியூட்டர்',
    geminiEngineTag: 'Gemini AI',

    welcomeBadge: 'தற்போதைய களம்',
    quickStarters: 'தொடக்க வாக்கியங்கள் — தொட்டுப் பழகுங்கள்:',
    listeningNow: 'உங்கள் குரலைக் கேட்கிறது...',
    speakingCoach: 'உரையாடல் வழிகாட்டி',
    you: 'நீங்கள்',
    listen: 'கேளுங்கள்',
    stop: 'நிறுத்து',
    repeat: 'மீண்டும்',
    speakingTip: '💡 வாக்கிய திருத்தம்',
    yourPhrase: 'உங்கள் வாக்கியம்:',
    naturalEnglish: 'இயல்பான ஆங்கிலம்:',
    tamilExplanation: 'தமிழ் விளக்கம்',
    listenInTamil: 'தமிழில் கேட்க',
    tryReplying: 'பதிலளிக்க முயலுங்கள்:',
    thinking: 'PESU சிந்திக்கிறது...',
    retryBtn: 'மீண்டும் முயற்சி செய்',

    inputPlaceholder: 'ஆங்கிலம், தமிழ் எழுத்துக்கள் அல்லது Tanglish-ல் தட்டச்சு செய்யுங்கள்...',
    listeningPlaceholder: 'பேசுங்கள்... உங்கள் பேச்சைக் கேட்கிறது.',
    startSpeakingTooltip: 'மைக் மூலம் பேச தொடங்குங்கள் (தமிழ் அல்லது ஆங்கிலம்)',
    stopSpeakingTooltip: 'பதிவை நிறுத்துங்கள்',
    sendTooltip: 'அனுப்பு (Enter)',
    privacyNotice: '🔒 உங்கள் குரல் உங்கள் சாதனத்திலேயே பாதுகாப்பாக செயலாக்கப்படுகிறது.',
    keyboardShortcut: 'அனுப்ப Enter ↵ அழுத்தவும்',
    doneSpeaking: 'பேசி முடித்தேன்',
    listeningIn: 'கேட்கும் மொழி',

    scenariosTitle: 'பயிற்சி களம் தேர்வு செய்க',
    scenariosSubtitle: 'நம்பிக்கையுடன் ஆங்கிலம் பேச ஒரு களத்தைத் தேர்ந்தெடுக்கவும்',
    activeTag: 'தேர்வு செய்யப்பட்டுள்ளது',

    reviewTitle: 'பேச்சு உரையை சரிபார்க்கவும்',
    reviewDesc: 'அனுப்பும் முன் வாக்கியத்தைச் சரிபார்க்கவும். பிழைகள் இருந்தால் திருத்தலாம்:',
    reviewPlaceholder: 'உங்கள் பேச்சு உரையை இங்கே திருத்தலாம்...',
    retrySpeaking: 'மீண்டும் பேசு',
    previewAudio: 'முன்னோட்டம்',
    cancelBtn: 'ரத்து செய்',
    confirmSendBtn: 'சரிபார்த்து அனுப்பு',

    summaryTitle: 'பயிற்சி அமர்வின் சுருக்கம்',
    fluencyBoost: 'தன்னம்பிக்கை உயர்வு',
    effortPraise: 'சிறப்பான பயிற்சி முயற்சி!',
    effortSub: 'தொடர்ந்து பேசுவது உங்கள் தயக்கத்தைப் போக்கி ஆங்கிலத்தை இயல்பாக்கும்.',
    messagesSent: 'அனுப்பிய செய்திகள்',
    practiceTime: 'பயிற்சி நேரம்',
    speakingTips: 'ஆலோசனைகள்',
    keyPhrasesPracticed: 'பயிற்சி செய்த முக்கிய வாக்கியங்கள்:',
    noCorrectionsNeeded: 'அருமை! நீங்கள் எந்தப் பெரிய பிழையுமின்றி இயல்பாக பேசினீர்கள்.',
    startNewSession: 'புதிய அமர்வு தொடங்கு',
    continuePractice: 'பயிற்சியைத் தொடர்',

    settingsTitle: 'அமைப்புகள் & விருப்பங்கள்',
    aiEngineTitle: 'AI உரையாடல் பொறி',
    offlineTutorTitle: 'PESU ஆஃப்லைன் டியூட்டர் (இலவசம்)',
    offlineTutorBadge: '100% இலவசம் / கீ தேவையில்லை',
    offlineTutorDesc: 'Tanglish புரிதல், தமிழ் விளக்கங்கள் மற்றும் சூழ்நிலை உரையாடல்களைக் கொண்ட விதிமுறை டியூட்டர். இணையமின்றியும் வேகமாகவும் செயல்படும்.',
    geminiTitle: 'Google Gemini 2.0 Flash',
    geminiBadge: 'ஜெனரேட்டிவ் AI',
    geminiDesc: 'சர்வர்லெஸ் ப்ராக்ஸி அல்லது இலவச AI Studio கீ மூலம் சுதந்திர உரையாடலுக்கு கூகிளின் ஜெனரேட்டிவ் AI-ஐப் பயன்படுத்துகிறது.',
    apiKeyLabel: 'Gemini API Key (விருப்பத்தேர்வு)',
    apiKeyPlaceholder: 'AIzaSy... (வெற்று இடத்தில் விட்டால் சர்வர் ப்ராக்ஸி செயல்படும்)',
    hide: 'மறைக்க',
    show: 'காட்ட',
    apiKeyNotice: 'உங்கள் பிரவுசரில் மட்டுமே சேமிக்கப்படும்.',
    getKeyLink: 'Google AI Studio-விலிருந்து இலவச கீ பெறுக',
    voiceSettingsTitle: 'குரல் மற்றும் பேச்சு அமைப்புகள்',
    speakingRate: 'பேசும் வேகம்:',
    rateSlowHint: 'மெதுவாக (பழகுபவர்களுக்கு சிறந்தது)',
    rateNormalHint: 'இயல்பான வேகம்',
    rateFastHint: 'வேகமான வேகம்',
    autoSpeakTitle: 'பதிலை தானாக வாசிக்க',
    autoSpeakDesc: 'பதில் வந்தவுடன் ஆங்கில உரையை தானாகவே வாசித்துக் காட்டும்',
    systemVoiceTitle: 'விரும்பும் குரல்:',
    defaultVoice: 'பரிந்துரைக்கப்பட்ட அமைப்பு குரல்',
    interfaceLangTitle: 'பயனர் இடைமுக மொழி (UI)',
    interfaceLangDesc: 'முழு செயலியின் திரையையும் English அல்லது தமிழாக மாற்றவும்',
    alwaysTamilTitle: 'எப்போதும் தமிழ் விளக்கம் காட்ட',
    alwaysTamilDesc: 'ஒவ்வொரு பதிலுக்கும் தமிழ் விளக்கத்தை தானாகவே விரித்து வைக்கும்',
    privacyDataTitle: 'தரவு பாதுகாப்பு மற்றும் வரலாறு',
    privacyDataDesc: 'உங்கள் உரையாடல்கள் உங்கள் சாதனத்தில் மட்டுமே இருக்கும்.',
    clearHistoryBtn: 'உரையாடல் வரலாற்றை அழிக்க',
    historyClearedMsg: '✓ உரையாடல் வரலாறு அழிக்கப்பட்டது.',
    saveChangesBtn: 'சேமிக்க',

    confirmResetTitle: 'உரையாடலை மீட்டமைக்கவா?',
    confirmResetDesc: 'தற்போதைய களத்தில் புதிதாக உரையாடல் தொடங்கும்.',
    confirmResetAction: 'மீட்டமை'
  }
};
