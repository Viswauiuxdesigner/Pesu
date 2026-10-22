import { RecognitionLanguage } from '../../types/conversation';
import { SpeechRecognitionEventLike, SpeechRecognitionErrorEventLike } from '../../types/speech';

export interface RecognitionCallbacks {
  onStart: () => void;
  onInterimResult: (transcript: string) => void;
  onFinalResult: (transcript: string) => void;
  onError: (errorType: string, userFriendlyMessage: string) => void;
  onEnd: () => void;
}

export class BrowserSpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLanguage: RecognitionLanguage = 'auto';
  private finalTranscriptBuffer: string = '';

  constructor() {
    this.initRecognition();
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  private initRecognition() {
    if (!this.isSupported()) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
  }

  public startListening(
    language: RecognitionLanguage,
    callbacks: RecognitionCallbacks
  ): boolean {
    if (!this.isSupported()) {
      callbacks.onError(
        'unsupported-browser',
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, Safari, or type your message.'
      );
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.currentLanguage = language;
    this.finalTranscriptBuffer = '';

    // Map recognition language
    let langCode = 'en-IN';
    if (language === 'ta-IN') {
      langCode = 'ta-IN';
    } else if (language === 'en-IN') {
      langCode = 'en-IN';
    } else {
      // Auto: defaults to Indian English with fallback
      langCode = 'en-IN';
    }

    try {
      this.recognition.lang = langCode;

      this.recognition.onstart = () => {
        this.isListening = true;
        callbacks.onStart();
      };

      this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            this.finalTranscriptBuffer += (this.finalTranscriptBuffer ? ' ' : '') + item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        callbacks.onInterimResult(this.finalTranscriptBuffer + (interim ? ' ' + interim : ''));
        if (this.finalTranscriptBuffer) {
          callbacks.onFinalResult(this.finalTranscriptBuffer);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        let friendlyMsg = 'An error occurred during speech recognition.';
        switch (event.error) {
          case 'not-allowed':
            friendlyMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
            break;
          case 'no-speech':
            friendlyMsg = 'No speech was detected. Please check your mic and try speaking again.';
            break;
          case 'network':
            friendlyMsg = 'Network error during speech recognition. An internet connection is needed for browser voice transcription.';
            break;
          case 'audio-capture':
            friendlyMsg = 'No microphone was found or audio capture failed. Please connect a working microphone.';
            break;
          case 'language-not-supported':
            friendlyMsg = `The selected language (${langCode}) is not supported by your browser voice engine.`;
            break;
          default:
            friendlyMsg = `Speech recognition error: ${event.error}`;
        }
        callbacks.onError(event.error, friendlyMsg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      callbacks.onError('start-failed', e.message || 'Failed to start speech recognition.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignored
      }
      this.isListening = false;
    }
  }

  public getFinalTranscript(): string {
    return this.finalTranscriptBuffer.trim();
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognizer = new BrowserSpeechRecognitionService();
