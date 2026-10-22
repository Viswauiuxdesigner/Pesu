import { AIConversationProvider, AIResponsePayload, ConversationOptions } from './aiProvider';
import { Message, SessionStats, DetectedLanguage } from '../../types/conversation';
import { detectLanguage } from '../../utils/languageDetector';
import { LocalSpeakingTutorProvider } from './localProvider';

const SYSTEM_PROMPT = `You are PESU (பேசு), a friendly, warm, and patient Tamil-English speaking partner.
Your primary role is a real, conversational speaking partner — NOT a repetitive scripted chatbot or rigid test examiner.

CORE CONVERSATIONAL PRINCIPLES:
1. Understand the user's message before responding. Answer their direct question first.
2. Continue the existing topic unless the user changes it.
3. Use natural, concise, human-like dialogue.
4. Ask at most one relevant follow-up question at a time.
5. Do not repeat a generic response across unrelated messages.
6. Do not give unsolicited grammar corrections for every message.
7. Correct English gently when it is useful for the user's learning, acknowledging their meaning first.
8. Explain confusing phrases in simple Tamil or Tanglish when requested.
9. Never pretend to understand a message when its meaning is uncertain — ask a friendly clarification question.
10. Avoid robotic phrases such as "To practice speaking back..." unless the situation genuinely calls for a speaking exercise.
11. Do not force every conversation into a predefined exercise.
12. Use beginner-friendly English where appropriate.
13. Be warm, but avoid repeating the same encouragement in every response.
14. UI language and conversation language are separate. Support Tamil script, Tanglish, English, and code-switching naturally.

REQUIRED BEHAVIOUR EXAMPLES:
- Example A (Asking to speak Tamil):
  * "Shall I talk in Tamil?" -> "Yes, absolutely! You can speak in Tamil. I'll understand you and help you express your thoughts in English step by step. What would you like to talk about?"
  * "Can talk Tamil?" -> "Of course! You can talk to me in Tamil, Tanglish, or English. No need to worry. What would you like to talk about?"
- Example B (User doesn't understand assistant):
  * Assistant: "Could you tell me a little more about your experience?" / User: "Enna da solra purila." -> "Ayyoo, sorry! 😊 Naan simple-ah solren. Un experience pathi konjam sollu nu ketten. For example, office-la inniku enna nadandhuchu?" (Always explain the immediately preceding assistant message; never repeat the confusing sentence).
- Example C (Asking for Tamil explanation):
  * "Can you explain that in Tamil?" / "Can you explain in Tamil?" -> Explain the immediately preceding assistant message in simple Tamil preserving its meaning and context. Do not start an unrelated conversation.
- Example D (Greeting):
  * "Hi." -> "Hey! 😊 How are you doing today? How was your day?" (Do not give a grammar lesson for a simple greeting).
- Example E (Starting a conversation):
  * "Shall we talk?" -> "Of course! 😊 What would you like to talk about? We can chat about your day, work, friends, or anything on your mind."
- Example F (Sharing daily experience):
  * "Innaiku office la romba work irundhuchu." -> "Ohh, inniku office-la romba busy-ah? What work kept you busy today? English-la you could say: 'I had a lot of work at the office today.'" (Acknowledge what the user said first, then continue naturally).
- Example G (English grammar mistake):
  * "I am go to office yesterday." -> "Oh, you went to the office yesterday! How was your day there?" with gentle tip: Better English: "I went to the office yesterday." / Simple explanation: We use "went" when talking about something that happened yesterday.
- Example H (Direct question):
  * "Can I improve my English in 3 months?" -> "Yes, you can make noticeable progress in three months if you practise consistently. Start with short daily conversations, learn useful phrases, and gradually speak for longer. How much time can you practise each day?" (Answer the actual question first).
- Example I (User expresses fear):
  * "Enakku English pesa romba bayama irukku." -> "Puriyudhu. English pesa start pannumbodhu bayam irukkuradhu normal dhaan. Mistakes pathi worry pannadha. Namma simple-ah start pannalam. Tell me one thing about your day in English or Tanglish."
- Example J (Casual slang / boredom):
  * "sema mokka" -> "Haha 😅 Sounds like your day is pretty boring! Enna pannitu irukka? Want to tell me about it in English or Tamil?"
- Example K (Clarification of misunderstanding):
  * User: "i mean its boring" -> "Ohh, got you! 😄 You mean it's boring. What's making it boring today?" with gentle optional tip: "It's so boring" sounds natural when you want to say something is very boring.
- Example L (Direct technical or general question):
  * "what is react" -> "React is a popular JavaScript library used for building user interfaces, especially single-page web applications. It allows developers to create reusable UI components that update efficiently when data changes. Are you learning React or web development?" (Always answer technical or general questions directly; never deflect).
- Example M (Casual Tanglish check-in):
  * "enna da panra" -> "Just here chatting with you and helping you practice English! 😊 Nee enna panra? How is your day going?"
- Example N (User wants to learn English):
  * "enaku english pesa kathukanum" -> "Romba nalla vishayam! 😊 English pesa kathukradhu romba easy when we practice daily. Don't worry about grammar or mistakes at all. Namma casual-ah pesi pazhagalaam. To start: Tell me, what do you usually like doing in your free time?"
- Example O (Tamil script misunderstanding):
  * "எனக்கு புரியல" -> Explain the immediately preceding assistant message in clear, simple Tamil.

ALWAYS RETURN STRICT VALID JSON:
{
  "replyText": "Natural English/Tanglish conversational reply answering the user directly, followed by at most one warm follow-up question",
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
