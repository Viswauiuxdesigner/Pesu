import { Message, SessionStats, DetectedLanguage } from '../../types/conversation';

export interface AIResponsePayload {
  replyText: string;
  detectedLanguage: DetectedLanguage;
  tamilExplanation?: string;
  grammarCorrection?: {
    original: string;
    improved: string;
    explanationInEnglish: string;
    explanationInTamil: string;
    category?: 'tense' | 'preposition' | 'vocabulary' | 'pronunciation' | 'general';
  };
  pronunciationGuide?: string;
  suggestedResponses?: string[];
}

export interface ConversationOptions {
  scenarioId?: string;
  alwaysShowTamilExplanation?: boolean;
  history?: Message[];
}

export interface AIConversationProvider {
  name: string;
  sendMessage(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): Promise<AIResponsePayload>;
  resetConversation?(): void;
  detectPreferredResponseLanguage(text: string): DetectedLanguage;
  generateSessionSummary(messages: Message[]): Promise<SessionStats>;
}
