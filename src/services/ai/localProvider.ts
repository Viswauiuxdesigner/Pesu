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
    // Artificial small delay (200-400ms) for natural conversational feel
    await new Promise(res => setTimeout(res, 280));

    const trimmed = userText.trim();
    const detectedLang = detectLanguage(trimmed);
    const lower = trimmed.toLowerCase();

    // 1. Check if user is asking for Tamil explanation of the previous message
    if (isAskingForTamilExplanation(trimmed)) {
      const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMsg) {
        return {
          replyText: `Kandippa! Here is the explanation in Tamil for what I just said: "${lastAssistantMsg.content}"`,
          detectedLanguage: 'tamil',
          tamilExplanation: this.translateToTamilExplanation(lastAssistantMsg.content),
          suggestedResponses: [
            'Got it, thank you!',
            'Can we try another sentence?',
            'Let me try saying it now.'
          ]
        };
      }
      return {
        replyText: `Sure! I am happy to explain anything in Tamil whenever you need. What would you like me to clarify?`,
        detectedLanguage: 'english',
        tamilExplanation: `கண்டிப்பாக! உங்களுக்கு எப்போது சந்தேகம் வந்தாலும் தமிழில் விளக்குகிறேன். இப்போது எதைப் பற்றி தெரிந்து கொள்ள வேண்டும்?`
      };
    }

    // 2. Specific case from Prompt: "Enakku interview-la self introduction English-la solla theriyala"
    if (
      lower.includes('self introduction') || 
      (lower.includes('interview') && (lower.includes('theriyala') || lower.includes('epdi') || lower.includes('solla')))
    ) {
      return {
        replyText: `Don't worry at all! A simple, professional self-introduction can follow 3 easy steps:\n\n1. "Hello, my name is [Your Name]."\n2. "I am from [Your City], and I have a background in [Your Field/Degree]."\n3. "I am excited about this opportunity because I enjoy solving problems and learning new skills."\n\nTake a look at the Tamil explanation below. When you are ready, try speaking your own self-introduction!`,
        detectedLanguage: detectedLang,
        tamilExplanation: `கவலைப்படாதீர்கள்! நேர்காணலில் 3 எளிய வரிகளில் உங்களை அறிமுகப்படுத்தலாம்:\n1. பெயர்: "Hello, my name is..."\n2. ஊர் & கல்வி/அனுபவம்: "I am from Chennai, and I have a background in..."\n3. ஆர்வம்: "I am excited about this opportunity..."\n\nஇப்போது உங்கள் சொந்த வார்த்தைகளில் சொல்லி பாருங்கள்!`,
        pronunciationGuide: `ஹலோ, மை நேம் இஸ்... ஐ அம் ஃப்ரம்... ஐ அம் எக்சைட்டெட் அபௌட் திஸ் ஆப்பர்ச்சூனிட்டி...`,
        suggestedResponses: [
          'Hello, my name is Karthik and I am from Chennai.',
          'Can you give another simple template?',
          'What about my college project?'
        ]
      };
    }

    // 3. User expresses fear or hesitation: "enakku English pesa bayama irukku"
    if (
      lower.includes('bayama') || 
      lower.includes('thayakkama') || 
      lower.includes('hesitation') ||
      lower.includes('scared') ||
      lower.includes('fear')
    ) {
      return {
        replyText: `It is completely normal to feel nervous! Everyone feels hesitant when learning a new language. Remember: English is just a tool for communication, not a measure of your intelligence.\n\nStart with short, simple sentences. Don't worry about perfect grammar right now. How was your day today? Try telling me one simple thing you did today!`,
        detectedLanguage: detectedLang,
        tamilExplanation: `பயமோ தயக்கமோ இருப்பது முற்றிலும் இயல்பானது! ஆங்கிலம் என்பது ஒரு தகவல்தொடர்பு மொழி மட்டுமே, அறிவுக்கான அளவுகோல் அல்ல.\n\nதவறு செய்தாலும் பரவாயில்லை. சிறு சிறு வாக்கியங்களாக தொடங்குவோம். இன்று நீங்கள் செய்த ஒரு எளிய விஷயத்தை ஆங்கிலத்தில் சொல்லி பாருங்கள்!`,
        suggestedResponses: [
          'Today I went to work by bus.',
          'I had coffee with my colleague.',
          'I watched a movie yesterday.'
        ]
      };
    }

    // 4. User asks how to say something in English
    if (isAskingHowToSayInEnglish(trimmed)) {
      return this.handleHowToSayRequest(trimmed, detectedLang);
    }

    // 5. Check for grammar slips in English (e.g. "I am go to office yesterday")
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

    // 6. Scenario-specific roleplay handling
    const scenarioReply = this.handleScenarioDialogue(trimmed, options?.scenarioId, detectedLang);
    if (scenarioReply) {
      return scenarioReply;
    }

    // 7. General fallback conversational intelligence
    return this.handleGeneralConversation(trimmed, detectedLang, options?.alwaysShowTamilExplanation);
  }

  private handleHowToSayRequest(text: string, detectedLang: DetectedLanguage): AIResponsePayload {
    const lower = text.toLowerCase();

    if (lower.includes('leave') || lower.includes('விடுப்பு')) {
      return {
        replyText: `Here is a polite and professional way to ask for leave:\n\n"Dear Manager, I would like to request 2 days of casual leave on [Date] due to personal reasons. I will ensure all my urgent tasks are completed."`,
        detectedLanguage: detectedLang,
        tamilExplanation: `மேலாளரிடம் விடுப்பு கேட்கும்போது: "Dear Manager, I would like to request leave..." என தொடங்குவது பண்பான முறை. அவசர வேலைகளை முடித்துவிட்டதாக குறிப்பிடுவது பொறுப்புணர்வை காட்டும்.`,
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
        tamilExplanation: `மருத்துவரிடம் அப்பாயின்ட்மென்ட் பெற: "I would like to book an appointment with Dr..." என்று கேட்டுவிட்டு, "கிடைக்கும் நேரத்தை தெரிவிக்க முடியுமா?" (available time slots) என கேட்கலாம்.`,
        suggestedResponses: [
          'Can I reschedule an existing appointment?',
          'How to ask doctor consultation fee in English?'
        ]
      };
    }

    return {
      replyText: `To express that clearly in English, you can say:\n\n"Could you help me with this?" or adapt it to your specific situation.\n\nTry saying what you have in mind in Tamil or simple English words, and I will help you polish it!`,
      detectedLanguage: detectedLang,
      tamilExplanation: `நீங்கள் சொல்ல நினைக்கும் விஷயத்தை தமிழில் அல்லது தெரிந்த சிறு ஆங்கில சொற்களில் சொல்லுங்கள், நான் அதை மிகச்சரியான ஆங்கில வாக்கியமாக மாற்றி தருகிறேன்!`
    };
  }

  private generateNaturalReplyToMeaning(userText: string, scenarioId?: string): string {
    const lower = userText.toLowerCase();

    if (lower.includes('office') && lower.includes('yesterday')) {
      return `That's great! How did your workday go yesterday? Did you have any productive meetings or catch up on important tasks?`;
    }

    if (lower.includes('friend')) {
      return `Nice! Spending time with friends is always refreshing. What did you and your friends do?`;
    }

    if (lower.includes('work') || lower.includes('project')) {
      return `Good progress! Working consistently on your projects is key. What is the next milestone?`;
    }

    if (scenarioId === 'interview') {
      return `Thank you for sharing that background! That demonstrates good experience.`;
    }

    return `I understand what you meant! Great effort in expressing that thought in English.`;
  }

  private handleScenarioDialogue(
    text: string, 
    scenarioId?: string, 
    detectedLang?: DetectedLanguage
  ): AIResponsePayload | null {
    const lower = text.toLowerCase();

    if (scenarioId === 'interview') {
      if (lower.includes('karthik') || lower.includes('vignesh') || lower.includes('name is') || lower.includes('my name')) {
        return {
          replyText: `Nice to meet you! You introduced yourself clearly. As the next interview question: "What would you say is your greatest strength, and how does it help you in your daily work?"`,
          detectedLanguage: detectedLang || 'english',
          tamilExplanation: `அருமை! உங்கள் அறிமுகம் தெளிவாக இருந்தது. அடுத்த நேர்காணல் கேள்வி: "உங்கள் மிகப்பெரிய பலம் (strength) என்ன? அது உங்கள் வேலைக்கு எவ்வாறு உதவுகிறது?"`,
          suggestedResponses: [
            'My greatest strength is my problem-solving ability.',
            'I am a quick learner and work well in teams.',
            'I am very punctual and detail-oriented.'
          ]
        };
      }
    }

    if (scenarioId === 'office_meeting') {
      if (lower.includes('update') || lower.includes('working') || lower.includes('finished')) {
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
      if (lower.includes('menu') || lower.includes('special') || lower.includes('order')) {
        return {
          replyText: `Certainly! Today our chef special is Fresh Paneer Butter Masala with Butter Naan, and grilled herbal chicken. Would you prefer vegetarian or non-vegetarian options today?`,
          detectedLanguage: detectedLang || 'english',
          tamilExplanation: `நிச்சயமாக! இன்று ஸ்பெஷல் பன்னீர் பட்டர் மசாலா மற்றும் கிரில்ட் சிக்கன். நீங்கள் சைவம் விரும்புகிறீர்களா அல்லது அசைவமா?`,
          suggestedResponses: [
            'I prefer vegetarian dishes, please.',
            'I would like to try the chicken dish.',
            'Could you recommend something less spicy?'
          ]
        };
      }
    }

    if (scenarioId === 'phone_call') {
      if (lower.includes('breaking') || lower.includes('repeat')) {
        return {
          replyText: `I apologize for the connection! Let me repeat clearly: I was asking if tomorrow at 4:30 PM works for your appointment?`,
          detectedLanguage: detectedLang || 'english',
          tamilExplanation: `இணைப்பு குறைபாட்டிற்கு மன்னிக்கவும்! நாளை மாலை 4:30 மணிக்கு உங்கள் அப்பாயின்ட்மென்ட் வைத்துக்கொள்ளலாமா என்று கேட்டேன்.`
        };
      }
    }

    return null;
  }

  private handleGeneralConversation(
    text: string, 
    detectedLang: DetectedLanguage,
    alwaysTamil?: boolean
  ): AIResponsePayload {
    const lower = text.toLowerCase();

    // Tamil or Tanglish greetings
    if (lower.includes('vanakkam') || lower.includes('வணக்கம்') || lower.includes('hello') || lower.includes('hi')) {
      return {
        replyText: `Vanakkam! Wonderful to talk with you. I am ready for our English practice session. What topic would you like to explore today?`,
        detectedLanguage: detectedLang,
        tamilExplanation: `வணக்கம்! உங்களுடன் பேசுவதில் மகிழ்ச்சி. இன்று எந்த தலைப்பில் பேசலாம்? ஒரு எளிய வாக்கியத்தோடு தொடங்குங்கள்!`,
        suggestedResponses: [
          'Let us talk about my job and career goals.',
          'How can I improve my English fluency quickly?',
          'Let us practice a daily conversation.'
        ]
      };
    }

    // Default conversational partner response: engaging and simple
    return {
      replyText: `That is an interesting thought! You communicated your idea clearly. To keep our conversation going: Could you tell me a little more about why you feel that way, or give me an example from your experience?`,
      detectedLanguage: detectedLang,
      tamilExplanation: alwaysTamil 
        ? `உங்கள் கருத்தை அருமையாக வெளிப்படுத்தினீர்கள்! உரையாடலை தொடர: "உங்கள் அனுபவத்திலிருந்து ஒரு உதாரணம் கூற முடியுமா?" என்று கேட்டுள்ளேன்.`
        : undefined,
      suggestedResponses: [
        'Sure, let me give you an example.',
        'I felt this way because of my past experience.',
        'Can you give me your opinion on this first?'
      ]
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
    return `இதன் விளக்கம்: "${englishText}" என்ற வாக்கியம் எளிய ஆங்கிலத்தில் உங்கள் கருத்தை வெளிப்படுத்த உதவும் உரையாடல் வரியாகும்.`;
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

    // Add standard useful phrases if few were collected
    if (phrasesLearned.length === 0) {
      phrasesLearned.push('I went to the office yesterday.');
      phrasesLearned.push('Could you please explain that in simple terms?');
      phrasesLearned.push('My name is... and I have a background in...');
    }

    const durationMinutes = Math.max(
      1, 
      Math.round((Date.now() - (messages[0]?.timestamp || Date.now())) / 60000)
    );

    // Compute friendly confidence score
    const baseScore = 70;
    const bonus = Math.min(25, userMessages.length * 5);
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
