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
  // TEST GROUP A: Language Preference & Capability Questions (Examples A, C)
  // ===========================================================================
  console.log('--- TEST GROUP A: Language Preference & Capability Questions ---');

  // A1: "Shall I talk in Tamil?" (Example A1)
  {
    const res = await localProvider.sendMessage('Shall I talk in Tamil?', []);
    testReplies.push({ input: 'Shall I talk in Tamil?', reply: res.replyText });
    console.log(`User: "Shall I talk in Tamil?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Yes, absolutely! You can speak in Tamil'),
      'Shall I talk in Tamil? directly agrees and invites user to speak Tamil'
    );
    assert(
      !res.replyText.includes('describe that experience') && !res.replyText.includes('short English sentence'),
      'Does NOT return generic canned English practice response'
    );
  }

  // A2: "Can talk Tamil?" (Example A2 - shorthand grammar)
  {
    const res = await localProvider.sendMessage('Can talk Tamil?', []);
    testReplies.push({ input: 'Can talk Tamil?', reply: res.replyText });
    console.log(`\nUser: "Can talk Tamil?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Of course! You can talk to me in Tamil, Tanglish, or English'),
      'Can talk Tamil? confirms Tamil/Tanglish/English are supported without worry'
    );
  }

  // A3: "Can you talk Tamil?" (AI capability question)
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

  // A4: "Naan enna sonnalum unakku puriyudha?" (Understanding check)
  {
    const res = await localProvider.sendMessage('Naan enna sonnalum unakku puriyudha?', []);
    testReplies.push({ input: 'Naan enna sonnalum unakku puriyudha?', reply: res.replyText });
    console.log(`\nUser: "Naan enna sonnalum unakku puriyudha?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Aama, kandippa puriyudhu!'),
      'Naan enna sonnalum unakku puriyudha? warmly confirms understanding'
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
      lower.includes('ஆமாம்') && lower.includes('தமிழில்'),
      'Tamil script "நீ தமிழில் பேசுவாயா?" receives welcoming Tamil response'
    );
  }

  // ===========================================================================
  // TEST GROUP B: Casual Greetings & Initiation (Examples D, E)
  // ===========================================================================
  console.log('\n--- TEST GROUP B: Casual Greetings & Initiation ---');

  // B1: "Hi." (Example D)
  {
    const res = await localProvider.sendMessage('Hi.', []);
    testReplies.push({ input: 'Hi.', reply: res.replyText });
    console.log(`User: "Hi."\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Hey! 😊 How are you doing today? How was your day?'),
      'Hi. receives warm, friendly greeting without any grammar corrections'
    );
  }

  // B2: "Shall we talk?" (Example E)
  {
    const res = await localProvider.sendMessage('Shall we talk?', []);
    testReplies.push({ input: 'Shall we talk?', reply: res.replyText });
    console.log(`\nUser: "Shall we talk?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Of course! 😊 What would you like to talk about?'),
      'Shall we talk? invites conversation naturally'
    );
  }

  // ===========================================================================
  // TEST GROUP C: User Doesn't Understand & Explaining in Tamil (Examples B, C)
  // ===========================================================================
  console.log('\n--- TEST GROUP C: Confusion & Contextual Clarification ---');

  // C1: "Enna da solra purila." with preceding message about experience (Example B)
  {
    const history: Message[] = [
      { id: 'u0', role: 'user', content: 'Hi', timestamp: Date.now() - 20000 },
      { id: 'a0', role: 'assistant', content: 'Could you tell me a little more about your experience?', timestamp: Date.now() - 15000 }
    ];
    const res = await localProvider.sendMessage('Enna da solra purila.', history);
    testReplies.push({ input: 'Enna da solra purila.', reply: res.replyText });
    console.log(`User: "Enna da solra purila."\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Ayyoo, sorry! 😊 Naan simple-ah solren. Un experience pathi konjam sollu nu ketten.'),
      'Enna da solra purila. explains the immediately preceding experience question in simple Tanglish'
    );
  }

  // C2: "Can you explain that in Tamil?" with preceding assistant message (Example C)
  {
    const history: Message[] = [
      { id: 'u1', role: 'user', content: 'Hi', timestamp: Date.now() - 20000 },
      { id: 'a1', role: 'assistant', content: 'Could you tell me a little more about your experience?', timestamp: Date.now() - 15000 }
    ];
    const res = await localProvider.sendMessage('Can you explain that in Tamil?', history);
    testReplies.push({ input: 'Can you explain that in Tamil?', reply: res.replyText });
    console.log(`\nUser: "Can you explain that in Tamil?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Kandippa!') && res.replyText.includes('அனுபவம்'),
      'Can you explain that in Tamil? explains the preceding message in Tamil preserving context'
    );
  }

  // C3: "Enna da ithu?"
  {
    const res = await localProvider.sendMessage('Enna da ithu?', []);
    testReplies.push({ input: 'Enna da ithu?', reply: res.replyText });
    console.log(`\nUser: "Enna da ithu?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Idhu PESU, ungalukku Tamil and English-la practice panna oru friendly partner!'),
      'Enna da ithu? explains what PESU is in simple, friendly Tanglish'
    );
  }

  // ===========================================================================
  // TEST GROUP D: Everyday Experiences & Feelings (Examples F, I)
  // ===========================================================================
  console.log('\n--- TEST GROUP D: Everyday Experiences & Feelings ---');

  // D1: "Innaiku office la romba work irundhuchu." (Example F)
  {
    const res = await localProvider.sendMessage('Innaiku office la romba work irundhuchu.', []);
    testReplies.push({ input: 'Innaiku office la romba work irundhuchu.', reply: res.replyText });
    console.log(`User: "Innaiku office la romba work irundhuchu."\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Ohh, inniku office-la romba busy-ah? What work kept you busy today?') &&
      res.replyText.includes("English-la you could say: 'I had a lot of work at the office today.'"),
      'Innaiku office la romba work irundhuchu acknowledges busy workday first, then gives natural English phrasing'
    );
  }

  // D2: "Enakku English pesa romba bayama irukku." (Example I)
  {
    const res = await localProvider.sendMessage('Enakku English pesa romba bayama irukku.', []);
    testReplies.push({ input: 'Enakku English pesa romba bayama irukku.', reply: res.replyText });
    console.log(`\nUser: "Enakku English pesa romba bayama irukku."\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Puriyudhu. English pesa start pannumbodhu bayam irukkuradhu normal dhaan.'),
      'Enakku English pesa romba bayama irukku reassures warmly without generic canned speech'
    );
  }

  // D3: "Today I am very tired"
  {
    const res = await localProvider.sendMessage('Today I am very tired', []);
    testReplies.push({ input: 'Today I am very tired', reply: res.replyText });
    console.log(`\nUser: "Today I am very tired"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('long day') || lower.includes('busy') || lower.includes('tiring day'),
      'Today I am very tired responds empathetically and asks if work was busy'
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

  // D6: "Can I improve my English in 3 months?" (Example H)
  {
    const res = await localProvider.sendMessage('Can I improve my English in 3 months?', []);
    testReplies.push({ input: 'Can I improve my English in 3 months?', reply: res.replyText });
    console.log(`\nUser: "Can I improve my English in 3 months?"\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Yes, you can make noticeable progress in three months if you practise consistently.') &&
      res.replyText.includes('How much time can you practise each day?'),
      'Can I improve my English in 3 months? answers the actual question first with practical guidance'
    );
  }

  // ===========================================================================
  // TEST GROUP E: Grammar Correction Without Interrupting Flow (Example G)
  // ===========================================================================
  console.log('\n--- TEST GROUP E: Grammar Correction Without Interrupting Flow ---');

  // E1: "I am go to office yesterday." (Example G)
  {
    const res = await localProvider.sendMessage('I am go to office yesterday.', []);
    testReplies.push({ input: 'I am go to office yesterday.', reply: res.replyText });
    console.log(`User: "I am go to office yesterday."\nBot: ${res.replyText}`);
    assert(
      res.replyText.includes('Oh, you went to the office yesterday! How was your day there?') &&
      res.replyText.includes('Better English: "I went to the office yesterday."') &&
      res.replyText.includes('Simple explanation: We use "went" when talking about something that happened yesterday.'),
      'I am go to office yesterday responds to meaning first, then provides gentle tip matching Example G'
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
