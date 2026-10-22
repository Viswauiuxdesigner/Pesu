export type MessageRole = 'user' | 'assistant' | 'system';

export type DetectedLanguage = 'tamil' | 'tanglish' | 'english' | 'mixed';

export type RecognitionLanguage = 'auto' | 'ta-IN' | 'en-IN';

export type InterfaceLanguage = 'en' | 'ta';

export interface GrammarCorrection {
  original: string;
  improved: string;
  explanationInEnglish: string;
  explanationInTamil: string;
  category?: 'tense' | 'preposition' | 'vocabulary' | 'pronunciation' | 'general';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  detectedLanguage?: DetectedLanguage;
  tamilExplanation?: string;
  grammarCorrection?: GrammarCorrection;
  pronunciationGuide?: string;
  suggestedResponses?: string[];
  audioPlaying?: boolean;
}

export type ScenarioId = 
  | 'free_talk' 
  | 'interview' 
  | 'office_meeting' 
  | 'everyday_chat' 
  | 'phone_call' 
  | 'restaurant';

export interface PracticeScenario {
  id: ScenarioId;
  title: string;
  tamilTitle: string;
  description: string;
  tamilDescription: string;
  icon: string;
  initialMessage: string;
  initialTamilExplanation: string;
  starterPrompts: {
    english?: string;
    tamil?: string;
    tanglish: string;
    label: string;
  }[];
}

export interface SessionStats {
  messagesCount: number;
  spokenCount: number;
  correctionsCount: number;
  phrasesLearned: string[];
  corrections: GrammarCorrection[];
  sessionStartTime: number;
  durationMinutes: number;
  confidenceScore: number;
}

export type AIProviderType = 'local' | 'gemini' | 'custom_api';

export interface AppSettings {
  aiProvider: AIProviderType;
  geminiApiKey: string;
  useServerlessBackend: boolean;
  recognitionLanguage: RecognitionLanguage;
  speechRate: number; // 0.8 to 1.2
  autoSpeakResponses: boolean;
  alwaysShowTamilExplanation: boolean;
  interfaceLanguage: 'en' | 'ta';
  theme: 'light' | 'dark';
  preferredVoiceURI?: string;
}
