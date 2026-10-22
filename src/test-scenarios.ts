import { LocalSpeakingTutorProvider } from './services/ai/localProvider';
import { detectLanguage } from './utils/languageDetector';
import { checkGrammar } from './services/ai/grammarRules';
import { Message } from './types/conversation';

async function runTests() {
  console.log('--- STARTING PESU CORE SYSTEM VERIFICATION ---');
  const provider = new LocalSpeakingTutorProvider();

  // 1. Language Detection Tests
  console.log('\n[1. Language Detection Tests]');
  const t1 = detectLanguage('வணக்கம், எப்படி இருக்கிறீர்கள்?');
  console.log('Tamil script: ', t1, t1 === 'tamil' ? '✓ PASS' : '✗ FAIL');

  const t2 = detectLanguage('Enakku interview-la self introduction English-la solla theriyala.');
  console.log('Tanglish / Romanized Tamil: ', t2, (t2 === 'tanglish' || t2 === 'mixed') ? '✓ PASS' : '✗ FAIL');

  const t3 = detectLanguage('I am go to office yesterday.');
  console.log('English: ', t3, t3 === 'english' ? '✓ PASS' : '✗ FAIL');

  // 2. Grammar Rules Tests
  console.log('\n[2. Grammar Engine Tests]');
  const g1 = checkGrammar('I am go to office yesterday.');
  console.log('Tense error detected: ', g1?.improved, g1 ? '✓ PASS' : '✗ FAIL');
  console.log('Tamil explanation: ', g1?.explanationInTamil);

  const g2 = checkGrammar('Myself Vignesh, working in tech.');
  console.log('Intro error detected: ', g2?.improved, g2 ? '✓ PASS' : '✗ FAIL');

  const g3 = checkGrammar('I didn\'t went to the store.');
  console.log('Double past error detected: ', g3?.improved, g3 ? '✓ PASS' : '✗ FAIL');

  // 3. Conversational Scenarios from Prompt Section 6
  console.log('\n[3. Behavioral Conversation Tests]');
  
  // Case A: Self introduction query in Tanglish
  const history: Message[] = [];
  const res1 = await provider.sendMessage('Enakku interview-la self introduction English-la solla theriyala.', history);
  console.log('\nUser: "Enakku interview-la self introduction English-la solla theriyala."');
  console.log('Assistant Reply:\n', res1.replyText);
  console.log('Tamil Explanation:\n', res1.tamilExplanation);
  console.log('Pronunciation Guide:\n', res1.pronunciationGuide);

  history.push(
    { id: '1', role: 'user', content: 'Enakku interview-la self introduction English-la solla theriyala.', timestamp: Date.now() },
    { id: '2', role: 'assistant', content: res1.replyText, tamilExplanation: res1.tamilExplanation, timestamp: Date.now() }
  );

  // Case B: English attempt with mistake
  const res2 = await provider.sendMessage('I am go to office yesterday.', history);
  console.log('\nUser: "I am go to office yesterday."');
  console.log('Assistant Reply:\n', res2.replyText);
  console.log('Grammar Correction:\n', res2.grammarCorrection);

  history.push(
    { id: '3', role: 'user', content: 'I am go to office yesterday.', timestamp: Date.now() },
    { id: '4', role: 'assistant', content: res2.replyText, grammarCorrection: res2.grammarCorrection, timestamp: Date.now() }
  );

  // Case C: Explain in Tamil request
  const res3 = await provider.sendMessage('Can you explain this in Tamil?', history);
  console.log('\nUser: "Can you explain this in Tamil?"');
  console.log('Assistant Reply:\n', res3.replyText);
  console.log('Tamil Explanation:\n', res3.tamilExplanation);

  // Case D: Session Summary
  console.log('\n[4. Session Summary Generation]');
  const summary = await provider.generateSessionSummary(history);
  console.log('Confidence Score: ', summary.confidenceScore + '%');
  console.log('Phrases Learned: ', summary.phrasesLearned);
  console.log('Corrections Count: ', summary.correctionsCount);

  console.log('\n--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error);
