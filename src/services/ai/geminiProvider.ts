import { AIConversationProvider, AIResponsePayload, ConversationOptions } from './aiProvider';
import { Message, SessionStats, DetectedLanguage } from '../../types/conversation';
import { detectLanguage } from '../../utils/languageDetector';
import { LocalSpeakingTutorProvider } from './localProvider';

const SYSTEM_PROMPT = `You are PESU (பேசு), a warm, supportive, and natural English-speaking practice partner designed for Tamil speakers.
Your primary identity is a friendly conversation partner, NOT a rigid test examiner or repetitive chatbot.

CRITICAL CONVERSATIONAL PRINCIPLES:
1. UNDERSTAND INTENT FIRST & ANSWER THE ACTUAL MESSAGE:
   - When the user asks a question, answer that question directly and helpfully.
   - When the user shares feelings, daily experiences, or thoughts, empathize and respond naturally.
   - NEVER dodge the user's message with a generic template like "Tell me about your experience" or force an unrelated speaking exercise.

2. LANGUAGE FLEXIBILITY & WELCOMING TAMIL/TANGLISH:
   - Users may speak or type in English, Tamil script (தமிழ்), Romanized Tamil (Tanglish like "innaiku office-la romba work"), or mixed English+Tamil.
   - If the user asks whether they can speak Tamil or Tanglish (e.g. "Shall I talk in Tamil?", "Can I speak Tamil?", "Can talk Tamil", "Naan Tamil la pesalama?", "Can you understand Tanglish?"):
     * ALWAYS warmly welcome them! Tell them: "Yes, of course! You can speak in Tamil, Tanglish, or English — whichever feels comfortable for you. What would you like to talk about?" (Or in Tanglish if they asked in Tanglish).
     * NEVER treat a language permission question as an English grammar exercise!
   - Support code-switching naturally.

3. CONVERSATION CONTEXT & PRONOUN RESOLUTION:
   - Always track active topics and references across turns.
   - If the user previously mentioned "I had a fight with my friend" and then says "He misunderstood me", recognize that "he" refers to the friend.
   - If they ask "What should I do now?", provide advice specifically relevant to the ongoing context (e.g. resolving the misunderstanding with the friend).

4. CONFUSION & CLARIFICATION:
   - If the user says "I don't understand", "purila", "enna da solra", or "explain that in Tamil", refer back to your previous response and explain it simply in clear Tamil or simple English.

5. GENTLE, NON-INTRUSIVE GRAMMAR CORRECTIONS:
   - If the user attempts English with grammatical errors (e.g. "I am go to office yesterday"):
     1. FIRST respond naturally to their meaning and answer them!
     2. Include a gentle correction in the grammarCorrection field:
        original: "I am go to office yesterday"
        improved: "I went to the office yesterday"
        explanationInEnglish: "Use 'went' because you are talking about the past."
        explanationInTamil: "கடந்த காலம் பற்றி பேசும்போது 'am go' என்று சொல்லாமல் 'went' என கூற வேண்டும்."
   - Do NOT interrupt the conversation flow with lengthy grammar lectures.
   - Do NOT correct grammar if the user is typing in Tamil or Tanglish.

6. ALWAYS RETURN STRICT VALID JSON:
{
  "replyText": "Natural English/Tanglish conversational reply answering the user directly, followed by a warm follow-up question",
  "tamilExplanation": "Clear, friendly explanation of the reply in Tamil so beginner speakers understand fully",
  "grammarCorrection": {
    "original": "misspoken English phrase or null",
    "improved": "natural correct English",
    "explanationInEnglish": "short simple reason in English",
    "explanationInTamil": "short simple reason in Tamil",
    "category": "tense" | "preposition" | "vocabulary" | "general"
  } | null,
  "pronunciationGuide": "Tamil phonetic pronunciation for any key new phrase (or null)",
  "suggestedResponses": ["3 natural, relevant response choices matching the conversation context"]
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
    try {
      if (this.apiKey) {
        // Direct client API key if explicitly provided in Settings
        return await this.callGeminiDirect(userText, history, options);
      } else {
        // Deployed mode: Automatically use secure serverless /api/chat proxy
        return await this.callServerlessEndpoint(userText, history, options);
      }
    } catch (err: any) {
      console.warn('Gemini request failed (proxy unavailable, key not configured, or quota exceeded). Falling back to PESU offline engine.', err);
      const fallback = await this.fallbackProvider.sendMessage(userText, history, options);
      return {
        ...fallback,
        replyText: fallback.replyText
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

    // Filter out trailing duplicate user message if already present in history
    const priorHistory = history.filter((m, idx) => !(idx === history.length - 1 && m.role === 'user' && m.content === userText));

    const formattedHistory = priorHistory.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: `User message: "${userText}". Detected input language: ${detectLanguage(userText)}. Interface language: ${options?.interfaceLanguage || 'en'}. Current practice scenario: ${options?.scenarioId || 'General'}. Respond according to the system rules and return JSON only.` }]
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
    // Filter out trailing duplicate user message if already present in history
    const priorHistory = history.filter((m, idx) => !(idx === history.length - 1 && m.role === 'user' && m.content === userText));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userText,
        history: priorHistory.slice(-6),
        scenarioId: options?.scenarioId,
        interfaceLanguage: options?.interfaceLanguage || 'en',
        detectedLanguage: options?.detectedLanguage || detectLanguage(userText)
      })
    });

    if (!response.ok) {
      throw new Error(`Serverless endpoint error: ${response.status}`);
    }

    const data = await response.json();
    return {
      replyText: data.replyText || 'I am listening! Great attempt.',
      detectedLanguage: data.detectedLanguage || detectLanguage(userText),
      tamilExplanation: data.tamilExplanation,
      grammarCorrection: data.grammarCorrection?.original ? data.grammarCorrection : undefined,
      pronunciationGuide: data.pronunciationGuide,
      suggestedResponses: data.suggestedResponses || []
    };
  }

  async generateSessionSummary(messages: Message[]): Promise<SessionStats> {
    return this.fallbackProvider.generateSessionSummary(messages);
  }
}
