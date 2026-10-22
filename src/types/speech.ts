// Web Speech API type augments for browser environments
export interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionAlternativeList {
  [index: number]: SpeechRecognitionResultItem;
  length: number;
}

export interface SpeechRecognitionResultEventItem {
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
  length: number;
}

export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    [index: number]: SpeechRecognitionResultEventItem;
    length: number;
  };
}

export interface SpeechRecognitionErrorEventLike {
  error: 
    | 'no-speech' 
    | 'aborted' 
    | 'audio-capture' 
    | 'network' 
    | 'not-allowed' 
    | 'service-not-allowed' 
    | 'bad-grammar' 
    | 'language-not-supported';
  message?: string;
}

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  displayName: string;
  lang: string;
  isTamil: boolean;
  isIndianEnglish: boolean;
  isStandardEnglish: boolean;
}
