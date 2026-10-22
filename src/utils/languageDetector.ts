import { DetectedLanguage } from '../types/conversation';

// Common Tanglish keywords (Romanized Tamil)
const TANGLISH_KEYWORDS = new Set([
  'enakku', 'unakku', 'avanukku', 'avalukku', 'engalukku', 'namma', 'namakku',
  'irukku', 'irukken', 'irukeenga', 'illa', 'illai', 'illana',
  'epdi', 'eppadi', 'enna', 'ethu', 'yaar', 'enge', 'engu', 'eppo', 'eppovum',
  'pesa', 'pesunga', 'pesanum', 'pesalam', 'pesuren', 'pesuraan',
  'solla', 'sollunga', 'sollanum', 'sollalam', 'solren', 'solreenga',
  'theriyala', 'puriyala', 'theriyum', 'puriyum',
  'bayama', 'thayakkama', 'hesitation', 'kashtama', 'sulabam',
  'romba', 'konjam', 'nalla', 'nallaa', 'aama', 'seri', 'podhum',
  'pannu', 'pannunga', 'pannanum', 'pannalam', 'panren',
  'aprom', 'marubadiyum', 'inime', 'ippo', 'appo',
  'vanakkam', 'nandri', 'thambi', 'anna', 'akka', 'pa', 'ma'
]);

// Tanglish suffixes often attached to English words (e.g., "interview-la", "office-ku", "pesurathu")
const TANGLISH_SUFFIX_REGEX = /(la|ula|ku|ukku|oda|oda|odu|kitta|lerundhu|paththi|aave|aa|um)$/i;

/**
 * Detects whether the input text is Tamil script, Tanglish, English, or Mixed.
 */
export function detectLanguage(text: string): DetectedLanguage {
  const trimmed = text.trim();
  if (!trimmed) return 'english';

  // 1. Check for Tamil Unicode characters (\u0B80 - \u0BFF)
  const tamilCharMatch = trimmed.match(/[\u0B80-\u0BFF]/g);
  const totalChars = trimmed.replace(/\s+/g, '').length;
  const tamilCharCount = tamilCharMatch ? tamilCharMatch.length : 0;

  if (tamilCharCount > 0 && tamilCharCount / totalChars > 0.4) {
    return 'tamil';
  }

  // 2. Tokenize words and check for Tanglish vocabulary & suffixes
  const words = trimmed.toLowerCase().split(/[\s,?.!;:—"']+/).filter(Boolean);
  let tanglishScore = 0;
  let englishScore = 0;

  for (const word of words) {
    if (TANGLISH_KEYWORDS.has(word)) {
      tanglishScore += 2;
    } else if (TANGLISH_SUFFIX_REGEX.test(word) && word.length > 3) {
      tanglishScore += 1.5;
    } else if (word.length > 2) {
      englishScore += 1;
    }
  }

  if (tamilCharCount > 0 && englishScore > 0) {
    return 'mixed';
  }

  if (tanglishScore >= 2 && englishScore >= 2) {
    return 'mixed';
  }

  if (tanglishScore >= 1) {
    return 'tanglish';
  }

  return 'english';
}

/**
 * Checks if a user's prompt is explicitly asking for a Tamil explanation
 * e.g., "Can you explain this in Tamil?", "Tamil-la sollu", "ithu puriyala Tamil-la solreengala"
 */
export function isAskingForTamilExplanation(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('explain in tamil') ||
    lower.includes('explain this in tamil') ||
    lower.includes('explain that in tamil') ||
    lower.includes('tamil explanation') ||
    lower.includes('tamil-la sollu') ||
    lower.includes('tamil la sollu') ||
    lower.includes('tamilil sollu') ||
    lower.includes('tamilil vilakku') ||
    lower.includes('தமிழ் விளக்கம்') ||
    lower.includes('தமிழில் சொல்') ||
    lower.includes('தமிழில் சொல்லு') ||
    lower.includes('தமிழில் விளக்கு') ||
    lower.includes('tamil la solreengala') ||
    lower.includes('tamil artham') ||
    lower.includes('meaning in tamil') ||
    lower.includes('tamil meaning')
  );
}

/**
 * Checks if the user is asking how to say something in English
 * e.g., "Enakku interview-la self introduction English-la solla theriyala",
 * "How to say X in English", "English-la epdi solrathu"
 */
export function isAskingHowToSayInEnglish(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('english-la solla') ||
    lower.includes('english la solla') ||
    lower.includes('english-la epdi') ||
    lower.includes('english la epdi') ||
    lower.includes('how to say') ||
    lower.includes('how do i say') ||
    lower.includes('solla theriyala') ||
    lower.includes('epdi pesurathu') ||
    lower.includes('eppadi pesuvathu') ||
    lower.includes('ஆங்கிலத்தில் எப்படி')
  );
}
