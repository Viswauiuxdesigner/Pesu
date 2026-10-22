import { AIResponsePayload, ConversationOptions } from './aiProvider';
import { Message, DetectedLanguage, GrammarCorrection } from '../../types/conversation';
import { detectLanguage, isAskingForTamilExplanation } from '../../utils/languageDetector';
import { checkGrammar } from './grammarRules';

export interface ConversationContext {
  lastAssistantMessage?: Message;
  lastUserMessage?: Message;
  topicHistory: string[];
  activeTopic?: string;
  previousEntities: {
    person?: string;
    place?: string;
    activity?: string;
  };
}

export class ConversationPipeline {
  /**
   * Analyzes the conversation history to extract active topics, entities, and context.
   */
  analyzeContext(history: Message[]): ConversationContext {
    const reversed = [...history].reverse();
    const lastAssistantMessage = reversed.find(m => m.role === 'assistant');
    const lastUserMessage = reversed.find(m => m.role === 'user');

    const recentUserMessages = history.filter(m => m.role === 'user').slice(-4);
    const combinedRecentText = recentUserMessages.map(m => m.content.toLowerCase()).join(' ');

    let activeTopic: string | undefined;
    const previousEntities: ConversationContext['previousEntities'] = {};

    if (
      combinedRecentText.includes('friend') ||
      combinedRecentText.includes('fight') ||
      combinedRecentText.includes('argument') ||
      combinedRecentText.includes('misunderstood') ||
      combinedRecentText.includes('sanda')
    ) {
      activeTopic = 'friend_conflict';
      previousEntities.person = 'friend';
    } else if (
      combinedRecentText.includes('office') ||
      combinedRecentText.includes('work') ||
      combinedRecentText.includes('meeting') ||
      combinedRecentText.includes('boss') ||
      combinedRecentText.includes('manager')
    ) {
      activeTopic = 'workplace';
      previousEntities.place = 'office';
    } else if (
      combinedRecentText.includes('interview') ||
      combinedRecentText.includes('self introduction') ||
      combinedRecentText.includes('resume')
    ) {
      activeTopic = 'interview';
    } else if (
      combinedRecentText.includes('went') ||
      combinedRecentText.includes('gone') ||
      combinedRecentText.includes('grammar') ||
      combinedRecentText.includes('difference between')
    ) {
      activeTopic = 'grammar_question';
    } else if (
      combinedRecentText.includes('three months') ||
      combinedRecentText.includes('3 months') ||
      combinedRecentText.includes('improve my english') ||
      combinedRecentText.includes('learn english')
    ) {
      activeTopic = 'english_learning';
    }

    return {
      lastAssistantMessage,
      lastUserMessage,
      topicHistory: activeTopic ? [activeTopic] : [],
      activeTopic,
      previousEntities
    };
  }

  /**
   * Main pipeline entry point to interpret and reply to user messages.
   */
  processMessage(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): AIResponsePayload {
    const trimmed = userText.trim();
    const lower = trimmed.toLowerCase();
    const detectedLang = detectLanguage(trimmed);
    const context = this.analyzeContext(history);

    // 1. Language preference, permission, and capability questions
    const langPermReply = this.handleLanguageCapability(lower, trimmed, detectedLang);
    if (langPermReply) return langPermReply;

    // 2. Clarification, Confusion, and "Don't understand"
    const clarificationReply = this.handleClarificationAndConfusion(lower, trimmed, context, detectedLang);
    if (clarificationReply) return clarificationReply;

    // 3. Asking for Tamil explanation of previous message
    if (isAskingForTamilExplanation(trimmed) || lower.includes('explain that in tamil') || lower.includes('explain in tamil')) {
      return this.handleExplainInTamil(context, detectedLang);
    }

    // 4. Asking for simple English
    if (
      lower.includes('simple english') ||
      lower.includes('simpler english') ||
      lower.includes('easy english') ||
      lower.includes('easier words')
    ) {
      return this.handleExplainInSimpleEnglish(context);
    }

    // 5. Contextual follow-up and pronouns ("He misunderstood me", "What should I do now?", "Why did that happen?")
    const followUpReply = this.handleContextualFollowUp(lower, trimmed, context, detectedLang);
    if (followUpReply) return followUpReply;

    // 6. Direct Questions: Learning timeline, Interview guidance, Grammar explanations
    const directQuestionReply = this.handleDirectQuestions(lower, trimmed, detectedLang);
    if (directQuestionReply) return directQuestionReply;

    // 7. Everyday Emotional Sharing (bad day, busy work, tired, fear, fight)
    const emotionReply = this.handleEmotionalSharing(lower, trimmed, detectedLang);
    if (emotionReply) return emotionReply;

    // 8. Topic change requests (movies, food, specific topic switch)
    const topicChangeReply = this.handleTopicChange(lower, detectedLang);
    if (topicChangeReply) return topicChangeReply;

    // 9. General Greetings and Conversation Initiation ("Hi", "Shall we talk?")
    const greetingReply = this.handleGreetingsAndInitiation(lower, detectedLang);
    if (greetingReply) return greetingReply;

    // 10. Check for English grammar mistakes without interrupting the conversation
    const grammarIssue = checkGrammar(trimmed);
    if (grammarIssue) {
      return this.handleGrammarWithMeaning(trimmed, grammarIssue, detectedLang, options);
    }

    // 11. Roleplay Scenario specific handling
    const scenarioReply = this.handleScenarioDialogue(trimmed, options?.scenarioId, detectedLang);
    if (scenarioReply) return scenarioReply;

    // 12. Short confirmations & agreements ("seri", "ok", "super", "got it")
    if (this.isConfirmation(lower)) {
      return {
        replyText: `Awesome! What would you like to talk about next? We can discuss your hobbies, workplace conversations, or practice for an interview.`,
        detectedLanguage: 'english',
        tamilExplanation: `அருமை! அடுத்து எதைப் பற்றி பேசலாம்? உங்கள் விருப்பமான பொழுதுபோக்குகள், அலுவலக உரையாடல் அல்லது நேர்காணல் பயிற்சியா?`,
        suggestedResponses: [
          'Let us talk about daily office work.',
          'Can we practice interview questions?',
          'Tell me about your favorite travel place.'
        ]
      };
    }

    // 13. Smart, context-aware fallback (NEVER a repetitive generic template!)
    return this.generateSmartFallback(trimmed, detectedLang, context);
  }

  // ---------------------------------------------------------------------------
  // 1. Language Capability & Permission Handler
  // ---------------------------------------------------------------------------
  private handleLanguageCapability(
    lower: string,
    rawText: string,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // English phrasing
    const isEnglishLanguageQuestion =
      (lower.includes('talk') || lower.includes('speak') || lower.includes('chat') || lower.includes('use')) &&
      lower.includes('tamil') &&
      (lower.includes('shall') || lower.includes('can') || lower.includes('may') || lower.includes('i') || lower.includes('we'));

    // Shorthand / imperfect grammar: "can talk tamil", "can speak tamil", "tamil ok", "tamil okay", "tamil possible"
    const isShorthandTamil =
      lower === 'can talk tamil' ||
      lower === 'can speak tamil' ||
      lower === 'can talk in tamil' ||
      lower === 'i can talk tamil' ||
      lower === 'i can speak tamil' ||
      lower === 'tamil can talk' ||
      lower === 'tamil ok' ||
      lower === 'tamil okay' ||
      lower === 'tamil ok va' ||
      lower === 'tamil okva';

    // Tanglish phrasing: "naan tamil la pesalama", "tamil-la pesalama", "tamil la pesalaama", "tamil pesalama"
    const isTanglishTamilQuestion =
      (lower.includes('tamil') || lower.includes('தமிழ்')) &&
      (lower.includes('pesalama') ||
        lower.includes('pesalaama') ||
        lower.includes('pesalam') ||
        lower.includes('pesa mudiyuma') ||
        lower.includes('pesuvoma') ||
        lower.includes('theriyuma'));

    // Tanglish understanding: "can you understand tanglish?", "tanglish puriyuma", "tanglish theriyuma"
    const isTanglishCapability =
      lower.includes('tanglish') &&
      (lower.includes('understand') ||
        lower.includes('puriyuma') ||
        lower.includes('theriyuma') ||
        lower.includes('pesalama') ||
        lower.includes('type') ||
        lower.includes('can you'));

    // General understanding check: "naan enna sonnalum unakku puriyudha?"
    const isGeneralUnderstandingCheck =
      (lower.includes('puriyudha') && (lower.includes('naan') || lower.includes('enakku'))) ||
      lower.includes('do you understand me') ||
      lower.includes('can you understand me') ||
      lower.includes('puriyudha unakku');

    if (isTanglishCapability) {
      return {
        replyText: `Yes! You can type in Tanglish, Tamil, English, or mix them together. Just speak naturally. What would you like to talk about today?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆமாம்! Tanglish, தமிழ் அல்லது ஆங்கிலம் என எதில் வேண்டுமானாலும் பேசலாம். தயங்காமல் தொடங்குங்கள்!`,
        suggestedResponses: [
          'Innaiku office-la romba work irundhuchu.',
          'Can I improve my English in three months?',
          'Shall we practice introducing ourselves?'
        ]
      };
    }

    if (isTanglishTamilQuestion) {
      return {
        replyText: `Aama, kandippa! Tamil-la comfortable-ah pesalaam. Unakku enna pesa thonudho sollu. We can practise English slowly whenever you're ready!`,
        detectedLanguage: 'mixed',
        tamilExplanation: `ஆமாம், கண்டிப்பாக! தமிழில் தாராளமாகப் பேசலாம். உங்களுக்கு என்ன பேசத் தோன்றுகிறதோ தயங்காமல் சொல்லுங்கள்.`,
        suggestedResponses: [
          'Innaiku office-la romba work irundhuchu.',
          'Enakku English pesa konjam bayama irukku.',
          'Interview-la self intro epdi sollanum?'
        ]
      };
    }

    if (isShorthandTamil) {
      return {
        replyText: `Yes, you can talk in Tamil! Don't worry about grammar or speaking perfectly. We will practise English together step by step whenever you feel ready. What is on your mind?`,
        detectedLanguage: 'english',
        tamilExplanation: `தாராளமாக தமிழில் பேசலாம்! இலக்கணம் பற்றி கவலைப்பட வேண்டாம். நாம் மெதுவாக ஆங்கிலமும் பழகலாம். இப்போது என்ன பேசலாம்?`,
        suggestedResponses: [
          'Today I had a bad day.',
          'Can I improve my English in three months?',
          'How do I introduce myself in an interview?'
        ]
      };
    }

    if (isEnglishLanguageQuestion) {
      if (lower.includes('can i speak tamil') || lower.includes('can i talk in tamil')) {
        return {
          replyText: `Absolutely! You can speak in Tamil. I'll do my best to understand you. We can practise English slowly whenever you're ready. What would you like to talk about?`,
          detectedLanguage: 'english',
          tamilExplanation: `நிச்சயமாக! நீங்கள் தமிழில் பேசலாம். நாம் மெதுவாக, உங்கள் வசதிக்கேற்ப ஆங்கிலமும் பழகலாம். எதைப் பற்றி பேசலாம்?`,
          suggestedResponses: [
            'Today I had a bad day.',
            'Can I improve my English in three months?',
            'How do I introduce myself in an interview?'
          ]
        };
      }

      return {
        replyText: `Yes, of course! You can speak in Tamil, Tanglish, or English — whichever feels comfortable for you. What would you like to talk about?`,
        detectedLanguage: 'english',
        tamilExplanation: `கண்டிப்பாக! நீங்கள் தமிழ், Tanglish அல்லது ஆங்கிலம் — எதில் வேண்டுமானாலும் வசதியாகப் பேசலாம். எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'Innaiku office-la romba work irundhuchu.',
          'Can I improve my English in three months?',
          'How do I introduce myself in an interview?'
        ]
      };
    }

    if (isGeneralUnderstandingCheck) {
      return {
        replyText: `Aama, kandippa puriyudhu! I understand you clearly whether you type or speak in Tamil, Tanglish, or English. You can speak freely without worrying about mistakes. What would you like to talk about today?`,
        detectedLanguage: 'mixed',
        tamilExplanation: `ஆமாம், நீங்கள் சொல்வது எனக்கு தெளிவாகப் புரிகிறது! தமிழ், Tanglish, ஆங்கிலம் என எதில் வேண்டுமானாலும் பேசலாம். தயங்காமல் தொடங்குங்கள்!`,
        suggestedResponses: [
          'Innaiku office-la romba work irundhuchu.',
          'Teach me how to introduce myself in an interview.',
          'I want to speak in English without hesitation.'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 2. Clarification & Confusion Handler
  // ---------------------------------------------------------------------------
  private handleClarificationAndConfusion(
    lower: string,
    rawText: string,
    context: ConversationContext,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    const isConfused =
      lower.includes('puriyala') ||
      lower.includes('purila') ||
      lower.includes('enna da solra') ||
      lower.includes('enna da sollra') ||
      lower.includes('enna solra') ||
      lower.includes('enna solreenga') ||
      lower.includes('puriyave illa') ||
      lower.includes("didn't understand") ||
      lower.includes("did not understand") ||
      lower.includes("i don't understand") ||
      lower.includes("what do you mean") ||
      lower.includes("not clear") ||
      lower.includes("don't understand");

    if (!isConfused) return null;

    const lastMsg = context.lastAssistantMessage;
    if (lastMsg) {
      const explanation = this.buildContextualClarification(lastMsg.content);
      return {
        replyText: `Ayyoo, sorry if that was confusing! Let me explain it in simple words:\n\n${explanation.simpleEnglish}`,
        detectedLanguage: 'mixed',
        tamilExplanation: explanation.tamilExplanation,
        suggestedResponses: [
          'Now I understand, thank you!',
          'Can you ask me a simple question?',
          'Let me try replying now.'
        ]
      };
    }

    return {
      replyText: `No problem at all! Enna puriyala nu sollunga, I will explain it in simple Tamil and easy English. What would you like to know?`,
      detectedLanguage: 'mixed',
      tamilExplanation: `எந்த இடம் புரியவில்லை என்று சொல்லுங்கள், தமிழில் எளிமையாக விளக்குகிறேன்.`
    };
  }

  private buildContextualClarification(content: string): { simpleEnglish: string; tamilExplanation: string } {
    const lower = content.toLowerCase();

    if (lower.includes('went') && lower.includes('gone')) {
      return {
        simpleEnglish: `'Went' is used alone for the past: "I went to the office."\n'Gone' is always used with has/have: "He has gone to the office."`,
        tamilExplanation: `'Went' தனியாக கடந்த காலத்திற்கு வரும்: "I went to office" (நான் அலுவலகம் சென்றேன்).\n'Gone' எப்போதும் 'have' அல்லது 'has' உடன் மட்டுமே வரும்: "He has gone".`
      };
    }

    if (lower.includes('friend') || lower.includes('misunderstanding') || lower.includes('fight')) {
      return {
        simpleEnglish: `I was saying that misunderstandings with friends happen to everyone. Talking calmly to your friend helps resolve it.`,
        tamilExplanation: `நண்பர்களிடம் ஏற்படும் தவறான புரிதல்கள் இயல்பானவை; சற்று நேரம் கொடுத்து அமைதியாகப் பேசினால் சரியாகிவிடும் என்று சொன்னேன்.`
      };
    }

    if (lower.includes('interview') || lower.includes('self-introduction') || lower.includes('name is')) {
      return {
        simpleEnglish: `I was explaining how to introduce yourself: Say your name, where you are from, and what your job or degree is.`,
        tamilExplanation: `சுய அறிமுகம் எப்படி செய்ய வேண்டும் என்று சொன்னேன்: பெயர், ஊர், மற்றும் படிப்பு/வேலை ஆகியவற்றை எளிய ஆங்கிலத்தில் சொல்லுங்கள்.`
      };
    }

    if (lower.includes('three months') || lower.includes('fluency') || lower.includes('improve')) {
      return {
        simpleEnglish: `I meant that 3 months of daily speaking practice will make you confident and fluent in daily conversations.`,
        tamilExplanation: `தினமும் பேசிப் பழகினால் 3 மாதங்களில் தன்னம்பிக்கையுடன் எளிய ஆங்கிலம் பேச முடியும் என்று குறிப்பிட்டேன்.`
      };
    }

    if (lower.includes('office') || lower.includes('work') || lower.includes('busy') || lower.includes('hectic')) {
      return {
        simpleEnglish: `I asked about your workday. What tasks kept you so busy at the office today?`,
        tamilExplanation: `இன்று அலுவலகத்தில் என்னென்ன வேலைகள் உங்களை பிஸியாக வைத்திருந்தன என்று கேட்டேன்.`
      };
    }

    if (lower.includes('tamil') || lower.includes('tanglish') || lower.includes('comfortable')) {
      return {
        simpleEnglish: `I said that you are completely free to speak in Tamil, Tanglish, or English — whichever you prefer!`,
        tamilExplanation: `நீங்கள் தமிழ், Tanglish அல்லது ஆங்கிலம் என உங்களுக்கு விருப்பமான மொழியில் தாராளமாகப் பேசலாம் என்று சொன்னேன்.`
      };
    }

    return {
      simpleEnglish: `In simple terms: English speaking is easy when we practice step by step without worrying about mistakes. What is on your mind?`,
      tamilExplanation: `சுருக்கமாக: தவறுகளைப் பற்றி கவலைப்படாமல் மெதுவாக பேசிப் பழகினால் ஆங்கிலம் எளிதாக வரும். இப்போது என்ன பேசலாம்?`
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Explain in Tamil Handler
  // ---------------------------------------------------------------------------
  private handleExplainInTamil(context: ConversationContext, detectedLang: DetectedLanguage): AIResponsePayload {
    const lastMsg = context.lastAssistantMessage;
    if (lastMsg) {
      const explanation = this.buildContextualClarification(lastMsg.content);
      return {
        replyText: `Kandippa! Here is the explanation in Tamil for what I just said:\n\n👉 ${explanation.tamilExplanation}\n\nShall we continue? Take your time!`,
        detectedLanguage: 'tamil',
        tamilExplanation: explanation.tamilExplanation,
        suggestedResponses: [
          'Got it, thank you!',
          'Let me try replying now.',
          'Can we practice another sentence?'
        ]
      };
    }

    return {
      replyText: `Kandippa! I am always ready to explain in Tamil. What sentence or question would you like me to explain?`,
      detectedLanguage: 'mixed',
      tamilExplanation: `கண்டிப்பாக! எந்த வாக்கியத்திற்கு தமிழ் விளக்கம் வேண்டும் என்று கேளுங்கள், விளக்குகிறேன்.`
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Explain in Simple English Handler
  // ---------------------------------------------------------------------------
  private handleExplainInSimpleEnglish(context: ConversationContext): AIResponsePayload {
    const lastMsg = context.lastAssistantMessage;
    if (lastMsg) {
      const explanation = this.buildContextualClarification(lastMsg.content);
      return {
        replyText: `Here it is in very simple English:\n\n👉 "${explanation.simpleEnglish}"\n\nTake your time. How would you like to answer this in your own words?`,
        detectedLanguage: 'english',
        tamilExplanation: explanation.tamilExplanation,
        suggestedResponses: [
          'Understood! Let me try.',
          'Can you give an example answer?',
          'What is the next question?'
        ]
      };
    }

    return {
      replyText: `Sure! I will always use simple, easy-to-understand English with short sentences. What topic shall we talk about?`,
      detectedLanguage: 'english',
      tamilExplanation: `கண்டிப்பாக! இனி எளிய சொற்களில், சிறிய வாக்கியங்களாகப் பேசுகிறேன்.`
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Contextual Follow-up & Pronoun Handler
  // ---------------------------------------------------------------------------
  private handleContextualFollowUp(
    lower: string,
    rawText: string,
    context: ConversationContext,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // A. "He misunderstood me" / "She misunderstood me"
    if (
      (lower.includes('misunderstood') || lower.includes('misunderstand') || lower.includes('purinjukala') || lower.includes('thappa purinjikitanga')) &&
      (lower.includes('he') || lower.includes('she') || lower.includes('they') || context.activeTopic === 'friend_conflict')
    ) {
      const person = lower.includes('she') ? 'she' : 'he';
      const pronounCap = person === 'she' ? 'She' : 'He';
      return {
        replyText: `Misunderstandings hurt, especially with close friends. What did ${person} think happened, or what was the misunderstanding about?`,
        detectedLanguage: 'english',
        tamilExplanation: `நண்பர்களிடம் தவறான புரிதல்கள் ஏற்படும்போது வருத்தமாக இருப்பது இயல்பே. அவர் எதை தவறாகப் புரிந்து கொண்டார்?`,
        suggestedResponses: [
          `${pronounCap} thought I didn't care about the plan.`,
          'It was a small argument that grew big.',
          'What should I do now to fix it?'
        ]
      };
    }

    // B. "What should I do now?" / "What can I do?"
    if (
      lower.includes('what should i do') ||
      lower.includes('what can i do') ||
      lower.includes('what to do now') ||
      lower.includes('what do i do') ||
      lower.includes('enna panradhu ippo') ||
      lower.includes('enna seiyalam')
    ) {
      if (context.activeTopic === 'friend_conflict') {
        return {
          replyText: `Give him a little time to cool down first. Then send a calm, honest message or call him saying, "Hey, I value our friendship and I think we had a misunderstanding. Can we talk about it?" A sincere conversation usually clears things up. How do you feel about reaching out to him?`,
          detectedLanguage: 'english',
          tamilExplanation: `சிறிது நேரம் கழித்து அமைதியாக பேசி, "நமக்கு இடையே தவறான புரிதல் ஏற்பட்டுள்ளது, பேசி தீர்த்துக்கொள்ளலாம்" என்று ஒரு மெசேஜ் அனுப்புங்கள். நேர்மையான பேச்சு பெரும்பாலான பிரச்சனைகளை தீர்க்கும்.`,
          suggestedResponses: [
            'Yes, I will call him tomorrow.',
            'What if he is still angry?',
            'Can you help me write an apology message?'
          ]
        };
      }

      if (context.activeTopic === 'workplace') {
        return {
          replyText: `Since you had a heavy workday, step away from your screen, drink some water, and have a good meal. A good night's sleep will recharge you for tomorrow! Would you like to practice a short English sentence before you rest?`,
          detectedLanguage: 'english',
          tamilExplanation: `வேலை பளு அதிகம் இருந்ததால், சிறிது நேரம் ஓய்வெடுத்து, தண்ணீர் குடித்துவிட்டு தூங்கச் செல்லுங்கள். நாளை புத்துணர்ச்சியுடன் தொடங்கலாம்!`,
          suggestedResponses: [
            'Yes, I will rest now.',
            'Let us practice one short sentence.',
            'How to say "I am calling it a day"?'
          ]
        };
      }

      if (context.activeTopic === 'interview') {
        return {
          replyText: `The best thing right now is to practice speaking your introduction out loud 2 or 3 times. Don't worry about being perfect — just focus on speaking clearly and confidently. Ready to try saying it to me?`,
          detectedLanguage: 'english',
          tamilExplanation: `இப்போது சிறந்த வழி: உங்கள் அறிமுகத்தை 2 அல்லது 3 முறை சத்தமாக பேசிப் பழகுங்கள். தயங்காமல் முயற்சி செய்யுங்கள்!`,
          suggestedResponses: [
            'Hello, my name is Karthik and I am a software engineer.',
            'What questions might they ask after my intro?',
            'Teach me one more interview tip.'
          ]
        };
      }

      return {
        replyText: `Take a deep breath! Tell me what specific goal or decision you are facing right now, and we can break it down step by step together.`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆழமாக மூச்சு விடுங்கள்! இப்போது உங்கள் முன்னுள்ள விஷயம் என்னவென்று சொல்லுங்கள், ஒன்றாக சிந்திப்போம்.`
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 6. Direct Questions Handler (Grammar, Learning, Interview, Practical)
  // ---------------------------------------------------------------------------
  private handleDirectQuestions(
    lower: string,
    rawText: string,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // A. "Can I improve my English in three months?"
    if (
      (lower.includes('three months') || lower.includes('3 months')) &&
      (lower.includes('improve') || lower.includes('learn') || lower.includes('fluent') || lower.includes('speak'))
    ) {
      return {
        replyText: `Yes, you can make significant progress in three months! With consistent daily practice — listening, speaking out loud, and not worrying about small mistakes — your confidence and fluency will definitely improve. While mastering a language takes longer, 3 months of regular conversation is enough to speak more smoothly and fearlessly in daily life and interviews. Shall we take the first step together today?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆம், தினமும் தொடர்ந்து பேசிப் பழகினால் 3 மாதங்களில் உங்கள் தயக்கம் நீங்கி, தன்னம்பிக்கையுடன் சரளமாகப் பேச முடியும்! தினமும் 15-20 நிமிடங்கள் பேசுவதே போதுமானது.`,
        suggestedResponses: [
          'How many minutes should I practice every day?',
          'What is the best way to practice speaking?',
          'Let us start practicing now.'
        ]
      };
    }

    // B. "How do I introduce myself in an interview?"
    if (
      lower.includes('self introduction') ||
      (lower.includes('interview') && (lower.includes('introduce') || lower.includes('intro') || lower.includes('sollanum') || lower.includes('epdi'))) ||
      lower.includes('how do i introduce myself') ||
      lower.includes('tell me about yourself')
    ) {
      return {
        replyText: `Here is a practical, 3-step structure for your interview self-introduction:\n\n1. Greeting & Name: "Good morning/afternoon, my name is [Your Name]."\n2. Background: "I am from [City], and I have a background in [Degree/Field] / I work as a [Your Role]."\n3. Key Strength & Goal: "I enjoy solving problems and I am eager to contribute my skills to this team."\n\nTry personalizing this with your name and role, and share it with me right now!`,
        detectedLanguage: 'english',
        tamilExplanation: `நேர்காணலில் சுய அறிமுகம் செய்ய 3 படிகள்:\n1. பெயர்: "Hello, my name is..."\n2. ஊர் & வேலை/படிப்பு: "I am from Chennai and I work as..."\n3. பலம் & ஆர்வம்: "I enjoy solving problems..."\nஇப்போது உங்கள் விவரங்களை வைத்து ஒரு முறை சொல்லிப் பாருங்கள்!`,
        pronunciationGuide: `குட் மார்னிங், மை நேம் இஸ்... ஐ அம் ஃப்ரம்... ஐ என்ஜாய் சால்விங் ப்ராப்ளம்ஸ்...`,
        suggestedResponses: [
          'Hello, my name is Vignesh and I am a software developer from Chennai.',
          'How do I answer "What is your greatest weakness?"',
          'Can you review my introduction sentence?'
        ]
      };
    }

    // C. "What is the difference between 'went' and 'gone'?"
    if (
      (lower.includes('difference') || lower.includes('vs') || lower.includes('when to use')) &&
      lower.includes('went') &&
      lower.includes('gone')
    ) {
      return {
        replyText: `Great question! Both 'went' and 'gone' are past forms of 'go', but here is the key difference:\n\n1. 'Went' is the simple past. It is used alone without helper verbs:\n   👉 "I went to the office yesterday."\n   👉 "She went home early."\n\n2. 'Gone' is the past participle. It is ALWAYS used with helper verbs like 'has', 'have', or 'had':\n   👉 "He has gone to lunch."\n   👉 "They have gone to Chennai."\n\n💡 Golden rule: Never say "I gone". Always say "I went" or "I have gone".`,
        detectedLanguage: 'english',
        tamilExplanation: `முக்கிய வேறுபாடு:\n1. 'Went' தனியாக வரும் (எ.கா: "I went to the office yesterday" - நேற்று அலுவலகம் சென்றேன்).\n2. 'Gone' எப்போதும் has/have/had உடன் மட்டுமே வரும் (எ.கா: "He has gone" - அவன் சென்றுவிட்டான்).\nஎப்போதுமே "I gone" என்று சொல்லக் கூடாது!`,
        suggestedResponses: [
          'Give me one practice sentence to try.',
          'What is the difference between see and watch?',
          'What is the difference between hear and listen?'
        ]
      };
    }

    // D. "Difference between see and watch"
    if (
      (lower.includes('difference') || lower.includes('vs')) &&
      lower.includes('see') &&
      lower.includes('watch')
    ) {
      return {
        replyText: `Here is the simple difference between 'see' and 'watch':\n\n1. 'See' is natural / effortless: You notice something with your eyes without trying.\n   👉 "I can see the mountains from here."\n\n2. 'Watch' is focused / intentional: You look at something moving for a period of time.\n   👉 "I like to watch movies on weekends."\n   👉 "Did you watch the match?"`,
        detectedLanguage: 'english',
        tamilExplanation: `'See' என்பது எதேச்சையாக கண்களில் படுவது. 'Watch' என்பது கவனமாக குறிப்பிட்ட நேரம் பார்ப்பது (திரைப்படம், கிரிக்கெட் போன்றவை).`,
        suggestedResponses: [
          'What is the difference between hear and listen?',
          'What is the difference between say and tell?',
          'Give me a practice exercise.'
        ]
      };
    }

    // E. "Difference between hear and listen"
    if (
      (lower.includes('difference') || lower.includes('vs')) &&
      lower.includes('hear') &&
      lower.includes('listen')
    ) {
      return {
        replyText: `Here is the difference between 'hear' and 'listen':\n\n1. 'Hear' is passive: Sounds simply enter your ears without effort.\n   👉 "Did you hear that noise outside?"\n\n2. 'Listen' is active: You pay deliberate attention to the sound.\n   👉 "Please listen to the teacher."\n   👉 "I love listening to AR Rahman songs."`,
        detectedLanguage: 'english',
        tamilExplanation: `'Hear' என்பது காதில் எதேச்சையாக விழும் சத்தம். 'Listen' என்பது கவனமாகக் கேட்பது (பாட்டு, பாடம் போன்றவை).`,
        suggestedResponses: [
          'What is the difference between say and tell?',
          'How to improve my daily English vocabulary?',
          'Understood! Let us practice a conversation.'
        ]
      };
    }

    // F. "Difference between say and tell"
    if (
      (lower.includes('difference') || lower.includes('vs')) &&
      lower.includes('say') &&
      lower.includes('tell')
    ) {
      return {
        replyText: `Here is the key difference between 'say' and 'tell':\n\n1. 'Tell' needs a person right after it:\n   👉 "Tell me the story." (or "She told him the truth.")\n\n2. 'Say' does NOT need a person right after it:\n   👉 "What did you say?" (or "He said that he was happy.")\n\n💡 Shortcut: Tell someone something, but say something.`,
        detectedLanguage: 'english',
        tamilExplanation: `'Tell' வரும்போது யார் என்று குறிப்பிட வேண்டும் ("Tell me", "Tell him"). 'Say' வரும்போது நபர் தேவையில்லை ("He said").`,
        suggestedResponses: [
          'Give me a short test on this.',
          'How to say "leave request" professionally?',
          'Let us continue chatting.'
        ]
      };
    }

    // G. Professional leave request
    if (lower.includes('leave request') || lower.includes('ask for leave') || lower.includes('leave letter') || lower.includes('apply leave')) {
      return {
        replyText: `Here is a polite, professional way to ask for leave:\n\n"Dear [Manager's Name],\nI would like to request casual leave for 2 days on [Dates] due to personal reasons. I will ensure all pending deliverables are completed or handed over before taking leave.\nThank you,\n[Your Name]"\n\nWould you like a shorter version for Slack or WhatsApp?`,
        detectedLanguage: 'english',
        tamilExplanation: `மேலாளரிடம் விடுப்பு கேட்கும்போது: "Dear Manager, I would like to request casual leave..." என தொடங்குவது பண்பான முறை.`,
        suggestedResponses: [
          'Can you give a short version for WhatsApp?',
          'How do I say for sick leave?',
          'Thank you, that is very helpful!'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 7. Emotional Sharing Handler (Bad Day, Tired, Busy, Fight)
  // ---------------------------------------------------------------------------
  private handleEmotionalSharing(
    lower: string,
    rawText: string,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // A. "Today I had a bad day."
    if (
      lower.includes('bad day') ||
      lower.includes('terrible day') ||
      lower.includes('rough day') ||
      lower.includes('horrible day') ||
      lower.includes('sad day') ||
      lower.includes('boring day')
    ) {
      return {
        replyText: `Oh, I'm sorry to hear that. What happened today? If you'd like to share, I am here to listen.`,
        detectedLanguage: 'english',
        tamilExplanation: `இன்று உங்கள் நாள் கடினமாக இருந்ததைக் கேட்டு வருந்துகிறேன். என்ன நடந்தது? நீங்கள் பகிர விரும்பினால் நான் கேட்கத் தயார்.`,
        suggestedResponses: [
          'I had a fight with my friend.',
          'There was too much stress at work.',
          'Nothing went as planned today.'
        ]
      };
    }

    // B. "I had a fight with my friend."
    if (
      (lower.includes('fight') || lower.includes('argument') || lower.includes('disagreement') || lower.includes('sanda')) &&
      (lower.includes('friend') || lower.includes('colleague') || lower.includes('roommate') || lower.includes('family'))
    ) {
      const person = lower.includes('colleague') ? 'colleague' : 'friend';
      return {
        replyText: `Oh, I am really sorry to hear that. Disagreements with a ${person} can be so stressful. What happened between the two of you?`,
        detectedLanguage: 'english',
        tamilExplanation: `நண்பருடன் சண்டை ஏற்பட்டதைக் கேட்டு வருந்துகிறேன். உங்கள் இருவருக்கும் இடையே என்ன நடந்தது?`,
        suggestedResponses: [
          'He misunderstood me.',
          'She got upset over a small thing.',
          'We had different opinions on something.'
        ]
      };
    }

    // C. "Innaiku office-la romba work irundhuchu."
    if (
      (lower.includes('office') || lower.includes('work')) &&
      (lower.includes('romba work') ||
        lower.includes('irundhuchu') ||
        lower.includes('busy') ||
        lower.includes('hectic') ||
        lower.includes('packed') ||
        lower.includes('heavy work') ||
        lower.includes('lot of work'))
    ) {
      return {
        replyText: `Ayyoo, sounds like you had a busy day at the office! What kept you so busy?`,
        detectedLanguage: 'english',
        tamilExplanation: `அலுவலகத்தில் அதிக வேலை இருந்ததை ஆங்கிலத்தில்: "I had a lot of work at the office today" அல்லது "It was a hectic day at work" என்று கூறலாம்.`,
        suggestedResponses: [
          'I had back-to-back meetings today.',
          'I was fixing urgent bugs.',
          'Now I am finally relaxed.'
        ]
      };
    }

    // D. "I am feeling tired."
    if (
      lower.includes('tired') ||
      lower.includes('exhausted') ||
      lower.includes('feeling sleepy') ||
      lower.includes('romba tired') ||
      lower.includes('tired ah irukku')
    ) {
      return {
        replyText: `Sounds like you've had a tiring day. Did you get enough rest? Make sure to take it easy tonight.`,
        detectedLanguage: 'english',
        tamilExplanation: `களைப்பாக உணர்கிறீர்களா? போதிய ஓய்வு எடுங்கள். இன்று இரவு நன்றாக ஓய்வெடுப்பது நல்லது.`,
        suggestedResponses: [
          'Yes, I will go to sleep soon.',
          'I still have some pending work.',
          'Let us chat for 5 minutes before I sleep.'
        ]
      };
    }

    // E. Hesitation / Fear of speaking English
    if (
      lower.includes('bayama') ||
      lower.includes('thayakkama') ||
      lower.includes('fear') ||
      lower.includes('nervous') ||
      lower.includes('hesitat') ||
      lower.includes('scared')
    ) {
      return {
        replyText: `Bayapadathinga! That hesitation is completely natural for anyone learning a new language. You are in a safe, judgment-free space with me.\n\nLet's take a small, easy step together right now. Repeat after me out loud:\n👉 "Hello! I am learning to speak in English."\n\nDid you have coffee or tea this morning?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `பயப்படாதீர்கள்! ஆரம்பத்தில் தயக்கம் இருப்பது முற்றிலும் இயல்பானது. சிறு சிறு வாக்கியங்களாக தொடங்குவோம். "Hello! I am learning to speak in English" என்று சொல்லிப் பாருங்கள்!`,
        suggestedResponses: [
          'Hello! I am learning to speak in English.',
          'I had coffee this morning.',
          'Teach me one more easy sentence.'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 8. Topic Change Handler
  // ---------------------------------------------------------------------------
  private handleTopicChange(lower: string, detectedLang: DetectedLanguage): AIResponsePayload | null {
    if (lower.includes('movie') || lower.includes('cinema') || lower.includes('padam') || lower.includes('film')) {
      return {
        replyText: `Movies are always fun to talk about! What was the last movie you watched, and did you like it?`,
        detectedLanguage: 'english',
        tamilExplanation: `திரைப்படங்கள் பற்றி பேசுவது எப்போதும் சுவாரஸ்யமானது! நீங்கள் கடைசியாக பார்த்த படம் எது? அது உங்களுக்கு பிடித்திருந்ததா?`,
        suggestedResponses: [
          'I watched a Tamil comedy movie.',
          'I watched an exciting thriller.',
          'Can you recommend a good movie?'
        ]
      };
    }

    if (lower.includes('food') || lower.includes('sappadu') || lower.includes('cooking') || lower.includes('biryani') || lower.includes('dosa')) {
      return {
        replyText: `Food is my favorite topic! What did you have for lunch or dinner today? Any favorite Tamil dish you love?`,
        detectedLanguage: 'english',
        tamilExplanation: `இன்று மதியம் அல்லது இரவு உணவுக்கு என்ன சாப்பிட்டீர்கள்? உங்களுக்கு மிகவும் பிடித்த உணவு எது?`,
        suggestedResponses: [
          'I had hot sambar rice and potato fry.',
          'I had chicken biryani today.',
          'I had dosa and coconut chutney.'
        ]
      };
    }

    if (
      lower.includes('change topic') ||
      lower.includes('different topic') ||
      lower.includes('something else') ||
      lower.includes('veru ethavathu pesalam') ||
      lower.includes('topic mathalam')
    ) {
      return {
        replyText: `Sure! What new topic would you like to explore? We could talk about your favorite movies, weekend plans, favorite food, or travel.`,
        detectedLanguage: 'english',
        tamilExplanation: `நிச்சயமாக! பிடித்த திரைப்படங்கள், வார இறுதி திட்டங்கள், உணவு அல்லது பயணங்கள் என எதைப் பற்றி வேண்டுமானாலும் பேசலாம்.`,
        suggestedResponses: [
          'Let us talk about movies.',
          'Let us talk about weekend plans.',
          'Tell me about your favorite food.'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 9. Greetings & Initiation Handler ("Hi", "Shall we talk?")
  // ---------------------------------------------------------------------------
  private handleGreetingsAndInitiation(lower: string, detectedLang: DetectedLanguage): AIResponsePayload | null {
    // "Shall we talk?" / "Can we talk?" / "Let's talk" (general)
    if (
      (lower.includes('shall we talk') ||
        lower.includes('can we talk') ||
        lower.includes('let us talk') ||
        lower.includes("let's talk") ||
        lower.includes('lets talk') ||
        lower === 'pesalama' ||
        lower === 'pesalaama' ||
        lower === 'start pannalama' ||
        lower === 'shall we start') &&
      !lower.includes('about') &&
      !lower.includes('topic')
    ) {
      return {
        replyText: `Of course! What would you like to talk about today? We can chat about your day, practice English for work, or discuss any topic you enjoy!`,
        detectedLanguage: 'english',
        tamilExplanation: `கண்டிப்பாக பேசலாம்! இன்று எதைப் பற்றி பேசலாம்? உங்கள் நாள் பற்றியோ, அலுவலக ஆங்கிலமோ அல்லது பிடித்த தலைப்பிலோ பேசலாம்.`,
        suggestedResponses: [
          'Today I had a bad day.',
          'Innaiku office-la romba work irundhuchu.',
          'Can I improve my English in three months?'
        ]
      };
    }

    // Casual greetings: "hi", "hello", "vanakkam"
    const greetings = ['hi', 'hello', 'hey', 'vanakkam', 'வணக்கம்', 'good morning', 'good afternoon', 'good evening', 'hi there'];
    const isGreetingMatch = greetings.some(g => lower === g || lower.startsWith(`${g} `) || lower.startsWith(`${g},`) || lower.startsWith(`${g}!`));

    if (isGreetingMatch) {
      return {
        replyText: `Vanakkam! Hello there! Great to see you. How is your day going, and what would you like to talk about today?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `வணக்கம்! உங்களைச் சந்திப்பதில் மகிழ்ச்சி. இன்று உங்கள் நாள் எப்படி போகிறது? எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'Shall we talk?',
          'Innaiku office-la romba work irundhuchu.',
          'Can I speak Tamil?'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 10. Grammar Mistake with Meaning Acknowledgement
  // ---------------------------------------------------------------------------
  private handleGrammarWithMeaning(
    userText: string,
    grammarIssue: GrammarCorrection,
    detectedLang: DetectedLanguage,
    options?: ConversationOptions
  ): AIResponsePayload {
    const lower = userText.toLowerCase();

    // Specific conversational response tailored to what the user was trying to say:
    let naturalAcknowledgement = `I see what you mean!`;
    if (lower.includes('yesterday') && (lower.includes('office') || lower.includes('work'))) {
      naturalAcknowledgement = `I see! You're talking about going to the office yesterday. How was your day there?`;
    } else if (lower.includes('office') || lower.includes('work')) {
      naturalAcknowledgement = `Sounds like you were heading to work! How did things go?`;
    } else if (lower.includes('friend')) {
      naturalAcknowledgement = `Spending time with friends is great! What did you do together?`;
    } else if (lower.includes('doubt')) {
      naturalAcknowledgement = `Sure! Feel free to ask your question, and I'll be happy to help.`;
    }

    const tip = `Small English tip: Say, '${grammarIssue.improved}'.\n${grammarIssue.explanationInEnglish}`;

    return {
      replyText: `${naturalAcknowledgement}\n\n💡 ${tip}`,
      detectedLanguage: detectedLang,
      grammarCorrection: grammarIssue,
      tamilExplanation: options?.alwaysShowTamilExplanation || grammarIssue.explanationInTamil
        ? grammarIssue.explanationInTamil
        : undefined,
      suggestedResponses: [
        'Thanks for the tip! Let me rephrase.',
        'Could you give another example of this?',
        'Understood, let us continue chatting.'
      ]
    };
  }

  // ---------------------------------------------------------------------------
  // 11. Roleplay Scenario Dialogue
  // ---------------------------------------------------------------------------
  private handleScenarioDialogue(
    text: string,
    scenarioId?: string,
    detectedLang?: DetectedLanguage
  ): AIResponsePayload | null {
    const lower = text.toLowerCase();

    if (scenarioId === 'interview') {
      if (lower.includes('name is') || lower.includes('my name') || lower.includes('i am from')) {
        return {
          replyText: `Pleased to meet you! You introduced yourself clearly. As our next interview question: "What would you say is your greatest strength, and how does it help you in your daily work?"`,
          detectedLanguage: detectedLang || 'english',
          tamilExplanation: `அருமை! உங்கள் அறிமுகம் தெளிவாக இருந்தது. அடுத்த நேர்காணல் கேள்வி: "உங்கள் மிகப்பெரிய பலம் (strength) என்ன? அது உங்கள் வேலைக்கு எவ்வாறு உதவுகிறது?"`,
          suggestedResponses: [
            'My greatest strength is my problem-solving ability.',
            'I am a quick learner and enjoy working in teams.',
            'I am very punctual and detail-oriented.'
          ]
        };
      }
    }

    if (scenarioId === 'office_meeting') {
      if (lower.includes('update') || lower.includes('working') || lower.includes('finished') || lower.includes('tested')) {
        return {
          replyText: `Thanks for the update! That sounds like solid progress. Do you have any blockers or dependencies from the backend or design team today?`,
          detectedLanguage: detectedLang || 'english',
          tamilExplanation: `அப்டேட்டுக்கு நன்றி! இன்று உங்களுக்கு வேறு டீமிடமிருந்து ஏதேனும் உதவி அல்லது தடையூறு (blockers) உள்ளதா?`,
          suggestedResponses: [
            'No blockers from my side, everything is on track.',
            'Yes, I am waiting for the API response from the backend team.',
            'I might need a quick 5-minute call with you.'
          ]
        };
      }
    }

    if (scenarioId === 'restaurant') {
      if (lower.includes('menu') || lower.includes('special') || lower.includes('order') || lower.includes('water')) {
        return {
          replyText: `Certainly! Today our chef special is Fresh Paneer Butter Masala with Butter Naan, and grilled herbal chicken. Would you prefer vegetarian or non-vegetarian options today?`,
          detectedLanguage: detectedLang || 'english',
          tamilExplanation: `நிச்சயமாக! இன்று ஸ்பெஷல் பன்னீர் பட்டர் மசாலா மற்றும் கிரில்ட் சிக்கன். நீங்கள் சைவம் விரும்புகிறீர்களா அல்லது அசைவமா?`,
          suggestedResponses: [
            'I prefer vegetarian dishes, please.',
            'I would like to try the chicken dish.',
            'Could you bring some warm water first?'
          ]
        };
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 12. Smart Fallback (No repetitive generic replies!)
  // ---------------------------------------------------------------------------
  private generateSmartFallback(
    text: string,
    detectedLang: DetectedLanguage,
    context: ConversationContext
  ): AIResponsePayload {
    const lower = text.toLowerCase();

    // If input is very short or ambiguous
    if (text.length < 4) {
      return {
        replyText: `I am here with you! Tell me what's on your mind, or try speaking a full sentence in English, Tanglish, or Tamil.`,
        detectedLanguage: detectedLang,
        tamilExplanation: `நான் கவனித்துக் கொண்டிருக்கிறேன்! சற்று கூடுதலாக விவரியுங்கள், அல்லது ஒரு முழு வாக்கியமாகப் பேசிப் பாருங்கள்.`
      };
    }

    // Meaningful topic detection
    if (lower.includes('weather') || lower.includes('rain') || lower.includes('mazhai') || lower.includes('hot')) {
      return {
        replyText: `How is the weather where you are today? Is it sunny, raining, or pleasant?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `உங்கள் பகுதியில் இன்று வானிலை எப்படி உள்ளது? மழையா அல்லது வெயிலா?`,
        suggestedResponses: [
          'It is raining heavily today.',
          'The weather is very pleasant today.',
          'It is extremely hot outside.'
        ]
      };
    }

    if (lower.includes('weekend') || lower.includes('sunday') || lower.includes('saturday')) {
      return {
        replyText: `Weekends are the best time to recharge! Do you have any plans for the weekend, or are you just going to relax at home?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `வார இறுதியில் ஏதேனும் திட்டம் உள்ளதா அல்லது வீட்டிலேயே ஓய்வெடுக்கப் போகிறீர்களா?`,
        suggestedResponses: [
          'I am planning to watch a movie with family.',
          'I just want to sleep and take rest.',
          'I have to do some personal chores.'
        ]
      };
    }

    if (lower.includes('learn') || lower.includes('practice') || lower.includes('fluent') || lower.includes('english')) {
      return {
        replyText: `Practicing regular conversation is the best way to get fluent. What kind of English situations do you want to master first — office meetings, casual chats, or job interviews?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `தொடர்ந்து பேசுவதே சரளமாகப் பேச சிறந்த வழி. அலுவலக உரையாடலா அல்லது நேர்காணல் பயிற்சியா — எதில் கவனம் செலுத்த விரும்புகிறீர்கள்?`,
        suggestedResponses: [
          'I want to speak confidently in office meetings.',
          'I want to clear job interviews.',
          'I want to chat casually with friends.'
        ]
      };
    }

    // Dynamic acknowledgment of the user's sentence without canned repetition
    const words = text.split(/\s+/).slice(0, 5).join(' ');
    return {
      replyText: `That is interesting! You mentioned "${words}...". Could you tell me a little more about that in your own words?`,
      detectedLanguage: detectedLang,
      tamilExplanation: `நீங்கள் குறிப்பிட்டதைப் பற்றி இன்னும் கொஞ்சம் விவரியுங்கள்!`,
      suggestedResponses: [
        'Let me explain what happened.',
        'Can you show me how to say this better in English?',
        'Let us switch to another topic.'
      ]
    };
  }

  private isConfirmation(text: string): boolean {
    const tokens = ['ok', 'okay', 'seri', 'sari', 'super', 'got it', 'fine', 'understood', 'cool', 'correct', 'purinjuthu', 'aama'];
    return tokens.includes(text) || tokens.some(t => text === t || text === `${t}!` || text === `${t}.`);
  }
}
