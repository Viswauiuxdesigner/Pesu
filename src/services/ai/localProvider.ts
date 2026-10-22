import { AIConversationProvider, AIResponsePayload, ConversationOptions } from './aiProvider';
import { Message, SessionStats, DetectedLanguage } from '../../types/conversation';
import { detectLanguage } from '../../utils/languageDetector';
import { ConversationPipeline } from './conversationPipeline';

export class LocalSpeakingTutorProvider implements AIConversationProvider {
  name = 'PESU Offline Pedagogical Engine (Zero-Cost)';
  private pipeline = new ConversationPipeline();

  detectPreferredResponseLanguage(text: string): DetectedLanguage {
    return detectLanguage(text);
  }

  async sendMessage(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): Promise<AIResponsePayload> {
    // Natural conversational delay for offline processing
    await new Promise(res => setTimeout(res, 180));

    // Process message through full intent & context pipeline
    return this.pipeline.processMessage(userText, history, options);
  }

  async generateSessionSummary(messages: Message[]): Promise<SessionStats> {
    const userMessages = messages.filter(m => m.role === 'user');
    const corrections: Message['grammarCorrection'][] = [];
    const phrasesLearned: string[] = [];

    for (const m of messages) {
      if (m.grammarCorrection) {
        corrections.push(m.grammarCorrection);
        phrasesLearned.push(m.grammarCorrection.improved);
      }
    }

    if (phrasesLearned.length === 0) {
      phrasesLearned.push('I went to the office yesterday.');
      phrasesLearned.push('I had a lot of work at the office today.');
      phrasesLearned.push('Hello, my name is... and I am from...');
    }

    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - (messages[0]?.timestamp || Date.now())) / 60000)
    );

    const baseScore = 75;
    const bonus = Math.min(23, userMessages.length * 4);
    const confidenceScore = Math.min(98, baseScore + bonus);

    return {
      messagesCount: messages.length,
      spokenCount: userMessages.length,
      correctionsCount: corrections.length,
      phrasesLearned: Array.from(new Set(phrasesLearned)),
      corrections: corrections.filter(Boolean) as any,
      sessionStartTime: messages[0]?.timestamp || Date.now(),
      durationMinutes,
      confidenceScore
    };
  }
}
