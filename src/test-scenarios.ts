import { LocalSpeakingTutorProvider } from './services/ai/localProvider';
import { GeminiSpeakingProvider } from './services/ai/geminiProvider';
import { ConversationPipeline } from './services/ai/conversationPipeline';
import { Message } from './types/conversation';

// Helper to assert condition and log clearly
function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runComprehensiveTestSuite() {
  console.log('================================================================');
  console.log('       PESU (பேசு) ADVANCED CONVERSATION INTELLIGENCE SUITE      ');
  console.log('================================================================\n');

  const localProvider = new LocalSpeakingTutorProvider();
  const testReplies: { input: string; reply: string }[] = [];

  // ===========================================================================
  // TEST GROUP A: Language Preference & Capability Questions
  // ===========================================================================
  console.log('--- TEST GROUP A: Language Preference & Capability Questions ---');

  // A1: "Shall I talk Tamil?" (without "in")
  {
    const res = await localProvider.sendMessage('Shall I talk Tamil?', []);
    testReplies.push({ input: 'Shall I talk Tamil?', reply: res.replyText });
    console.log(`User: "Shall I talk Tamil?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('yes') || lower.includes('course') || lower.includes('comfortable') || lower.includes('speak in tamil'),
      'Shall I talk Tamil? directly says yes and invites user to continue'
    );
    assert(
      !lower.includes('describe that experience') && !lower.includes('short english sentence'),
      'Does NOT return generic canned English practice response'
    );
  }

  // A2: "Can you talk Tamil?" (AI capability question)
  {
    const res = await localProvider.sendMessage('Can you talk Tamil?', []);
    testReplies.push({ input: 'Can you talk Tamil?', reply: res.replyText });
    console.log(`\nUser: "Can you talk Tamil?"\nBot: ${res.replyText}`);
    const lower = (res.replyText + ' ' + (res.tamilExplanation || '')).toLowerCase();
    assert(
      lower.includes('aama') || lower.includes('pesuven') || lower.includes('speak and understand tamil') || lower.includes('கண்டிப்பாக'),
      'Can you talk Tamil? answers the language capability question warmly'
    );
  }

  // A3: "Can talk Tamil" (imperfect grammar shorthand)
  {
    const res = await localProvider.sendMessage('Can talk Tamil', []);
    testReplies.push({ input: 'Can talk Tamil', reply: res.replyText });
    console.log(`\nUser: "Can talk Tamil"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('talk in tamil') || lower.includes('speak in tamil') || lower.includes('practise english'),
      'Can talk Tamil understands intended meaning despite imperfect grammar'
    );
  }

  // A4: "Naan Tamil la pesalama?" (Tanglish permission)
  {
    const res = await localProvider.sendMessage('Naan Tamil la pesalama?', []);
    testReplies.push({ input: 'Naan Tamil la pesalama?', reply: res.replyText });
    console.log(`\nUser: "Naan Tamil la pesalama?"\nBot: ${res.replyText}`);
    const lower = (res.replyText + ' ' + (res.tamilExplanation || '')).toLowerCase();
    assert(
      lower.includes('aama') || lower.includes('kandippa') || lower.includes('comfortable') || lower.includes('தாராளமாக'),
      'Naan Tamil la pesalama? replies naturally in welcoming Tanglish/Tamil'
    );
  }

  // A5: "Can you understand Tanglish?"
  {
    const res = await localProvider.sendMessage('Can you understand Tanglish?', []);
    testReplies.push({ input: 'Can you understand Tanglish?', reply: res.replyText });
    console.log(`\nUser: "Can you understand Tanglish?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('yes') && (lower.includes('tanglish') || lower.includes('type in tanglish')),
      'Can you understand Tanglish? confirms Tanglish capability explicitly'
    );
  }

  // A6: Tamil Script: "நீ தமிழில் பேசுவாயா?"
  {
    const res = await localProvider.sendMessage('நீ தமிழில் பேசுவாயா?', []);
    testReplies.push({ input: 'நீ தமிழில் பேசுவாயா?', reply: res.replyText });
    console.log(`\nUser: "நீ தமிழில் பேசுவாயா?"\nBot: ${res.replyText}`);
    const lower = (res.replyText + ' ' + (res.tamilExplanation || '')).toLowerCase();
    assert(
      lower.includes('aama') || lower.includes('pesuven') || lower.includes('கண்டிப்பாக') || lower.includes('தமிழ்'),
      'Tamil script "நீ தமிழில் பேசுவாயா?" receives welcoming Tamil response'
    );
  }

  // A7: Tanglish: "nee tamil la pesa mudiyuma?"
  {
    const res = await localProvider.sendMessage('nee tamil la pesa mudiyuma?', []);
    testReplies.push({ input: 'nee tamil la pesa mudiyuma?', reply: res.replyText });
    console.log(`\nUser: "nee tamil la pesa mudiyuma?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('aama') || lower.includes('pesuven') || lower.includes('tamil'),
      'Tanglish "nee tamil la pesa mudiyuma?" receives natural affirmation'
    );
  }

  // ===========================================================================
  // TEST GROUP B: Casual Conversation & Multi-Turn Flow
  // ===========================================================================
  console.log('\n--- TEST GROUP B: Casual Conversation & Multi-Turn Flow ---');

  // B1: "Hi"
  {
    const res = await localProvider.sendMessage('Hi', []);
    testReplies.push({ input: 'Hi', reply: res.replyText });
    console.log(`User: "Hi"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('hey') || lower.includes('going') || lower.includes('vanakkam'),
      'Hi receives a friendly, non-robotic greeting'
    );
  }

  // B2: "Today I am very tired"
  let tiredAssistantReply = '';
  {
    const res = await localProvider.sendMessage('Today I am very tired', []);
    tiredAssistantReply = res.replyText;
    testReplies.push({ input: 'Today I am very tired', reply: res.replyText });
    console.log(`\nUser: "Today I am very tired"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('long day') || lower.includes('busy') || lower.includes('tiring day'),
      'Today I am very tired responds empathetically and asks if work was busy'
    );
  }

  // B3: Follow-up to tired: "Yes, too much work."
  {
    const history: Message[] = [
      { id: 'u1', role: 'user', content: 'Today I am very tired', timestamp: Date.now() - 10000 },
      { id: 'a1', role: 'assistant', content: tiredAssistantReply, timestamp: Date.now() - 5000 }
    ];
    const res = await localProvider.sendMessage('Yes, too much work.', history);
    testReplies.push({ input: 'Yes, too much work.', reply: res.replyText });
    console.log(`\nUser: "Yes, too much work."\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('busy workday') || lower.includes('exhausting') || lower.includes('busy today'),
      'Follow-up "Yes, too much work" progresses the conversation naturally without resetting'
    );
  }

  // B4: "Nethu office la romba work irundhuchu" (Tanglish yesterday workday)
  {
    const res = await localProvider.sendMessage('Nethu office la romba work irundhuchu', []);
    testReplies.push({ input: 'Nethu office la romba work irundhuchu', reply: res.replyText });
    console.log(`\nUser: "Nethu office la romba work irundhuchu"\nBot: ${res.replyText}`);
    const lower = (res.replyText + ' ' + (res.tamilExplanation || '')).toLowerCase();
    assert(
      lower.includes('busy') || lower.includes('yesterday') || lower.includes('work'),
      'Nethu office la romba work irundhuchu recognises user workday update with English tip'
    );
  }

  // ===========================================================================
  // TEST GROUP C: User Doesn't Understand (Slang "daw", "ithu")
  // ===========================================================================
  console.log('\n--- TEST GROUP C: User Confusion with Slang ---');

  // C1: "Enna daw solra purila"
  {
    const history: Message[] = [
      { id: 'u1', role: 'user', content: 'Today I am very tired', timestamp: Date.now() - 15000 },
      { id: 'a1', role: 'assistant', content: 'Was work busy today? What kept you so occupied?', timestamp: Date.now() - 10000 }
    ];
    const res = await localProvider.sendMessage('Enna daw solra purila', history);
    testReplies.push({ input: 'Enna daw solra purila', reply: res.replyText });
    console.log(`User: "Enna daw solra purila"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('sorry daw') || lower.includes('simple-ah') || lower.includes('office'),
      'Enna daw solra purila explains previous response simply using context and friendly tone'
    );
  }

  // C2: "Enna daw ithu"
  {
    const res = await localProvider.sendMessage('Enna daw ithu', []);
    testReplies.push({ input: 'Enna daw ithu', reply: res.replyText });
    console.log(`\nUser: "Enna daw ithu"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('pesu') && (lower.includes('friend') || lower.includes('partner') || lower.includes('explain')),
      'Enna daw ithu explains what PESU is in simple, friendly Tanglish'
    );
  }

  // ===========================================================================
  // TEST GROUP D: Direct Questions & Factual Answers
  // ===========================================================================
  console.log('\n--- TEST GROUP D: Direct Questions & Factual Answers ---');

  // D1: "What is your name?"
  {
    const res = await localProvider.sendMessage('What is your name?', []);
    testReplies.push({ input: 'What is your name?', reply: res.replyText });
    console.log(`User: "What is your name?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('pesu') && lower.includes('speaking partner'),
      'What is your name? answers directly and invites user name'
    );
  }

  // D2: "Can we talk about movies?"
  {
    const res = await localProvider.sendMessage('Can we talk about movies?', []);
    testReplies.push({ input: 'Can we talk about movies?', reply: res.replyText });
    console.log(`\nUser: "Can we talk about movies?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('movie conversation') && lower.includes('recently'),
      'Can we talk about movies? enthusiastically accepts topic and asks for recent movie'
    );
  }

  // D3: "Can you explain photosynthesis?"
  {
    const res = await localProvider.sendMessage('Can you explain photosynthesis?', []);
    testReplies.push({ input: 'Can you explain photosynthesis?', reply: res.replyText });
    console.log(`\nUser: "Can you explain photosynthesis?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('photosynthesis') && lower.includes('sunlight') && lower.includes('oxygen'),
      'Can you explain photosynthesis? gives clear factual science explanation'
    );
  }

  // D4: "Why?" after photosynthesis explanation
  {
    const history: Message[] = [
      { id: 'u1', role: 'user', content: 'Can you explain photosynthesis?', timestamp: Date.now() - 10000 },
      { id: 'a1', role: 'assistant', content: 'Photosynthesis uses sunlight to produce glucose and oxygen.', timestamp: Date.now() - 5000 }
    ];
    const res = await localProvider.sendMessage('Why?', history);
    testReplies.push({ input: 'Why? (after photosynthesis)', reply: res.replyText });
    console.log(`\nUser: "Why?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('energy') || lower.includes('grow') || lower.includes('glucose') || lower.includes('food'),
      'Understands "Why?" in context of plant energy and food production'
    );
  }

  // D5: "What is the difference between 'went' and 'gone'?"
  {
    const res = await localProvider.sendMessage("What is the difference between 'went' and 'gone'?", []);
    testReplies.push({ input: "What is the difference between 'went' and 'gone'?", reply: res.replyText });
    console.log(`\nUser: "What is the difference between 'went' and 'gone'?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('simple past') && lower.includes('past participle') && lower.includes('has'),
      'What is the difference between went and gone? explains grammar with simple examples'
    );
  }

  // ===========================================================================
  // TEST GROUP E: Grammar Correction Without Interrupting Flow
  // ===========================================================================
  console.log('\n--- TEST GROUP E: Grammar Correction Without Interrupting Flow ---');

  // E1: "I am go to office yesterday"
  {
    const res = await localProvider.sendMessage('I am go to office yesterday', []);
    testReplies.push({ input: 'I am go to office yesterday', reply: res.replyText });
    console.log(`User: "I am go to office yesterday"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('went to the office yesterday') && lower.includes('how was your day'),
      'I am go to office yesterday responds to meaning first, then provides gentle tip'
    );
  }

  // ===========================================================================
  // TEST GROUP F: Multi-Turn Conflict & Follow-Up Context
  // ===========================================================================
  console.log('\n--- TEST GROUP F: Multi-Turn Conflict & Follow-Up Context ---');

  {
    const history: Message[] = [];

    // Turn 1
    const t1 = await localProvider.sendMessage('I had a fight with my friend.', history);
    testReplies.push({ input: 'I had a fight with my friend.', reply: t1.replyText });
    console.log(`Turn 1 Bot: ${t1.replyText}`);
    assert(t1.replyText.toLowerCase().includes('friend') && t1.replyText.toLowerCase().includes('sorry'), 'Turn 1 acknowledges friend dispute');

    history.push(
      { id: 'u1', role: 'user', content: 'I had a fight with my friend.', timestamp: Date.now() - 20000 },
      { id: 'a1', role: 'assistant', content: t1.replyText, timestamp: Date.now() - 15000 }
    );

    // Turn 2: "He misunderstood me."
    const t2 = await localProvider.sendMessage('He misunderstood me.', history);
    testReplies.push({ input: 'He misunderstood me.', reply: t2.replyText });
    console.log(`Turn 2 Bot: ${t2.replyText}`);
    assert(t2.replyText.toLowerCase().includes('misunderstanding') || t2.replyText.toLowerCase().includes('friend'), 'Turn 2 resolves "he" to the friend');

    history.push(
      { id: 'u2', role: 'user', content: 'He misunderstood me.', timestamp: Date.now() - 10000 },
      { id: 'a2', role: 'assistant', content: t2.replyText, timestamp: Date.now() - 8000 }
    );

    // Turn 3: "What should I do now?"
    const t3 = await localProvider.sendMessage('What should I do now?', history);
    testReplies.push({ input: 'What should I do now?', reply: t3.replyText });
    console.log(`Turn 3 Bot: ${t3.replyText}`);
    assert(t3.replyText.toLowerCase().includes('friend') || t3.replyText.toLowerCase().includes('cool down'), 'Turn 3 advises on friend resolution');
  }

  // ===========================================================================
  // TEST GROUP G: Topic Change After Several Messages
  // ===========================================================================
  console.log('\n--- TEST GROUP G: Topic Change After Several Messages ---');

  {
    const history: Message[] = [
      { id: 'u1', role: 'user', content: 'I had a fight with my friend.', timestamp: Date.now() - 15000 },
      { id: 'a1', role: 'assistant', content: 'Give him time to cool down.', timestamp: Date.now() - 10000 }
    ];

    const res = await localProvider.sendMessage("Let's change topic. Can we talk about food?", history);
    testReplies.push({ input: "Let's change topic. Can we talk about food?", reply: res.replyText });
    console.log(`User: "Let's change topic. Can we talk about food?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(lower.includes('food') || lower.includes('lunch') || lower.includes('dinner'), 'Pivots smoothly to food topic');
  }

  // ===========================================================================
  // TEST GROUP H: Uniqueness of Replies Across Tested Inputs
  // ===========================================================================
  console.log('\n--- TEST GROUP H: Uniqueness of Replies Across Tested Inputs ---');

  const uniqueReplies = new Set(testReplies.map(r => r.reply));
  console.log(`Total Inputs Tested: ${testReplies.length}`);
  console.log(`Unique Bot Responses: ${uniqueReplies.size}`);

  assert(
    uniqueReplies.size === testReplies.length,
    'Every single user message received a unique, context-aware reply (No duplicate generic canned templates!)'
  );

  // ===========================================================================
  // TEST GROUP I: Gemini Provider Resilience & Fallback (Mocked / Offline)
  // ===========================================================================
  console.log('\n--- TEST GROUP I: Gemini Provider Resilience & Fallback ---');

  {
    const geminiProvider = new GeminiSpeakingProvider('', true);
    try {
      const fallbackRes = await geminiProvider.sendMessage('Shall I talk Tamil?', []);
      console.log(`Gemini Fallback Response: "${fallbackRes.replyText}"`);
      assert(
        fallbackRes.replyText.toLowerCase().includes('yes') || fallbackRes.replyText.toLowerCase().includes('tamil'),
        'GeminiProvider falls back smoothly to offline pipeline on network error without crashing'
      );
    } catch (e: any) {
      assert(false, 'GeminiProvider should never throw unhandled exception to caller', e.message);
    }
  }

  console.log('\n================================================================');
  console.log('   ALL COMPREHENSIVE CONVERSATIONAL TESTS PASSED SUCCESSFULLY!  ');
  console.log('================================================================\n');
}

runComprehensiveTestSuite().catch((err) => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
