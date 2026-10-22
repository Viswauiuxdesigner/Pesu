import { VoiceOption } from '../../types/speech';

export class BrowserSpeechSynthesisService {
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastSpokenText: string = '';
  private lastSpokenLang: string = 'en';

  constructor() {
    this.loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private loadVoices() {
    if (!this.isSupported()) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public getAvailableVoices(): VoiceOption[] {
    this.loadVoices();
    return this.voices.map(v => {
      const lang = v.lang.toLowerCase();
      const isTamil = lang.includes('ta') || v.name.toLowerCase().includes('tamil');
      const isIndianEnglish = lang.includes('en-in') || v.name.toLowerCase().includes('india');
      const isStandardEnglish = lang.startsWith('en');

      return {
        voice: v,
        displayName: `${v.name} (${v.lang})`,
        lang: v.lang,
        isTamil,
        isIndianEnglish,
        isStandardEnglish
      };
    });
  }

  /**
   * Finds the best voice for the target language.
   */
  public findBestVoice(lang: 'ta' | 'en', preferredVoiceURI?: string): SpeechSynthesisVoice | null {
    this.loadVoices();
    if (this.voices.length === 0) return null;

    if (preferredVoiceURI) {
      const match = this.voices.find(v => v.voiceURI === preferredVoiceURI);
      if (match) return match;
    }

    if (lang === 'ta') {
      const tamilVoice = this.voices.find(v => 
        v.lang.toLowerCase().includes('ta') || 
        v.name.toLowerCase().includes('tamil')
      );
      if (tamilVoice) return tamilVoice;
    }

    // For English: prefer Indian English (en-IN), then standard English
    if (lang === 'en') {
      const indianVoice = this.voices.find(v => v.lang.toLowerCase() === 'en-in');
      if (indianVoice) return indianVoice;

      const englishVoice = this.voices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (englishVoice) return englishVoice;
    }

    return this.voices[0] || null;
  }

  public speak(
    text: string, 
    options?: {
      lang?: 'ta' | 'en';
      rate?: number;
      preferredVoiceURI?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): boolean {
    if (!this.isSupported()) {
      options?.onError?.(new Error('Speech synthesis is not supported on this browser.'));
      return false;
    }

    this.stop();

    const cleanText = text.trim();
    if (!cleanText) return false;

    this.lastSpokenText = cleanText;
    this.lastSpokenLang = options?.lang || 'en';

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.findBestVoice(options?.lang || 'en', options?.preferredVoiceURI);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = options?.lang === 'ta' ? 'ta-IN' : 'en-IN';
      }

      utterance.rate = options?.rate || 0.92; // Slightly slower for clear English learning
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        options?.onError?.(e);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      this.isSpeaking = false;
      options?.onError?.(e);
      return false;
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignored
      }
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public repeat(rate?: number): boolean {
    if (!this.lastSpokenText) return false;
    return this.speak(this.lastSpokenText, {
      lang: this.lastSpokenLang as any,
      rate
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechSynthesizer = new BrowserSpeechSynthesisService();
