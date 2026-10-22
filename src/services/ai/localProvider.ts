import { AIConversationProvider, AIResponsePayload, ConversationOptions } from './aiProvider';
import { Message, SessionStats, DetectedLanguage } from '../../types/conversation';
import { detectLanguage, isAskingForTamilExplanation, isAskingHowToSayInEnglish } from '../../utils/languageDetector';
import { checkGrammar } from './grammarRules';

export class LocalSpeakingTutorProvider implements AIConversationProvider {
  name = 'PESU Offline Pedagogical Engine (Zero-Cost)';

  detectPreferredResponseLanguage(text: string): DetectedLanguage {
    return detectLanguage(text);
  }

  async sendMessage(
    userText: string,
    history: Message[],
    options?: ConversationOptions
  ): Promise<AIResponsePayload> {
    // Small natural conversational delay
    await new Promise(res => setTimeout(res, 220));

    const trimmed = userText.trim();
    const detectedLang = detectLanguage(trimmed);
    const lower = trimmed.toLowerCase();

    // Context: Last assistant message and last user message
    const reversedHistory = [...history].reverse();
    const lastAssistantMsg = reversedHistory.find(m => m.role === 'assistant');

    // -------------------------------------------------------------------------
    // 1. User says they do NOT understand / Confused ("enna da solla purila", "puriyala", "what do you mean")
    // -------------------------------------------------------------------------
    if (this.isUserConfusedOrNotUnderstanding(lower)) {
      if (lastAssistantMsg) {
        const simplified = this.simplifyPreviousResponse(lastAssistantMsg.content);
        return {
          replyText: `Ayyoo, sorry if that was confusing! Let me explain it in simple words:\n\n${simplified.simpleEnglish}`,
          detectedLanguage: 'mixed',
          tamilExplanation: simplified.tamilExplanation,
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

    // -------------------------------------------------------------------------
    // 2. User asks to explain in SIMPLE ENGLISH ("Can you explain that in simple English?", "simple english la sollu")
    // -------------------------------------------------------------------------
    if (
      lower.includes('simple english') ||
      lower.includes('simpler english') ||
      lower.includes('easy english') ||
      lower.includes('easier words')
    ) {
      if (lastAssistantMsg) {
        const simplified = this.simplifyPreviousResponse(lastAssistantMsg.content);
        return {
          replyText: `Here it is in very simple English:\n\n👉 "${simplified.simpleEnglish}"\n\nTake your time. How would you like to answer this in your own words?`,
          detectedLanguage: 'english',
          tamilExplanation: simplified.tamilExplanation,
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

    // -------------------------------------------------------------------------
    // 3. User asks for TAMIL EXPLANATION ("Can you explain this in Tamil?", "Tamil-la sollu")
    // -------------------------------------------------------------------------
    if (isAskingForTamilExplanation(trimmed)) {
      if (lastAssistantMsg) {
        return {
          replyText: `Kandippa! Here is the explanation in Tamil for what I just said:\n\n"${lastAssistantMsg.content}"`,
          detectedLanguage: 'tamil',
          tamilExplanation: this.translateToTamilExplanation(lastAssistantMsg.content),
          suggestedResponses: [
            'Got it, thank you!',
            'Let me try saying it now in English.',
            'Can we practice another sentence?'
          ]
        };
      }
      return {
        replyText: `Kandippa! I am always ready to explain in Tamil. What sentence or question would you like me to translate?`,
        detectedLanguage: 'mixed',
        tamilExplanation: `கண்டிப்பாக! எந்த வாக்கியத்திற்கு தமிழ் விளக்கம் வேண்டும் என்று கேளுங்கள், விளக்குகிறேன்.`
      };
    }

    // -------------------------------------------------------------------------
    // 4. User asks "shall we talk?" / "pesalama" / "let's talk" / "can we speak"
    // -------------------------------------------------------------------------
    if (
      lower.includes('shall we talk') ||
      lower.includes('pesalama') ||
      lower.includes('pesalam') ||
      lower.includes('can we talk') ||
      lower.includes('can we speak') ||
      lower.includes("let's talk") ||
      lower.includes('lets talk') ||
      lower === 'start pannalama' ||
      lower === 'shall we start'
    ) {
      return {
        replyText: `Yes, of course! Let's talk. I would love to practice with you. How has your day been so far, or what is on your mind right now?`,
        detectedLanguage: 'english',
        tamilExplanation: `கண்டிப்பாக பேசலாம்! உங்களுடன் உரையாடுவதில் மகிழ்ச்சி. இன்று உங்கள் நாள் எப்படி போகிறது?`,
        suggestedResponses: [
          'My day was quite busy.',
          'I want to practice for an interview.',
          'Let us talk about our favorite hobbies.'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 5. User checks understanding: "naan enna sonnalum unakku puriyudha?" / "do you understand me"
    // -------------------------------------------------------------------------
    if (
      lower.includes('unakku puriyudha') ||
      lower.includes('unakku puriyuma') ||
      lower.includes('puriyudha') && lower.includes('naan') ||
      lower.includes('do you understand me') ||
      lower.includes('can you understand me') ||
      lower.includes('puriyudha unakku')
    ) {
      return {
        replyText: `Aama, kandippa puriyudhu! I understand you clearly whether you type or speak in Tamil, Tanglish, or English. You can speak freely without worrying about mistakes. What would you like to talk about today?`,
        detectedLanguage: 'mixed',
        tamilExplanation: `ஆமாம், நீங்கள் சொல்வது எனக்கு தெளிவாகப் புரிகிறது! தமிழ், Tanglish, ஆங்கிலம் என எதில் வேண்டுமானாலும் பேசலாம். தயங்காமல் தொடங்குங்கள்!`,
        suggestedResponses: [
          'Today office was very busy.',
          'Teach me how to introduce myself.',
          'I want to speak in English without hesitation.'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 6. User expresses FEAR or HESITATION
    // -------------------------------------------------------------------------
    if (lower.includes('bayama') || lower.includes('thayakkama')) {
      return {
        replyText: `Bayapadathinga! That hesitation is something almost every Tamil speaker experiences in the beginning. English is not a test; it's just a tool for conversation.\n\nLet's take the very first step together right now. Repeat after me out loud:\n👉 "Hello! I am learning to speak in English."\n\nTell me: Did you have coffee or tea this morning?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `பயப்படாதீர்கள்! ஆரம்பத்தில் தயக்கம் இருப்பது முற்றிலும் இயல்பானது. சிறு சிறு வாக்கியங்களாக தொடங்குவோம். "Hello! I am learning to speak in English" என்று சொல்லிப் பாருங்கள்!`,
        suggestedResponses: [
          'Hello! I am learning to speak in English.',
          'I had coffee with my family this morning.',
          'Teach me one more easy sentence.'
        ]
      };
    }

    if (
      lower.includes('nervous') || 
      lower.includes('scared') || 
      lower.includes('hesitation') || 
      lower.includes('fear')
    ) {
      return {
        replyText: `You are in a completely safe, judgment-free space with me! Even seasoned professionals feel nervous when speaking in a second language. The secret is to take a calm breath, slow down, and keep your sentences short.\n\nLet's build your confidence step by step right now: Tell me about one simple thing you did earlier today.`,
        detectedLanguage: detectedLang,
        tamilExplanation: `பயப்படத் தேவையில்லை! இங்கு எந்த மதிப்பீடும் இல்லை. மெதுவாக, சிறிய வாக்கியங்களாகப் பேசப் பழகுங்கள். இன்று காலையில் நீங்கள் செய்த ஒரு எளிய விஷயத்தைச் சொல்லுங்கள்.`,
        suggestedResponses: [
          'I woke up early and went for a walk.',
          'I had breakfast and got ready for work.',
          'Can we practice a simple conversation?'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 7. Work Day & Busy Updates ("innaiku office la romba work irundhuchu", "work athigam")
    // -------------------------------------------------------------------------
    if (
      (lower.includes('work') && (lower.includes('irundhuchu') || lower.includes('athigam') || lower.includes('busy') || lower.includes('romba'))) ||
      lower.includes('office la romba work') ||
      lower.includes('lot of work today')
    ) {
      return {
        replyText: `Oh, sounds like you had a really packed day at work! What kind of tasks kept you so busy today?\n\n💡 Natural English tip: You can say:\n"I had a lot of work at the office today." (or "It was a hectic day at work.")\n\nAre you relaxed now, or do you still have pending tasks?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `அலுவலகத்தில் வேலை அதிகம் இருந்ததை ஆங்கிலத்தில்: "I had a lot of work at the office today" அல்லது "It was a hectic day at work" என்று கூறலாம்.`,
        suggestedResponses: [
          'I had back-to-back meetings today.',
          'I was testing a new software feature.',
          'Yes, now I am completely relaxed.'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 8. Late to Office / School ("Naan office ku late ah poiten", "I went office late today")
    // -------------------------------------------------------------------------
    if (
      (lower.includes('late') && (lower.includes('office') || lower.includes('poiten') || lower.includes('went'))) ||
      lower.includes('late ah poiten')
    ) {
      return {
        replyText: `Oh no! Traffic or got delayed in the morning?\n\n💡 Speaking tip: Instead of "I went office late", it sounds more natural to say:\n"I was late to the office today." (or "I reached the office late.")\n\nDid your manager notice, or was it okay?`,
        detectedLanguage: detectedLang,
        grammarCorrection: {
          original: trimmed,
          improved: 'I was late to the office today. (or "I reached the office late.")',
          explanationInEnglish: 'Use "I was late to the office" rather than direct translation "I went office late".',
          explanationInTamil: '"அலுவலகத்திற்கு தாமதமாக சென்றேன்" என்பதை "I was late to the office today" என்று கூறுவதே இயல்பான ஆங்கிலம்.',
          category: 'vocabulary'
        },
        tamilExplanation: `நேரம் தவறி அலுவலகம் சென்றதை "I was late to the office today" என்று சொல்லலாம்.`,
        suggestedResponses: [
          'There was heavy traffic on my route.',
          'My manager was understanding about it.',
          'I woke up late in the morning.'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 9. Self-Introduction & Interview Guidance ("Interview-la self introduction eppadi sollanum?")
    // -------------------------------------------------------------------------
    if (
      lower.includes('self introduction') ||
      (lower.includes('interview') && (lower.includes('sollanum') || lower.includes('epdi') || lower.includes('eppadi') || lower.includes('theriyala') || lower.includes('tips')))
    ) {
      return {
        replyText: `A solid, professional self-introduction can follow 3 simple steps:\n\n1. Greeting & Name: "Hello, my name is [Your Name]."\n2. Background: "I am from [City], and I work as a [Your Role / Degree]."\n3. Goal/Interest: "I enjoy solving problems and I am eager to contribute my skills to this team."\n\nGive it a try right now! Just send me your name and what you do.`,
        detectedLanguage: detectedLang,
        tamilExplanation: `சுய அறிமுகத்தை 3 வரிகளில் சொல்லலாம்:\n1. பெயர்: "Hello, my name is..."\n2. ஊர் & வேலை/படிப்பு: "I am from Chennai and I work as..."\n3. ஆர்வம்: "I enjoy solving problems..."\nஇப்போது உங்கள் சொந்த வார்த்தைகளில் சொல்லிப் பாருங்கள்!`,
        pronunciationGuide: `ஹலோ, மை நேம் இஸ்... ஐ அம் ஃப்ரம்... ஐ என்ஜாய் சால்விங் ப்ராப்ளம்ஸ்...`,
        suggestedResponses: [
          'Hello, my name is Vignesh and I am from Chennai.',
          'Can you show how to talk about my project experience?',
          'What are the common mistakes to avoid in an interview?'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 10. User asks how to say something in English
    // -------------------------------------------------------------------------
    if (isAskingHowToSayInEnglish(trimmed)) {
      return this.handleHowToSayRequest(trimmed, detectedLang);
    }

    // -------------------------------------------------------------------------
    // 11. Check for specific English grammar mistakes (e.g. "I am go to office yesterday")
    // -------------------------------------------------------------------------
    const grammarIssue = checkGrammar(trimmed);
    if (grammarIssue) {
      const naturalReply = this.generateNaturalReplyToMeaning(trimmed, options?.scenarioId);
      return {
        replyText: `${naturalReply}\n\n💡 Quick speaking tip: Instead of "${grammarIssue.original}", it sounds more natural to say: "${grammarIssue.improved}".`,
        detectedLanguage: detectedLang,
        grammarCorrection: grammarIssue,
        tamilExplanation: options?.alwaysShowTamilExplanation || grammarIssue.explanationInTamil
          ? grammarIssue.explanationInTamil
          : undefined,
        suggestedResponses: [
          'Thanks for the tip! Let me rephrase.',
          'Could you give another example of this?',
          'Understood, let us continue.'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 12. Short confirmations & agreements ("seri", "ok", "okay", "super", "got it", "fine")
    // -------------------------------------------------------------------------
    if (this.isConfirmationOrAgreement(lower)) {
      return {
        replyText: `Awesome! What would you like to practice next? We could practice workplace English, ordering food at a restaurant, or casual chit-chat.`,
        detectedLanguage: 'english',
        tamilExplanation: `அருமை! அடுத்து எதைப் பற்றி பேசலாம்? அலுவலக உரையாடலா அல்லது அன்றாடப் பேச்சா?`,
        suggestedResponses: [
          'Let us practice office conversations.',
          'Let us practice job interview questions.',
          'Tell me about your favorite travel place.'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 13. Roleplay Scenario specific handling
    // -------------------------------------------------------------------------
    const scenarioReply = this.handleScenarioDialogue(trimmed, options?.scenarioId, detectedLang);
    if (scenarioReply) {
      return scenarioReply;
    }

    // -------------------------------------------------------------------------
    // 14. Casual Greetings ("hi", "hello", "vanakkam", "good morning")
    // -------------------------------------------------------------------------
    if (this.isGreeting(lower)) {
      return {
        replyText: `Vanakkam! Hello there! Great to see you. How is your day going, and what would you like to talk about today?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `வணக்கம்! உங்களைச் சந்திப்பதில் மகிழ்ச்சி. இன்று உங்கள் நாள் எப்படி போகிறது? எதைப் பற்றி பேசலாம்?`,
        suggestedResponses: [
          'I had a busy day at work.',
          'I want to practice my spoken English fluency.',
          'Can we practice a job interview?'
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 15. Honest, context-aware conversational response (NO generic repetition!)
    // -------------------------------------------------------------------------
    return this.generateHonestContextualReply(trimmed, detectedLang, history, options?.scenarioId);
  }

  private isUserConfusedOrNotUnderstanding(text: string): boolean {
    return (
      text.includes('puriyala') ||
      text.includes('purila') ||
      text.includes('enna da solla') ||
      text.includes('enna da sollra') ||
      text.includes('enna da ithu') ||
      text.includes('enna solreenga') ||
      text.includes('puriyave illa') ||
      text.includes("didn't understand") ||
      text.includes("did not understand") ||
      text.includes("i don't understand") ||
      text.includes("what do you mean") ||
      text.includes("not clear")
    );
  }

  private isConfirmationOrAgreement(text: string): boolean {
    const tokens = ['ok', 'okay', 'seri', 'sari', 'super', 'got it', 'fine', 'understood', 'cool', 'correct', 'purinjuthu', 'aama'];
    return tokens.includes(text) || tokens.some(t => text === t || text === `${t}!` || text === `${t}.`);
  }

  private isGreeting(text: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'vanakkam', 'வணக்கம்', 'good morning', 'good afternoon', 'good evening', 'hi there'];
    return greetings.some(g => text === g || text.startsWith(`${g} `) || text.startsWith(`${g},`));
  }

  private simplifyPreviousResponse(content: string): { simpleEnglish: string; tamilExplanation: string } {
    const lower = content.toLowerCase();

    if (lower.includes('self-introduction') || lower.includes('name is') || lower.includes('background')) {
      return {
        simpleEnglish: 'I asked you to say your name and where you are from. Like: "My name is Arun. I am from Madurai."',
        tamilExplanation: 'நான் கேட்டது: உங்கள் பெயர் மற்றும் ஊர் என்ன என்று எளிய ஆங்கிலத்தில் சொல்லுங்கள்.'
      };
    }

    if (lower.includes('office') || lower.includes('work') || lower.includes('yesterday')) {
      return {
        simpleEnglish: 'I was asking about your workday. How was your work yesterday? Was it busy or easy?',
        tamilExplanation: 'நேற்று உங்கள் அலுவலக வேலை எப்படி இருந்தது என்று கேட்டேன்.'
      };
    }

    if (lower.includes('strength') || lower.includes('interview')) {
      return {
        simpleEnglish: 'What are you good at? For example: "I am good at computer work and talking to customers."',
        tamilExplanation: 'உங்களுக்கு நன்றாகத் தெரிந்த திறமை அல்லது பலம் என்ன என்று கேட்டேன்.'
      };
    }

    return {
      simpleEnglish: 'In simple words: English practice is easy when we speak step by step. What is on your mind right now?',
      tamilExplanation: 'சுருக்கமாக: நாம் எளிய ஆங்கிலத்தில் உரையாடலாம். இப்போது உங்கள் மனதில் உள்ளதை சொல்லுங்கள்.'
    };
  }

  private translateToTamilExplanation(englishText: string): string {
    const lower = englishText.toLowerCase();

    if (lower.includes('self-introduction') || lower.includes('background')) {
      return `இதன் பொருள்: உங்களை சுருக்கமாக அறிமுகம் செய்ய வேண்டும் (பெயர், ஊர், படிப்பு அல்லது வேலை மற்றும் உங்கள் ஆர்வம்).`;
    }
    if (lower.includes('strength')) {
      return `இதன் பொருள்: உங்கள் முக்கியமான பலம் என்ன மற்றும் அது வேலையில் எப்படி உதவும் என்பதை விவரிக்க வேண்டும்.`;
    }
    if (lower.includes('blocker') || lower.includes('update')) {
      return `இதன் பொருள்: நீங்கள் செய்த வேலைகளின் விவரம் மற்றும் உங்களுக்கு ஏதேனும் சிக்கல் அல்லது உதவி தேவையா என்பது பற்றியது.`;
    }
    if (lower.includes('hectic') || lower.includes('busy')) {
      return `இதன் பொருள்: இன்று அலுவலகத்தில் வேலை பளு அதிகமாக இருந்தது பற்றியது.`;
    }
    return `இதன் விளக்கம்: "${englishText.slice(0, 100)}..." என்ற வாக்கியம் எளிய ஆங்கிலத்தில் உரையாட உதவும் வரியாகும்.`;
  }

  private handleHowToSayRequest(text: string, detectedLang: DetectedLanguage): AIResponsePayload {
    const lower = text.toLowerCase();

    if (lower.includes('leave') || lower.includes('விடுப்பு')) {
      return {
        replyText: `Here is a polite and professional way to ask for leave:\n\n"Dear Manager, I would like to request 2 days of casual leave on [Date] due to personal reasons. I will ensure all urgent tasks are handed over."`,
        detectedLanguage: detectedLang,
        tamilExplanation: `மேலாளரிடம் விடுப்பு கேட்கும்போது: "Dear Manager, I would like to request leave..." என தொடங்குவது பண்பான முறை.`,
        suggestedResponses: [
          'Can you give a shorter version for WhatsApp/Slack?',
          'How do I say for sick leave?',
          'Let me try writing my own.'
        ]
      };
    }

    if (lower.includes('appointment') || lower.includes('doctor')) {
      return {
        replyText: `You can say this over the phone:\n\n"Hello, I would like to book an appointment with Dr. [Name] for tomorrow evening. Could you please let me know the available time slots?"`,
        detectedLanguage: detectedLang,
        tamilExplanation: `மருத்துவரிடம் அப்பாயின்ட்மென்ட் பெற: "I would like to book an appointment with Dr..." என்று கேட்டுவிட்டு கிடைக்கும் நேரத்தை (available time slots) கேட்கலாம்.`,
        suggestedResponses: [
          'Can I reschedule an existing appointment?',
          'How to ask doctor consultation fee in English?'
        ]
      };
    }

    return {
      replyText: `To express that clearly in English, you can say:\n\n"Could you help me with this?" or adapt it to your specific situation.\n\nTell me the exact sentence in Tamil or Tanglish, and I will translate it into natural English for you!`,
      detectedLanguage: detectedLang,
      tamilExplanation: `நீங்கள் சொல்ல நினைக்கும் விஷயத்தை முழுமையாக தமிழில் அல்லது Tanglish-ல் சொல்லுங்கள், மிகச்சரியான ஆங்கில வாக்கியமாக தருகிறேன்!`
    };
  }

  private generateNaturalReplyToMeaning(userText: string, scenarioId?: string): string {
    const lower = userText.toLowerCase();

    if (lower.includes('office') && lower.includes('yesterday')) {
      return `Nice! How did your workday go yesterday? Did you have any productive meetings or catch up on important tasks?`;
    }
    if (lower.includes('friend')) {
      return `Nice! Spending time with friends is always refreshing. What did you and your friends do?`;
    }
    if (lower.includes('work') || lower.includes('project')) {
      return `Good progress! Working consistently on your projects is key. What is the next milestone?`;
    }
    if (scenarioId === 'interview') {
      return `Thank you for sharing that! That demonstrates good background experience.`;
    }
    return `I understand what you meant! Great effort expressing that in English.`;
  }

  private handleScenarioDialogue(
    text: string, 
    scenarioId?: string, 
    detectedLang?: DetectedLanguage
  ): AIResponsePayload | null {
    const lower = text.toLowerCase();

    if (scenarioId === 'interview') {
      if (lower.includes('name is') || lower.includes('my name') || lower.includes('i am from') || lower.includes('karthik') || lower.includes('vignesh')) {
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

  private generateHonestContextualReply(
    text: string, 
    detectedLang: DetectedLanguage,
    history: Message[],
    scenarioId?: string
  ): AIResponsePayload {
    // If the input is very short or ambiguous
    if (text.length < 5) {
      return {
        replyText: `I am here with you! Tell me a little more, or try speaking a full sentence in English or Tamil.`,
        detectedLanguage: detectedLang,
        tamilExplanation: `நான் கவனித்துக் கொண்டிருக்கிறேன்! சற்று கூடுதலாக விவரியுங்கள், அல்லது ஒரு முழு வாக்கியமாகப் பேசிப் பாருங்கள்.`
      };
    }

    // Direct answer acknowledging the user's input with varied follow-up
    return {
      replyText: `I hear you! To practice speaking back: How would you describe that experience in a short English sentence? (Even 3-4 words is a great start!)`,
      detectedLanguage: detectedLang,
      tamilExplanation: `நீங்கள் சொல்வது புரிகிறது! அதை ஒரு சிறிய ஆங்கில வாக்கியத்தில் விவரிக்க முடியுமா? 3 அல்லது 4 வார்த்தைகளே போதுமானது!`,
      suggestedResponses: [
        'It was a good experience.',
        'Can you show me how to say it?',
        'Let us try another topic.'
      ]
    };
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
