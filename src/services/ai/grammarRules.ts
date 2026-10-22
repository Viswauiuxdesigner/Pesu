import { GrammarCorrection } from '../../types/conversation';

interface Rule {
  pattern: RegExp;
  category: GrammarCorrection['category'];
  correctionTemplate: (match: RegExpMatchArray, text: string) => {
    improved: string;
    explanationInEnglish: string;
    explanationInTamil: string;
  };
}

export const COMMON_GRAMMAR_RULES: Rule[] = [
  // 1. "I am go to [place] yesterday" or "I am go"
  {
    pattern: /\b(?:i am go(?:ing)? to|i go to)\s+([a-z\s]+?)\s+(yesterday|last\s+[a-z]+)\b/i,
    category: 'tense',
    correctionTemplate: (match) => {
      const place = match[1].trim();
      const time = match[2].trim();
      const article = ['the', 'a', 'my', 'his', 'her'].some(a => place.startsWith(a)) ? '' : 'the ';
      return {
        improved: `I went to ${article}${place} ${time}.`,
        explanationInEnglish: `When talking about the past ("yesterday"), use "went" instead of "am go".`,
        explanationInTamil: `கடந்த காலம் (நேற்று - yesterday) பற்றி பேசும்போது "am go" என்று சொல்லக்கூடாது, "went" என்று சொல்ல வேண்டும்.`
      };
    }
  },
  // 2. "I am go to [somewhere]" (without yesterday)
  {
    pattern: /\bi am go to\s+([a-z\s]+)\b/i,
    category: 'tense',
    correctionTemplate: (match) => {
      const dest = match[1].trim();
      return {
        improved: `I am going to ${dest}. (or "I go to ${dest}")`,
        explanationInEnglish: `Say "I am going to..." for continuous action, or "I go to..." for a routine.`,
        explanationInTamil: `"I am go" என்று வராது. இப்போது போய்க்கொண்டிருந்தால் "I am going to" என்றும், வழக்கமாக போனால் "I go to" என்றும் சொல்ல வேண்டும்.`
      };
    }
  },
  // 3. "Myself [Name]"
  {
    pattern: /\b(?:my\s*self)\s+([A-Z][a-z]+)\b/i,
    category: 'vocabulary',
    correctionTemplate: (match) => {
      const name = match[1];
      return {
        improved: `My name is ${name}. (or "I'm ${name}")`,
        explanationInEnglish: `In formal English, start self-introductions with "My name is..." or "I am...", rather than "Myself...".`,
        explanationInTamil: `சுய அறிமுகத்தின்போது "Myself..." என்று தொடங்காமல், "My name is..." அல்லது "I am..." என்று சொல்வதே சரியான ஆங்கில முறை.`
      };
    }
  },
  // 4. "I didn't went" / "didn't came" / "didn't saw"
  {
    pattern: /\b(?:didn't|did not)\s+(went|came|saw|ate|took|gave|told)\b/i,
    category: 'tense',
    correctionTemplate: (match) => {
      const wrongPast = match[1].toLowerCase();
      const baseMap: Record<string, string> = {
        went: 'go',
        came: 'come',
        saw: 'see',
        ate: 'eat',
        took: 'take',
        gave: 'give',
        told: 'tell'
      };
      const correctBase = baseMap[wrongPast] || 'verb (base form)';
      return {
        improved: `didn't ${correctBase}`,
        explanationInEnglish: `After "did" or "didn't", always use the base form of the verb ("didn't ${correctBase}"), never the past form.`,
        explanationInTamil: `"didn't" வந்தவுடன் அதன் பின் கடந்த கால சொல் ("${wrongPast}") வரக்கூடாது. முதல் நிலை சொல்லான "${correctBase}" தான் வரவேண்டும்.`
      };
    }
  },
  // 5. "I am having two brothers / a car / doubt"
  {
    pattern: /\bi am having\s+(a\s+doubt|two\s+[a-z]+|a\s+car|a\s+bike|a\s+laptop)\b/i,
    category: 'vocabulary',
    correctionTemplate: (match) => {
      const item = match[1];
      const replacement = item.includes('doubt') ? 'a question / query' : item;
      return {
        improved: `I have ${replacement}.`,
        explanationInEnglish: `For possession, use "I have..." instead of "I am having". If asking a question in office/class, "I have a question" sounds more professional than "I have a doubt".`,
        explanationInTamil: `உங்களிடம் ஒன்று இருப்பதை குறிக்க "I am having" என சொல்லாமல் "I have..." என்று கூற வேண்டும். சந்தேகம் கேட்கும்போது "I have a question" என்பது சிறந்தது.`
      };
    }
  },
  // 6. "He/She do not know" -> does not know
  {
    pattern: /\b(he|she|it|everyone|someone)\s+do\s*not\s+([a-z]+)\b/i,
    category: 'tense',
    correctionTemplate: (match) => {
      const subj = match[1];
      const verb = match[2];
      return {
        improved: `${subj} does not ${verb}`,
        explanationInEnglish: `For third-person singular (he, she, it), use "does not" instead of "do not".`,
        explanationInTamil: `He, She, It போன்ற ஒருமைச் சொற்களுக்கு "do not" என்பதற்கு பதிலாக "does not" பயன்படுத்த வேண்டும்.`
      };
    }
  },
  // 7. "One of my friend" -> One of my friends
  {
    pattern: /\bone of my\s+([a-z]+)\b/i,
    category: 'vocabulary',
    correctionTemplate: (match) => {
      const singular = match[1];
      if (!singular.endsWith('s')) {
        return {
          improved: `one of my ${singular}s`,
          explanationInEnglish: `After "one of my...", always use the plural noun (e.g. "one of my friends").`,
          explanationInTamil: `"one of my..." என வரும்போது, பல நண்பர்களில் ஒருவர் என்பதால் பன்மையாக "friends" என்று 's' சேர்த்து கூற வேண்டும்.`
        };
      }
      return {
        improved: `one of my ${singular}`,
        explanationInEnglish: `Looks good!`,
        explanationInTamil: `சரியாக உள்ளது.`
      };
    }
  },
  // 8. "Discuss about"
  {
    pattern: /\bdiscuss(?:ed)?\s+about\b/i,
    category: 'preposition',
    correctionTemplate: () => ({
      improved: `discussed (without "about")`,
      explanationInEnglish: `The verb "discuss" already means "talk about", so do not add "about" after it (e.g., "We discussed the project").`,
      explanationInTamil: `"Discuss" என்ற சொல்லிலேயே "பற்றி பேசுதல்" என்ற பொருள் அடங்கியுள்ளது. எனவே "discuss about" என்று "about" சேர்க்க தேவையில்லை.`
    })
  },
  // 9. "Revert back"
  {
    pattern: /\brevert\s+back\b/i,
    category: 'vocabulary',
    correctionTemplate: () => ({
      improved: `reply / respond / revert`,
      explanationInEnglish: `Say "reply" or "respond" instead of "revert back", because revert already implies returning.`,
      explanationInTamil: `"Revert back" என்பதற்கு பதிலாக "reply" அல்லது "respond" என்று சொல்வது அலுவலக ஆங்கிலத்தில் மிகச்சரியானது.`
    })
  },
  // 10. "On tomorrow / on yesterday"
  {
    pattern: /\bon\s+(tomorrow|yesterday)\b/i,
    category: 'preposition',
    correctionTemplate: (match) => ({
      improved: match[1],
      explanationInEnglish: `Do not use the preposition "on" before tomorrow or yesterday. Just say "${match[1]}".`,
      explanationInTamil: `Tomorrow அல்லது Yesterday முன்னால் "on" என்ற வார்த்தையை சேர்க்கக்கூடாது. வெறும் "${match[1]}" என்று கூறினாலே போதும்.`
    })
  }
];

/**
 * Analyzes English text for common Tamil speaker grammatical missteps.
 * Returns null if no known errors are found.
 */
export function checkGrammar(text: string): GrammarCorrection | null {
  for (const rule of COMMON_GRAMMAR_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      const details = rule.correctionTemplate(match, text);
      return {
        original: match[0],
        improved: details.improved,
        explanationInEnglish: details.explanationInEnglish,
        explanationInTamil: details.explanationInTamil,
        category: rule.category
      };
    }
  }
  return null;
}
