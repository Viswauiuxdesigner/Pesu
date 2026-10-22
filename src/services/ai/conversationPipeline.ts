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
      combinedRecentText.includes('tired') ||
      combinedRecentText.includes('rest') ||
      combinedRecentText.includes('exhausted')
    ) {
      activeTopic = 'tired_workday';
      previousEntities.place = 'work';
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
      combinedRecentText.includes('movie') ||
      combinedRecentText.includes('cinema') ||
      combinedRecentText.includes('film')
    ) {
      activeTopic = 'movies';
    } else if (
      combinedRecentText.includes('photosynthesis')
    ) {
      activeTopic = 'photosynthesis';
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
    const clean = lower.replace(/[?!.,;:"'()—\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    const detectedLang = detectLanguage(trimmed);
    const context = this.analyzeContext(history);

    // 1. Language preference, capability, and permission questions
    const langPermReply = this.handleLanguageCapability(lower, clean, trimmed, detectedLang);
    if (langPermReply) return langPermReply;

    // 2. Clarification, Confusion, and "Don't understand" (including colloquial Tamil like "daw", "ithu")
    const clarificationReply = this.handleClarificationAndConfusion(lower, clean, trimmed, context, detectedLang);
    if (clarificationReply) return clarificationReply;

    // 3. Asking for Tamil explanation of previous message
    if (
      isAskingForTamilExplanation(trimmed) ||
      clean.includes('explain that in tamil') ||
      clean.includes('explain in tamil') ||
      clean.includes('can you explain in tamil') ||
      clean.includes('can you explain that in tamil') ||
      clean.includes('tamil-la explain') ||
      clean.includes('tamil la explain')
    ) {
      return this.handleExplainInTamil(context, detectedLang);
    }

    // 4. Asking for simple English
    if (
      clean.includes('simple english') ||
      clean.includes('simpler english') ||
      clean.includes('easy english') ||
      clean.includes('easier words')
    ) {
      return this.handleExplainInSimpleEnglish(context);
    }

    // 5. Contextual follow-up and pronouns ("Why?", "Really?", "He misunderstood me", "What should I do now?", "Yes, too much work")
    const followUpReply = this.handleContextualFollowUp(lower, clean, trimmed, context, detectedLang);
    if (followUpReply) return followUpReply;

    // 6. Direct Questions: Name, Photosynthesis, Learning timeline, Interview, Grammar explanations
    const directQuestionReply = this.handleDirectQuestions(lower, clean, trimmed, detectedLang);
    if (directQuestionReply) return directQuestionReply;

    // 7. Topic change requests (movies, food, specific topic switch)
    const topicChangeReply = this.handleTopicChange(lower, clean, detectedLang);
    if (topicChangeReply) return topicChangeReply;

    // 8. Everyday Emotional Sharing (tired, bad day, busy work, fear)
    const emotionReply = this.handleEmotionalSharing(lower, clean, trimmed, detectedLang);
    if (emotionReply) return emotionReply;

    // 9. General Greetings and Conversation Initiation ("Hi", "Shall we talk?")
    const greetingReply = this.handleGreetingsAndInitiation(lower, clean, detectedLang);
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
    if (this.isConfirmation(clean)) {
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
    clean: string,
    rawText: string,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // A. User asks if PESU (the AI) can speak/talk Tamil:
    // "Can you talk Tamil?", "Can you speak Tamil?", "Do you speak Tamil?", "Nee Tamil-la pesuviya?", "Unakku Tamil theriyuma?", "நீ தமிழில் பேசுவாயா?"
    const isAskingIfAITalksTamil =
      (clean.includes('you') || clean.includes('u ') || clean.includes('nee') || clean.includes('unakku') || clean.includes('ungalukku') || rawText.includes('நீ') || rawText.includes('உங்களுக்கு')) &&
      (clean.includes('tamil') || rawText.includes('தமி')) &&
      (clean.includes('talk') || clean.includes('speak') || clean.includes('pesu') || clean.includes('pesa') || clean.includes('theriyum') || clean.includes('know') || clean.includes('puriyum') || rawText.includes('பேசு') || rawText.includes('தெரியும்'));

    if (isAskingIfAITalksTamil) {
      if (detectedLang === 'tamil' || rawText.includes('தமி')) {
        return {
          replyText: `ஆமாம், நிச்சயமாக! என்னால் தமிழில் பேசவும் உரையாடவும் முடியும். நீங்கள் தாராளமாக தமிழில் பேசலாம். இன்று எதைப் பற்றி பேச விரும்புகிறீர்கள்?`,
          detectedLanguage: 'tamil',
          tamilExplanation: `என்னால் தமிழில் பேசவும் முழுமையாகப் புரிந்துகொள்ளவும் முடியும்!`,
          suggestedResponses: [
            'இன்று எனக்கு மிகவும் களைப்பாக இருக்கிறது.',
            'திரைப்படங்கள் பற்றி பேசலாமா?',
            'எனக்கு ஆங்கிலம் பேச தயக்கமாக இருக்கிறது.'
          ]
        };
      }

      if (clean.includes('nee') || clean.includes('unakku') || clean.includes('pesuviya') || clean.includes('pesa mudiyuma')) {
        return {
          replyText: `Aama, kandippa! Naan Tamil-la pesuven. Nee enna venumnaalum Tamil-la pesalaam. Enna pathi pesa porom?`,
          detectedLanguage: 'mixed',
          tamilExplanation: `ஆமாம், கண்டிப்பாக! எனக்கு தமிழ் நன்றாகப் புரியும், பேசவும் முடியும். நீங்கள் தாராளமாக தமிழில் பேசலாம். எதைப் பற்றி பேசலாம்?`,
          suggestedResponses: [
            'Innaiku office la romba work irundhuchu.',
            'Enakku English pesa romba bayama irukku.',
            'Can we talk about movies?'
          ]
        };
      }

      return {
        replyText: `Yes, absolutely! I can speak and understand Tamil, Tanglish, and English. You can speak in Tamil anytime. What would you like to talk about?`,
        detectedLanguage: 'english',
        tamilExplanation: `நிச்சயமாக! எனக்கு தமிழ் நன்றாகப் புரியும், பேசவும் முடியும். நீங்கள் தாராளமாக தமிழில் பேசலாம். எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Today I am very tired.',
          'Can we talk about movies?'
        ]
      };
    }

    // B. Tanglish capability questions: "can you understand tanglish?", "tanglish puriyuma"
    const isTanglishCapability =
      clean.includes('tanglish') &&
      (clean.includes('understand') ||
        clean.includes('puriyuma') ||
        clean.includes('theriyuma') ||
        clean.includes('pesalama') ||
        clean.includes('type') ||
        clean.includes('can you'));

    if (isTanglishCapability) {
      return {
        replyText: `Yes! You can type in Tanglish, Tamil, English, or mix them together. Just speak naturally. What would you like to talk about today?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆமாம்! Tanglish, தமிழ் அல்லது ஆங்கிலம் என எதில் வேண்டுமானாலும் பேசலாம். தயங்காமல் தொடங்குங்கள்!`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Can I improve my English in 3 months?',
          'Shall we practice introducing ourselves?'
        ]
      };
    }

    // C. User asking permission in Tanglish: "naan tamil la pesalama", "tamil-la pesalama"
    const isTanglishTamilQuestion =
      (clean.includes('tamil') || rawText.includes('தமிழ்')) &&
      (clean.includes('pesalama') ||
        clean.includes('pesalaama') ||
        clean.includes('pesalam') ||
        clean.includes('pesa mudiyuma') ||
        clean.includes('pesuvoma'));

    if (isTanglishTamilQuestion) {
      return {
        replyText: `Aama, kandippa! Tamil-la comfortable-ah pesalaam. Unakku enna pesa thonudho sollu. We can practise English slowly whenever you're ready!`,
        detectedLanguage: 'mixed',
        tamilExplanation: `ஆமாம், கண்டிப்பாக! தமிழில் தாராளமாகப் பேசலாம். உங்களுக்கு என்ன பேசத் தோன்றுகிறதோ தயங்காமல் சொல்லுங்கள்.`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Enakku English pesa romba bayama irukku.',
          'Interview-la self intro epdi sollanum?'
        ]
      };
    }

    // D. User shorthand / imperfect grammar: "can talk tamil", "can speak tamil", "tamil ok"
    const isShorthandTamil =
      clean === 'can talk tamil' ||
      clean === 'can speak tamil' ||
      clean === 'can talk in tamil' ||
      clean === 'i can talk tamil' ||
      clean === 'i can speak tamil' ||
      clean === 'can we talk tamil' ||
      clean === 'can i talk tamil' ||
      clean === 'tamil can talk' ||
      clean === 'tamil ok' ||
      clean === 'tamil okay' ||
      clean === 'tamil ok va' ||
      clean === 'tamil okva';

    if (isShorthandTamil) {
      return {
        replyText: `Of course! You can talk to me in Tamil, Tanglish, or English. No need to worry. What would you like to talk about?`,
        detectedLanguage: 'english',
        tamilExplanation: `கண்டிப்பாக! என்னிடம் தமிழ், Tanglish அல்லது ஆங்கிலம் என எதில் வேண்டுமானாலும் பேசலாம். கவலைப்படத் தேவையில்லை. எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Can I improve my English in 3 months?',
          'Shall we talk?'
        ]
      };
    }

    // E. User asking permission in English: "Shall I talk in Tamil?", "shall i talk tamil", "Can I speak Tamil?"
    const isEnglishLanguageQuestion =
      (clean.includes('talk') || clean.includes('speak') || clean.includes('chat') || clean.includes('use')) &&
      clean.includes('tamil') &&
      (clean.includes('shall') || clean.includes('can i') || clean.includes('may i') || clean.includes('i '));

    if (isEnglishLanguageQuestion) {
      return {
        replyText: `Yes, absolutely! You can speak in Tamil. I'll understand you and help you express your thoughts in English step by step. What would you like to talk about?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆம், நிச்சயமாக! நீங்கள் தமிழில் பேசலாம். நான் உங்களைப் புரிந்து கொண்டு, உங்கள் எண்ணங்களை ஆங்கிலத்தில் மெதுவாக வெளிப்படுத்த உதவுவேன். எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Can I improve my English in 3 months?',
          'Today I am very tired.'
        ]
      };
    }

    // F. General understanding check: "naan enna sonnalum unakku puriyudha?"
    const isGeneralUnderstandingCheck =
      (clean.includes('puriyudha') && (clean.includes('naan') || clean.includes('enakku') || clean.includes('sonnalum'))) ||
      clean.includes('do you understand me') ||
      clean.includes('can you understand me') ||
      clean.includes('puriyudha unakku');

    if (isGeneralUnderstandingCheck) {
      return {
        replyText: `Aama, kandippa puriyudhu! I understand you clearly whether you type or speak in Tamil, Tanglish, or English. You can speak freely without worrying about mistakes. What would you like to talk about today?`,
        detectedLanguage: 'mixed',
        tamilExplanation: `ஆமாம், நீங்கள் சொல்வது எனக்கு தெளிவாகப் புரிகிறது! தமிழ், Tanglish, ஆங்கிலம் என எதில் வேண்டுமானாலும் பேசலாம். தயங்காமல் தொடங்குங்கள்!`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Teach me how to introduce myself in an interview.',
          'I want to speak in English without hesitation.'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 2. Clarification & Confusion Handler (Supports "daw", "ithu", "purila")
  // ---------------------------------------------------------------------------
  private handleClarificationAndConfusion(
    lower: string,
    clean: string,
    rawText: string,
    context: ConversationContext,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    const isConfused =
      clean.includes('puriyala') ||
      clean.includes('purila') ||
      clean.includes('enna da solra') ||
      clean.includes('enna daw solra') ||
      clean.includes('enna solra') ||
      clean.includes('enna solreenga') ||
      clean.includes('enna da ithu') ||
      clean.includes('enna daw ithu') ||
      clean.includes('puriyave illa') ||
      clean.includes("didn't understand") ||
      clean.includes("did not understand") ||
      clean.includes("i don't understand") ||
      clean.includes("what do you mean") ||
      clean.includes("not clear") ||
      clean.includes("don't understand");

    if (!isConfused) return null;

    // Handle "enna daw ithu" / "enna da ithu" (What is this?)
    if (clean === 'enna daw ithu' || clean === 'enna da ithu' || clean.includes('enna daw ithu') || clean.includes('enna da ithu')) {
      return {
        replyText: `Idhu PESU, ungalukku Tamil and English-la practice panna oru friendly partner! Enna purila nu sollunga, simple-ah explain panren.`,
        detectedLanguage: 'mixed',
        tamilExplanation: `இது PESU — உங்களுடன் தமிழ் மற்றும் ஆங்கிலத்தில் உரையாட உதவும் தோழன்! எது புரியவில்லை என்று சொல்லுங்கள், எளிய முறையில் விளக்குகிறேன்.`,
        suggestedResponses: [
          'Now I understand!',
          'Can we talk about movies?',
          'How does this app help me practice English?'
        ]
      };
    }

    const lastMsg = context.lastAssistantMessage;
    if (lastMsg) {
      const explanation = this.buildContextualClarification(lastMsg.content, clean.includes('daw') || clean.includes('da '));
      return {
        replyText: explanation.replyText,
        detectedLanguage: 'mixed',
        tamilExplanation: explanation.tamilExplanation,
        suggestedResponses: [
          'Now I understand, thank you!',
          'Let me try replying now.',
          'Can we practice another sentence?'
        ]
      };
    }

    return {
      replyText: `Ayyoo, sorry! 😊 Enna puriyala nu sollunga, I will explain it in simple Tamil and easy English. What would you like to know?`,
      detectedLanguage: 'mixed',
      tamilExplanation: `எந்த இடம் புரியவில்லை என்று சொல்லுங்கள், தமிழில் எளிமையாக விளக்குகிறேன்.`
    };
  }

  private buildContextualClarification(content: string, isCasualSlang: boolean): { replyText: string; simpleEnglish: string; tamilExplanation: string } {
    const lower = content.toLowerCase();

    // Context: "experience" / "tell me a little more about your experience"
    if (lower.includes('experience') || lower.includes('tell me a little more') || lower.includes('about your experience')) {
      return {
        replyText: `Ayyoo, sorry! 😊 Naan simple-ah solren. Un experience pathi konjam sollu nu ketten. For example, office-la inniku enna nadandhuchu?`,
        simpleEnglish: `I was asking about your experience. For example, what happened at the office today?`,
        tamilExplanation: `மன்னிக்கவும்! நான் உங்கள் அனுபவம் பற்றி கொஞ்சம் சொல்லுங்கள் என்று கேட்டேன். உதாரணமாக, இன்று அலுவலகத்தில் என்ன நடந்தது என்று சொல்லலாம்.`
      };
    }

    if (lower.includes('office') || lower.includes('work') || lower.includes('busy') || lower.includes('tired')) {
      const prefix = isCasualSlang ? `Sorry daw! Simple-ah solren.` : `Ayyoo, sorry! 😊 Naan simple-ah solren.`;
      return {
        replyText: `${prefix} Un office day eppadi irundhuchu nu ketten. For example, office-la inniku enna nadandhuchu?`,
        simpleEnglish: `I was asking about your workday. How was your day at the office?`,
        tamilExplanation: `மன்னிக்கவும்! உங்கள் அலுவலக நாள் எப்படி இருந்தது, என்ன வேலை நடந்தது என்று கேட்டேன்.`
      };
    }

    if (lower.includes('went') && lower.includes('gone')) {
      const prefix = isCasualSlang ? `Sorry daw! Simple-ah solren.` : `Ayyoo, sorry! 😊 Simple-ah solren:`;
      return {
        replyText: `${prefix} 'Went' தனியாக கடந்த காலத்திற்கு வரும்: "I went to office" (நான் அலுவலகம் சென்றேன்). 'Gone' எப்போதும் has/have உடன் மட்டுமே வரும்: "He has gone".`,
        simpleEnglish: `'Went' is used alone for past: "I went to the office." 'Gone' is always used with has/have: "He has gone to the office."`,
        tamilExplanation: `'Went' தனியாக கடந்த காலத்திற்கு வரும். 'Gone' எப்போதும் have/has உடன் மட்டுமே வரும்.`
      };
    }

    if (lower.includes('movie') || lower.includes('cinema')) {
      const prefix = isCasualSlang ? `Sorry daw! Simple-ah solren.` : `Ayyoo, let me make it simple:`;
      return {
        replyText: `${prefix} Naan unakku pidicha cinema pathi ketten. Which movie have you watched recently?`,
        simpleEnglish: `I was asking about your favorite movies. Which movie did you watch recently?`,
        tamilExplanation: `நான் உங்களுக்கு பிடித்த சினிமா பற்றி கேட்டேன்: சமீபத்தில் என்ன படம் பார்த்தீர்கள்?`
      };
    }

    if (lower.includes('friend') || lower.includes('misunderstanding') || lower.includes('fight')) {
      const prefix = isCasualSlang ? `Sorry daw! Simple-ah solren.` : `Let me explain simply:`;
      return {
        replyText: `${prefix} Friend kooda sanda vandha konjam calm-ah pesina seriyagidum nu sonnen. What happened?`,
        simpleEnglish: `I was saying that misunderstandings with friends happen, and talking calmly helps resolve it.`,
        tamilExplanation: `நண்பர்களிடம் ஏற்படும் தவறான புரிதல்கள் இயல்பானவை; சற்று நேரம் கொடுத்து அமைதியாகப் பேசினால் சரியாகிவிடும் என்று சொன்னேன்.`
      };
    }

    if (lower.includes('interview') || lower.includes('self-introduction') || lower.includes('name is')) {
      const prefix = isCasualSlang ? `Sorry daw! Simple-ah solren.` : `Here it is simply:`;
      return {
        replyText: `${prefix} Interview-la un name, background, and strength epdi sollanum nu sonnen. Try saying: "My name is [your name]."`,
        simpleEnglish: `I was explaining how to introduce yourself: Say your name, where you are from, and your role.`,
        tamilExplanation: `சுய அறிமுகம் எப்படி செய்ய வேண்டும் என்று சொன்னேன்: பெயர், ஊர், மற்றும் படிப்பு/வேலை ஆகியவற்றை சொல்லுங்கள்.`
      };
    }

    const prefix = isCasualSlang ? `Sorry daw! Simple-ah solren.` : `Ayyoo, sorry! 😊`;
    return {
      replyText: `${prefix} Namma casual-ah pesi English practice pannalam nu sonnen. What would you like to talk about?`,
      simpleEnglish: `I was saying we can chat casually and practice step by step without worrying about mistakes.`,
      tamilExplanation: `சுருக்கமாக: தவறுகளைப் பற்றி கவலைப்படாமல் மெதுவாக பேசிப் பழகலாம் என்று குறிப்பிட்டேன்.`
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Explain in Tamil Handler
  // ---------------------------------------------------------------------------
  private handleExplainInTamil(context: ConversationContext, detectedLang: DetectedLanguage): AIResponsePayload {
    const lastMsg = context.lastAssistantMessage;
    if (lastMsg) {
      const explanation = this.buildContextualClarification(lastMsg.content, false);
      return {
        replyText: `Kandippa! ${explanation.tamilExplanation}`,
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
      const explanation = this.buildContextualClarification(lastMsg.content, false);
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
  // 5. Contextual Follow-up, Pronouns & Anaphora ("Why?", "Yes, too much work")
  // ---------------------------------------------------------------------------
  private handleContextualFollowUp(
    lower: string,
    clean: string,
    rawText: string,
    context: ConversationContext,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    const lastMsgText = context.lastAssistantMessage?.content.toLowerCase() || '';

    // A. "Yes, too much work" / "too much work" / "romba work"
    if (
      (clean.includes('too much work') || clean.includes('lot of work') || clean.includes('busy work') || clean === 'yes' || clean.startsWith('yes ') || clean.startsWith('yeah ')) &&
      (lastMsgText.includes('was work busy') || lastMsgText.includes('long day') || lastMsgText.includes('tiring day') || context.activeTopic === 'tired_workday')
    ) {
      return {
        replyText: `I get that! A busy workday can be exhausting. What kept you busy today?`,
        detectedLanguage: 'english',
        tamilExplanation: `அலுவலகத்தில் அதிக வேலை இருந்ததை ஆங்கிலத்தில்: "I had a lot of work at the office today" அல்லது "It was a hectic day at work" என்று கூறலாம்.`,
        suggestedResponses: [
          'I had back-to-back meetings.',
          'I was fixing urgent bugs.',
          'Now I am finally relaxing.'
        ]
      };
    }

    // B. "Why?" / "Why so?" / "Why did that happen?"
    if (
      clean === 'why' ||
      clean === 'why so' ||
      clean.startsWith('why ') ||
      clean === 'yen' ||
      clean === 'yean' ||
      clean === 'edhukku'
    ) {
      if (lastMsgText.includes('went') || lastMsgText.includes('gone') || lastMsgText.includes('past')) {
        return {
          replyText: `Because 'went' is the simple past form of 'go'. Whenever an action already happened in the past (like yesterday), English uses the past tense without helper verbs!`,
          detectedLanguage: 'english',
          tamilExplanation: `காரணம்: 'went' என்பது 'go'-வின் கடந்த கால வடிவம். நேற்று நடந்த விஷயங்களை விவரிக்கும்போது 'went' தான் பயன்படுத்த வேண்டும்.`,
          suggestedResponses: [
            'Give me another example.',
            'What about other verbs like eat and ate?',
            'Got it, thank you!'
          ]
        };
      }

      if (lastMsgText.includes('rest') || lastMsgText.includes('tired') || lastMsgText.includes('exhausting')) {
        return {
          replyText: `Because taking a proper rest helps your brain and body recharge! Working continuously without breaks leads to burnout. Did you have dinner yet?`,
          detectedLanguage: 'english',
          tamilExplanation: `ஏனெனில் நல்ல ஓய்வு உங்கள் உடலையும் மனதையும் புத்துணர்ச்சியாக்கும். இரவு உணவு சாப்பிட்டீர்களா?`,
          suggestedResponses: [
            'Yes, I had dinner.',
            'Not yet, going to eat now.',
            'I will rest soon.'
          ]
        };
      }

      if (lastMsgText.includes('misunderstanding') || lastMsgText.includes('friend')) {
        return {
          replyText: `Because miscommunications often happen when people react quickly before understanding the full situation. A calm, direct conversation usually clears up the confusion.`,
          detectedLanguage: 'english',
          tamilExplanation: `காரணம்: அவசரமாக எதிர்வினையாற்றுவதால் பல தவறான புரிதல்கள் ஏற்படுகின்றன. அமைதியாகப் பேசினால் தீர்வு கிடைக்கும்.`,
          suggestedResponses: [
            'That makes sense.',
            'What should I say to him?',
            'I will talk to him tomorrow.'
          ]
        };
      }

      if (lastMsgText.includes('photosynthesis') || lastMsgText.includes('oxygen')) {
        return {
          replyText: `Because plants need energy to grow! Sunlight powers the chemical reaction that converts water and carbon dioxide into glucose, which is their food.`,
          detectedLanguage: 'english',
          tamilExplanation: `தாவரங்கள் வளர்வதற்கு ஆற்றல் தேவைப்படுவதால், சூரிய ஒளியைப் பயன்படுத்தி உணவு தயாரிக்கின்றன.`
        };
      }

      return {
        replyText: `That's a thoughtful question! Asking 'why' helps us understand the situation more deeply. What do you think is the reason?`,
        detectedLanguage: 'english',
        tamilExplanation: `நல்ல கேள்வி! 'ஏன்' என்று யோசிப்பது விஷயங்களை ஆழமாகப் புரிந்துகொள்ள உதவும்.`
      };
    }

    // C. "Really?" / "Really!" / "Appadiya"
    if (clean === 'really' || clean === 'appadiya' || clean === 'apdiya') {
      return {
        replyText: `Yes, really! It might sound surprising at first, but it is true. What part surprises you the most?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆம், உண்மையில்! உங்களுக்கு இதில் எது மிகவும் ஆச்சரியமாக இருக்கிறது?`
      };
    }

    // D. "He misunderstood me" / "She misunderstood me"
    if (
      (clean.includes('misunderstood') || clean.includes('misunderstand') || clean.includes('purinjukala') || clean.includes('thappa purinjikitanga')) &&
      (clean.includes('he') || clean.includes('she') || clean.includes('they') || context.activeTopic === 'friend_conflict')
    ) {
      const person = clean.includes('she') ? 'she' : 'he';
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

    // E. "What should I do now?" / "What can I do?"
    if (
      clean.includes('what should i do') ||
      clean.includes('what can i do') ||
      clean.includes('what to do now') ||
      clean.includes('what do i do') ||
      clean.includes('enna panradhu ippo') ||
      clean.includes('enna seiyalam')
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

      if (context.activeTopic === 'workplace' || context.activeTopic === 'tired_workday') {
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
  // 6. Direct Questions Handler (Name, Photosynthesis, Learning, Interview, Grammar)
  // ---------------------------------------------------------------------------
  private handleDirectQuestions(
    lower: string,
    clean: string,
    rawText: string,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // A. "What is your name?" / "Who are you?" / "unakku peru enna"
    if (
      clean.includes('your name') ||
      clean.includes('whats your name') ||
      clean.includes('who are you') ||
      clean.includes('who are u') ||
      clean.includes('unakku peru enna') ||
      clean.includes('un peyar enna') ||
      clean.includes('unga name enna')
    ) {
      return {
        replyText: `I'm PESU, your Tamil and English speaking partner! What should I call you?`,
        detectedLanguage: 'english',
        tamilExplanation: `என் பெயர் PESU! நான் உங்களுடன் தமிழ் மற்றும் ஆங்கிலத்தில் உரையாட உதவும் தோழன். நான் உங்களை எப்படி அழைக்கலாம்?`,
        suggestedResponses: [
          'My name is Karthik.',
          'You can call me Priya.',
          'Nice to meet you, PESU!'
        ]
      };
    }

    // B. "Can you explain photosynthesis?"
    if (clean.includes('photosynthesis')) {
      return {
        replyText: `Photosynthesis is the process plants use to make their own food! Plants absorb sunlight, water from the soil, and carbon dioxide from the air. Using sunlight's energy, they produce glucose (sugar) for food, and release fresh oxygen into the air for us to breathe.\n\n💡 Simple equation: Sunlight + Water + Carbon Dioxide ➔ Glucose + Oxygen.`,
        detectedLanguage: 'english',
        tamilExplanation: `ஒளிச்சேர்க்கை (Photosynthesis) என்பது தாவரங்கள் சூரிய ஒளி, நீர் மற்றும் கார்பன் டை ஆக்சைடைப் பயன்படுத்தி தனக்கான உணவைத் தயாரித்து, நமக்குத் தேவையான ஆக்ஸிஜனை வெளியிடும் இயற்கை நிகழ்வாகும்.`,
        suggestedResponses: [
          'Why do plants release oxygen?',
          'What happens at night without sunlight?',
          'That was very clearly explained!'
        ]
      };
    }

    // C. "Can I improve my English in 3 months?"
    if (
      (clean.includes('three months') || clean.includes('3 months')) &&
      (clean.includes('improve') || clean.includes('learn') || clean.includes('fluent') || clean.includes('speak'))
    ) {
      return {
        replyText: `Yes, you can make noticeable progress in three months if you practise consistently. Start with short daily conversations, learn useful phrases, and gradually speak for longer. How much time can you practise each day?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆம், தினமும் தொடர்ந்து பேசிப் பழகினால் 3 மாதங்களில் உங்களால் குறிப்பிடத்தக்க முன்னேற்றம் அடைய முடியும்! குறுகிய தினசரி உரையாடல்கள், பயனுள்ள சொற்றொடர்களுடன் தொடங்குங்கள். தினமும் எவ்வளவு நேரம் பயிற்சி செய்ய முடியும்?`,
        suggestedResponses: [
          'I can practice 15 to 30 minutes every day.',
          'What should I practice first?',
          'Let us practice a conversation right now.'
        ]
      };
    }

    // D. "How do I introduce myself in an interview?"
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

    // E. "What is the difference between 'went' and 'gone'?"
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

    // F. "Difference between see and watch"
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

    // G. "Difference between hear and listen"
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

    // H. "Difference between say and tell"
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

    // I. Professional leave request
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
  // 7. Topic Change Handler (Movies, Food, etc.)
  // ---------------------------------------------------------------------------
  private handleTopicChange(lower: string, clean: string, detectedLang: DetectedLanguage): AIResponsePayload | null {
    if (clean.includes('movie') || clean.includes('cinema') || clean.includes('padam') || clean.includes('film')) {
      return {
        replyText: `Absolutely! I love a good movie conversation. Which movie have you watched recently?`,
        detectedLanguage: 'english',
        tamilExplanation: `நிச்சயமாக! திரைப்படங்கள் பற்றி பேசுவதில் எனக்கு மிகவும் ஆர்வம். நீங்கள் சமீபத்தில் பார்த்த படம் எது?`,
        suggestedResponses: [
          'I watched a Tamil comedy movie.',
          'I watched an exciting thriller.',
          'Can you recommend a good movie?'
        ]
      };
    }

    if (clean.includes('food') || clean.includes('sappadu') || clean.includes('cooking') || clean.includes('biryani') || clean.includes('dosa')) {
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
      clean.includes('change topic') ||
      clean.includes('different topic') ||
      clean.includes('something else') ||
      clean.includes('veru ethavathu pesalam') ||
      clean.includes('topic mathalam')
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
  // 8. Emotional Sharing Handler (Tiredness, Workday, Bad Day, Fear)
  // ---------------------------------------------------------------------------
  private handleEmotionalSharing(
    lower: string,
    clean: string,
    rawText: string,
    detectedLang: DetectedLanguage
  ): AIResponsePayload | null {
    // A. "Today I am very tired" / "feeling tired" / "very tired"
    if (
      clean.includes('tired') ||
      clean.includes('exhausted') ||
      clean.includes('feeling sleepy') ||
      clean.includes('romba tired') ||
      clean.includes('tired ah irukku')
    ) {
      return {
        replyText: `Oh no! Sounds like you've had a long day. Was work busy today?`,
        detectedLanguage: 'english',
        tamilExplanation: `அச்சச்சோ! இன்று உங்களுக்கு நீண்ட, களைப்பான நாளாக இருந்திருக்கிறது போலிருக்கிறது. அலுவலகத்தில் வேலை அதிகமாக இருந்ததா?`,
        suggestedResponses: [
          'Yes, too much work.',
          'Yes, had back-to-back meetings.',
          'No, just didn\'t get enough sleep.'
        ]
      };
    }

    // B. Tanglish Workday updates ("Innaiku office la romba work irundhuchu", "Nethu office la romba work")
    if (
      (clean.includes('office') || clean.includes('work')) &&
      (clean.includes('romba work') ||
        clean.includes('irundhuchu') ||
        clean.includes('heavy work') ||
        clean.includes('lot of work') ||
        clean.includes('busy') ||
        clean.includes('hectic'))
    ) {
      if (clean.includes('nethu') || clean.includes('yesterday')) {
        return {
          replyText: `Aiyyo, romba busy-ah irundhirukku pola! What kind of work did you have yesterday?\n\nEnglish-la you could say: 'I had a lot of work at the office yesterday.'`,
          detectedLanguage: 'mixed',
          tamilExplanation: `நேற்று அலுவலகத்தில் வேலை பளு அதிகம் இருந்ததை ஆங்கிலத்தில்: "I had a lot of work at the office yesterday" என்று சொல்லலாம்.`,
          suggestedResponses: [
            'I had client presentations.',
            'I was fixing urgent bugs.',
            'Now I am finally relaxed.'
          ]
        };
      }

      return {
        replyText: `Ohh, inniku office-la romba busy-ah? What work kept you busy today?\n\nEnglish-la you could say: 'I had a lot of work at the office today.'`,
        detectedLanguage: 'mixed',
        tamilExplanation: `அலுவலகத்தில் அதிக வேலை இருந்ததை ஆங்கிலத்தில்: "I had a lot of work at the office today" என்று கூறலாம்.`,
        suggestedResponses: [
          'I had back-to-back meetings today.',
          'I was fixing urgent bugs.',
          'Now I am finally relaxed.'
        ]
      };
    }

    // C. "Today I had a bad day."
    if (
      clean.includes('bad day') ||
      clean.includes('terrible day') ||
      clean.includes('rough day') ||
      clean.includes('horrible day') ||
      clean.includes('sad day') ||
      clean.includes('boring day')
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

    // D. "I had a fight with my friend."
    if (
      (clean.includes('fight') || clean.includes('argument') || clean.includes('disagreement') || clean.includes('sanda')) &&
      (clean.includes('friend') || clean.includes('colleague') || clean.includes('roommate') || clean.includes('family'))
    ) {
      const person = clean.includes('colleague') ? 'colleague' : 'friend';
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

    // E. Hesitation / Fear of speaking English ("Enakku English pesa romba bayama irukku")
    if (
      clean.includes('bayama') ||
      clean.includes('thayakkama') ||
      clean.includes('fear') ||
      clean.includes('nervous') ||
      clean.includes('hesitat') ||
      clean.includes('scared')
    ) {
      return {
        replyText: `Puriyudhu. English pesa start pannumbodhu bayam irukkuradhu normal dhaan. Mistakes pathi worry pannadha. Namma simple-ah start pannalam. Tell me one thing about your day in English or Tanglish.`,
        detectedLanguage: detectedLang,
        tamilExplanation: `புரிகிறது. ஆங்கிலம் பேச தொடங்கும் போது பயம் இருப்பது இயல்பு தான். தவறுகள் பற்றி கவலைப்படாதீர்கள். நாம் எளிமையாக ஆரம்பிக்கலாம். உங்கள் நாள் பற்றி ஒரு விஷயம் சொல்லுங்கள்.`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Today I had a good day.',
          'Teach me one easy English sentence.'
        ]
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 9. Greetings & Initiation Handler ("Hi", "Shall we talk?")
  // ---------------------------------------------------------------------------
  private handleGreetingsAndInitiation(lower: string, clean: string, detectedLang: DetectedLanguage): AIResponsePayload | null {
    // Short casual "Hi" / "Hello" / "Hey" (Do not give a grammar lesson for a simple greeting)
    if (clean === 'hi' || clean === 'hello' || clean === 'hey' || clean === 'hi there') {
      return {
        replyText: `Hey! 😊 How are you doing today? How was your day?`,
        detectedLanguage: 'english',
        tamilExplanation: `வணக்கம்! இன்று எப்படி போகிறது? உங்கள் நாள் எப்படி இருந்தது?`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Today I am very tired.',
          'Shall we talk?'
        ]
      };
    }

    // "Shall we talk?" / "Can we talk?" / "Let's talk" (general)
    if (
      (clean === 'shall we talk' ||
        clean === 'can we talk' ||
        clean === 'let us talk' ||
        clean === "let's talk" ||
        clean === 'lets talk' ||
        clean === 'pesalama' ||
        clean === 'pesalaama' ||
        clean === 'start pannalama' ||
        clean === 'shall we start') &&
      !clean.includes('about') &&
      !clean.includes('topic')
    ) {
      return {
        replyText: `Of course! 😊 What would you like to talk about? We can chat about your day, work, friends, or anything on your mind.`,
        detectedLanguage: 'english',
        tamilExplanation: `கண்டிப்பாக! இன்று எதைப் பற்றி பேசலாம்? உங்கள் நாள், வேலை, நண்பர்கள் அல்லது உங்கள் மனதில் உள்ள எதைப் பற்றி வேண்டுமானாலும் பேசலாம்.`,
        suggestedResponses: [
          'Innaiku office la romba work irundhuchu.',
          'Can I improve my English in 3 months?',
          'Can we talk about movies?'
        ]
      };
    }

    // General greetings with name or time of day
    const greetings = ['vanakkam', 'வணக்கம்', 'good morning', 'good afternoon', 'good evening'];
    const isGreetingMatch = greetings.some(g => clean === g || clean.startsWith(`${g} `) || lower.startsWith(`${g} `));

    if (isGreetingMatch) {
      return {
        replyText: `Vanakkam! Hello there! Great to see you. How is your day going, and what would you like to talk about today?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `வணக்கம்! உங்களைச் சந்திப்பதில் மகிழ்ச்சி. இன்று உங்கள் நாள் எப்படி போகிறது? எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'Shall we talk?',
          'Innaiku office la romba work irundhuchu.',
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
      naturalAcknowledgement = `Oh, you went to the office yesterday! How was your day there?`;
    } else if (lower.includes('office') || lower.includes('work')) {
      naturalAcknowledgement = `Sounds like you were heading to work! How did things go?`;
    } else if (lower.includes('friend')) {
      naturalAcknowledgement = `Spending time with friends is great! What did you do together?`;
    } else if (lower.includes('doubt')) {
      naturalAcknowledgement = `Sure! Feel free to ask your question, and I'll be happy to help.`;
    }

    const tip = `Better English: "${grammarIssue.improved}"\nSimple explanation: ${grammarIssue.explanationInEnglish}`;

    return {
      replyText: `${naturalAcknowledgement}\n\n${tip}`,
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
  // 12. Smart, Honest Fallback (Never a repetitive generic template!)
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

    // If user asked a complex knowledge question in offline mode
    if (lower.startsWith('can you explain') || lower.startsWith('what is') || lower.startsWith('how does') || lower.includes('explain')) {
      return {
        replyText: `In offline mode, I focus on spoken English practice and everyday chats. For detailed explanations on technical and general knowledge topics, you can switch to Gemini AI in Settings! What everyday topic would you like to chat about?`,
        detectedLanguage: 'english',
        tamilExplanation: `ஆஃப்லைன் முறையில் அன்றாட ஆங்கிலப் பேச்சுப் பயிற்சிக்கு முன்னுரிமை அளிக்கிறேன். அறிவியல் மற்றும் தொழில்நுட்ப விளக்கங்களை அறிய Settings-ல் Gemini AI-யை இயக்கலாம்!`,
        suggestedResponses: [
          'Let us talk about daily office conversations.',
          'Can we practice an interview self-introduction?',
          'Tell me about your favorite movies.'
        ]
      };
    }

    // Honest clarifying question when intent is not clear — NO robotic coaching templates!
    return {
      replyText: `I didn't quite catch that. Could you tell me a little more, or rephrase that in simple English or Tamil so I can understand you better?`,
      detectedLanguage: detectedLang,
      tamilExplanation: `நீங்கள் சொன்னது எனக்கு முழுமையாகப் புரியவில்லை. நான் தெளிவாகப் புரிந்துகொள்ள சற்று எளிய தமிழில் அல்லது ஆங்கிலத்தில் மீண்டும் சொல்ல முடியுமா?`,
      suggestedResponses: [
        'Let me rephrase that.',
        'Shall we talk about movies?',
        'Can I speak Tamil?'
      ]
    };
  }

  private isConfirmation(text: string): boolean {
    const tokens = ['ok', 'okay', 'seri', 'sari', 'super', 'got it', 'fine', 'understood', 'cool', 'correct', 'purinjuthu', 'aama'];
    return tokens.includes(text) || tokens.some(t => text === t || text === `${t}!` || text === `${t}.`);
  }
}
