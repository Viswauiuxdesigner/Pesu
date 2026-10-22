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
  const pipeline = new ConversationPipeline();
  const testReplies: { input: string; reply: string }[] = [];

  // ===========================================================================
  // TEST GROUP A: Language Preference & Capability Questions
  // ===========================================================================
  console.log('--- TEST GROUP A: Language Preference & Capability Questions ---');

  // A1: "Shall I talk in Tamil?"
  {
    const res = await localProvider.sendMessage('Shall I talk in Tamil?', []);
    testReplies.push({ input: 'Shall I talk in Tamil?', reply: res.replyText });
    console.log(`User: "Shall I talk in Tamil?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('yes') || lower.includes('course') || lower.includes('comfortable') || lower.includes('speak in tamil'),
      'Shall I talk in Tamil? receives warm affirmative permission'
    );
    assert(
      !lower.includes('describe that experience') && !lower.includes('short english sentence'),
      'Does NOT return generic canned English practice response'
    );
  }

  // A2: "Can I speak Tamil?"
  {
    const res = await localProvider.sendMessage('Can I speak Tamil?', []);
    testReplies.push({ input: 'Can I speak Tamil?', reply: res.replyText });
    console.log(`\nUser: "Can I speak Tamil?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('absolutely') || lower.includes('speak in tamil') || lower.includes('yes'),
      'Can I speak Tamil? receives affirmative welcoming response'
    );
  }

  // A3: "Naan Tamil la pesalama?"
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

  // A4: "Can talk Tamil" (imperfect grammar)
  {
    const res = await localProvider.sendMessage('Can talk Tamil', []);
    testReplies.push({ input: 'Can talk Tamil', reply: res.replyText });
    console.log(`\nUser: "Can talk Tamil"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('absolutely') || lower.includes('speak in tamil') || lower.includes('practise english') || lower.includes('talk in tamil'),
      'Can talk Tamil understands intended meaning despite imperfect grammar'
    );
    assert(
      !lower.includes('describe that experience'),
      'Can talk Tamil does NOT get the old canned response'
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

  // ===========================================================================
  // TEST GROUP B: Ordinary Conversation & Initiation
  // ===========================================================================
  console.log('\n--- TEST GROUP B: Ordinary Conversation & Initiation ---');

  // B1: "Shall we talk?"
  {
    const res = await localProvider.sendMessage('Shall we talk?', []);
    testReplies.push({ input: 'Shall we talk?', reply: res.replyText });
    console.log(`User: "Shall we talk?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('of course') && lower.includes('talk about'),
      'Shall we talk? invites user warmly to discuss what is on their mind'
    );
  }

  // B2: "Today I had a bad day."
  {
    const res = await localProvider.sendMessage('Today I had a bad day.', []);
    testReplies.push({ input: 'Today I had a bad day.', reply: res.replyText });
    console.log(`\nUser: "Today I had a bad day."\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('sorry to hear') || lower.includes('what happened'),
      'Today I had a bad day receives empathetic inquiry'
    );
  }

  // B3: "Innaiku office-la romba work irundhuchu."
  {
    const res = await localProvider.sendMessage('Innaiku office-la romba work irundhuchu.', []);
    testReplies.push({ input: 'Innaiku office-la romba work irundhuchu.', reply: res.replyText });
    console.log(`\nUser: "Innaiku office-la romba work irundhuchu."\nBot: ${res.replyText}`);
    const lower = (res.replyText + ' ' + (res.tamilExplanation || '')).toLowerCase();
    assert(
      lower.includes('busy') || lower.includes('office') || lower.includes('work'),
      'Innaiku office-la romba work irundhuchu understands office workload'
    );
  }

  // B4: "I am feeling tired."
  {
    const res = await localProvider.sendMessage('I am feeling tired.', []);
    testReplies.push({ input: 'I am feeling tired.', reply: res.replyText });
    console.log(`\nUser: "I am feeling tired."\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('tiring day') || lower.includes('rest'),
      'I am feeling tired receives supportive response asking about rest'
    );
  }

  // ===========================================================================
  // TEST GROUP C: Questions Must Receive Direct Answers
  // ===========================================================================
  console.log('\n--- TEST GROUP C: Questions Must Receive Direct Answers ---');

  // C1: "Can I improve my English in three months?"
  {
    const res = await localProvider.sendMessage('Can I improve my English in three months?', []);
    testReplies.push({ input: 'Can I improve my English in three months?', reply: res.replyText });
    console.log(`User: "Can I improve my English in three months?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('three months') && (lower.includes('confidence') || lower.includes('practice') || lower.includes('progress')),
      'Can I improve my English in three months? gives a realistic, encouraging answer'
    );
  }

  // C2: "How do I introduce myself in an interview?"
  {
    const res = await localProvider.sendMessage('How do I introduce myself in an interview?', []);
    testReplies.push({ input: 'How do I introduce myself in an interview?', reply: res.replyText });
    console.log(`\nUser: "How do I introduce myself in an interview?"\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('greeting') || lower.includes('name') || lower.includes('background') || lower.includes('strength'),
      'How do I introduce myself in an interview? gives a structured 3-step guide'
    );
  }

  // C3: "What is the difference between 'went' and 'gone'?"
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
  // TEST GROUP D: Understand Confusion & Clarification
  // ===========================================================================
  console.log('\n--- TEST GROUP D: Understand Confusion & Clarification ---');

  // D1: "Enna da solra, purila." with context
  {
    const history: Message[] = [
      {
        id: 'msg-prev',
        role: 'assistant',
        content: "What is the difference between 'went' and 'gone'? 'Went' is simple past, 'gone' is past participle.",
        timestamp: Date.now() - 5000
      }
    ];
    const res = await localProvider.sendMessage('Enna da solra, purila.', history);
    testReplies.push({ input: 'Enna da solra, purila.', reply: res.replyText });
    console.log(`User: "Enna da solra, purila."\nBot: ${res.replyText}`);
    const lower = (res.replyText + ' ' + (res.tamilExplanation || '')).toLowerCase();
    assert(
      lower.includes('went') || lower.includes('gone') || lower.includes('simple words') || lower.includes('confusing'),
      'Enna da solra, purila explains the specific previous grammar answer simply'
    );
  }

  // D2: "Explain that in Tamil."
  {
    const history: Message[] = [
      {
        id: 'msg-prev-interview',
        role: 'assistant',
        content: 'In an interview, start with Greeting & Name, then Background, then Key Strength & Goal.',
        timestamp: Date.now() - 5000
      }
    ];
    const res = await localProvider.sendMessage('Explain that in Tamil.', history);
    testReplies.push({ input: 'Explain that in Tamil.', reply: res.replyText });
    console.log(`\nUser: "Explain that in Tamil."\nBot: ${res.replyText}\nTamil: ${res.tamilExplanation}`);
    assert(
      res.tamilExplanation !== undefined && res.tamilExplanation.length > 20,
      'Explain that in Tamil provides detailed Tamil explanation of previous message'
    );
  }

  // ===========================================================================
  // TEST GROUP E: Grammar Correction Without Interrupting Flow
  // ===========================================================================
  console.log('\n--- TEST GROUP E: Grammar Correction Without Interrupting Flow ---');

  // E1: "I am go to office yesterday."
  {
    const res = await localProvider.sendMessage('I am go to office yesterday.', []);
    testReplies.push({ input: 'I am go to office yesterday.', reply: res.replyText });
    console.log(`User: "I am go to office yesterday."\nBot: ${res.replyText}`);
    const lower = res.replyText.toLowerCase();
    assert(
      lower.includes('office yesterday') || lower.includes('workday go'),
      'Acknowledges meaning of going to office yesterday first'
    );
    assert(
      lower.includes('went to the office yesterday') || (res.grammarCorrection?.improved.includes('went') ?? false),
      'Offers gentle grammar correction with "went"'
    );
  }

  // ===========================================================================
  // TEST GROUP F: Follow-up Questions & Multi-Turn Context
  // ===========================================================================
  console.log('\n--- TEST GROUP F: Follow-up Questions & Multi-Turn Context ---');

  {
    const multiTurnHistory: Message[] = [];

    // Turn 1: "I had a fight with my friend."
    const turn1Res = await localProvider.sendMessage('I had a fight with my friend.', multiTurnHistory);
    testReplies.push({ input: 'I had a fight with my friend.', reply: turn1Res.replyText });
    console.log(`Turn 1 User: "I had a fight with my friend."\nTurn 1 Bot: ${turn1Res.replyText}`);
    assert(
      turn1Res.replyText.toLowerCase().includes('sorry') && turn1Res.replyText.toLowerCase().includes('friend'),
      'Turn 1 acknowledges disagreement with friend'
    );

    multiTurnHistory.push(
      { id: 'u1', role: 'user', content: 'I had a fight with my friend.', timestamp: Date.now() - 20000 },
      { id: 'a1', role: 'assistant', content: turn1Res.replyText, timestamp: Date.now() - 15000 }
    );

    // Turn 2: "He misunderstood me."
    const turn2Res = await localProvider.sendMessage('He misunderstood me.', multiTurnHistory);
    testReplies.push({ input: 'He misunderstood me.', reply: turn2Res.replyText });
    console.log(`\nTurn 2 User: "He misunderstood me."\nTurn 2 Bot: ${turn2Res.replyText}`);
    const turn2Lower = turn2Res.replyText.toLowerCase();
    assert(
      turn2Lower.includes('misunderstanding') || turn2Lower.includes('friend'),
      'Turn 2 understands "he" refers to the friend from Turn 1'
    );

    multiTurnHistory.push(
      { id: 'u2', role: 'user', content: 'He misunderstood me.', timestamp: Date.now() - 10000 },
      { id: 'a2', role: 'assistant', content: turn2Res.replyText, timestamp: Date.now() - 8000 }
    );

    // Turn 3: "What should I do now?"
    const turn3Res = await localProvider.sendMessage('What should I do now?', multiTurnHistory);
    testReplies.push({ input: 'What should I do now?', reply: turn3Res.replyText });
    console.log(`\nTurn 3 User: "What should I do now?"\nTurn 3 Bot: ${turn3Res.replyText}`);
    const turn3Lower = turn3Res.replyText.toLowerCase();
    assert(
      turn3Lower.includes('friend') || turn3Lower.includes('cool down') || turn3Lower.includes('message') || turn3Lower.includes('misunderstanding'),
      'Turn 3 gives advice specific to resolving the friend misunderstanding'
    );
  }

  // ===========================================================================
  // TEST GROUP G: Topic Change After Several Turns
  // ===========================================================================
  console.log('\n--- TEST GROUP G: Topic Change After Several Turns ---');

  {
    const historyWithOldTopic: Message[] = [
      { id: 'u1', role: 'user', content: 'I had a fight with my friend.', timestamp: Date.now() - 15000 },
      { id: 'a1', role: 'assistant', content: 'What happened?', timestamp: Date.now() - 10000 }
    ];

    const topicRes = await localProvider.sendMessage("Let's change topic. Can we talk about movies?", historyWithOldTopic);
    testReplies.push({ input: "Let's change topic. Can we talk about movies?", reply: topicRes.replyText });
    console.log(`User: "Let's change topic. Can we talk about movies?"\nBot: ${topicRes.replyText}`);
    const lower = topicRes.replyText.toLowerCase();
    assert(
      lower.includes('movie') || lower.includes('cinema'),
      'Successfully pivots away from old conflict topic to movies'
    );
  }

  // ===========================================================================
  // TEST GROUP H: Uniqueness of Replies Across Unrelated Inputs
  // ===========================================================================
  console.log('\n--- TEST GROUP H: Uniqueness of Replies Across Unrelated Inputs ---');

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
    // Test that Gemini provider safely catches proxy network failures or 503s and falls back to local provider
    const geminiProvider = new GeminiSpeakingProvider('', true);
    // Since fetch('/api/chat') in Node environment without server will reject or fail:
    try {
      const fallbackRes = await geminiProvider.sendMessage('Shall I talk in Tamil?', []);
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
  console.log('   ALL 15 ADVANCED CONVERSATION INTELLIGENCE TESTS PASSED!       ');
  console.log('================================================================\n');
}

runComprehensiveTestSuite().catch((err) => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
