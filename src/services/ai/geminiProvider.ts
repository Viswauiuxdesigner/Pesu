import { AIConversationProvider, AIResponsePayload, ConversationOptions } from './aiProvider';
import { Message, SessionStats, DetectedLanguage } from '../../types/conversation';
import { detectLanguage } from '../../utils/languageDetector';
import { LocalSpeakingTutorProvider } from './localProvider';

const SYSTEM_PROMPT = `You are PESU, an encouraging, patient, and friendly bilingual AI speaking partner for Tamil speakers who understand English but lack confidence speaking it.

Core Guidelines:
1. Understand Spoken & Written Tamil (Tamil script like வணக்கம்), Romanized Tamil/Tanglish (e.g. "enakku English pesa bayama irukku", "interview-la self intro solla theriyala"), Indian English, and code-switched mixtures.
2. NEVER assume every user message is English. Detect the intended meaning and respond appropriately.
3. If the user asks in Tamil or Tanglish how to say something in English, give a natural, simple English sentence first, provide a short Tamil explanation, and encourage them to practice speaking it.
4. If the user attempts English with a grammar mistake (e.g. "I am go to office yesterday"):
   - First, respond naturally to their meaning!
   - Second, gently offer a short correction: "💡 Better way to say it: [Correct sentence]" with a simple explanation in English and Tamil.
5. Do NOT overwhelm with complex grammar jargon. Keep English beginner-friendly and conversational.
6. Always ask a relevant follow-up question to keep the conversation flowing.
7. Support everyday chats, office standups, job interviews, phone calls, and café orders.

Always format your response as valid JSON with the following structure:
{
  "replyText": "The natural English response to the user with a follow-up question",
  "tamilExplanation": "Clear explanation of the meaning or reply in simple Tamil",
  "grammarCorrection": {
    "original": "misspoken phrase (or null if no error)",
    "improved": "natural correct English",
    "explanationInEnglish": "short simple reason in English",
    "explanationInTamil": "short simple reason in Tamil",
    "category": "tense" | "preposition" | "vocabulary" | "general"
  },
  "pronunciationGuide": "Tamil phonetic pronunciation if teaching a new phrase, or null",
  "suggestedResponses": ["Option 1", "Option 2", "Option 3"]
}`;

export class GeminiSpeakingProvider implements AIConversationProvider {
  name = 'Google Gemini 2.0 Flash (Free Tier)';
  private apiKey: string;
  private useServerless: boolean;
  private fallbackProvider = new LocalSpeakingTutorProvider();

  constructor(apiKey: string = '', useServerless: boolean = false) {
    this.apiKey = apiKey;
    this.useServerless = useServerless;
  }

  setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  detectPreferredResponseLanguage(text: string): DetectedLanguage {
    return detectLanguage(text);
  }

  async sendMessage(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): Promise<AIResponsePayload> {
    // If no API key and not using serverless, fallback to local provider immediately
    if (!this.apiKey && !this.useServerless) {
      const fallback = await this.fallbackProvider.sendMessage(userText, history, options);
      return {
        ...fallback,
        replyText: fallback.replyText
      };
    }

    try {
      if (this.useServerless) {
        return await this.callServerlessEndpoint(userText, history, options);
      } else {
        return await this.callGeminiDirect(userText, history, options);
      }
    } catch (err: any) {
      console.warn('Gemini API call failed or quota exceeded. Falling back to local offline engine.', err);
      const fallback = await this.fallbackProvider.sendMessage(userText, history, options);
      return {
        ...fallback,
        replyText: `[Note: Gemini rate limit reached or offline. Switched to offline tutor]\n\n${fallback.replyText}`
      };
    }
  }

  private async callGeminiDirect(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): Promise<AIResponsePayload> {
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const formattedHistory = history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: `User message: "${userText}". Current practice scenario: ${options?.scenarioId || 'General'}. Respond according to the system rules and return JSON only.` }]
      }
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 600
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No candidate content received from Gemini');
    }

    const parsed = JSON.parse(candidateText);
    return {
      replyText: parsed.replyText || 'I am listening! Great attempt.',
      detectedLanguage: detectLanguage(userText),
      tamilExplanation: parsed.tamilExplanation,
      grammarCorrection: parsed.grammarCorrection?.original ? parsed.grammarCorrection : undefined,
      pronunciationGuide: parsed.pronunciationGuide,
      suggestedResponses: parsed.suggestedResponses || []
    };
  }

  private async callServerlessEndpoint(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): Promise<AIResponsePayload> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userText,
        history: history.slice(-6),
        scenarioId: options?.scenarioId
      })
    });

    if (!response.ok) {
      throw new Error(`Serverless endpoint error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async generateSessionSummary(messages: Message[]): Promise<SessionStats> {
    return this.fallbackProvider.generateSessionSummary(messages);
  }
}
