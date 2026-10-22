import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Globe, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { RecognitionLanguage, InterfaceLanguage } from '../types/conversation';
import { TRANSLATIONS } from '../utils/translations';
import { AudioWaveform } from './AudioWaveform';

interface VoiceInputBarProps {
  onSendMessage: (text: string) => void;
  isListening: boolean;
  interimTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  recognitionLanguage: RecognitionLanguage;
  onChangeRecognitionLanguage: (lang: RecognitionLanguage) => void;
  isRecognitionSupported: boolean;
  speechError: string | null;
  onClearSpeechError: () => void;
  isLoading: boolean;
  interfaceLanguage?: InterfaceLanguage;
}

export const VoiceInputBar: React.FC<VoiceInputBarProps> = ({
  onSendMessage,
  isListening,
  interimTranscript,
  onStartListening,
  onStopListening,
  recognitionLanguage,
  onChangeRecognitionLanguage,
  isRecognitionSupported,
  speechError,
  onClearSpeechError,
  isLoading,
  interfaceLanguage = 'en'
}) => {
  const [inputText, setInputText] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = TRANSLATIONS[interfaceLanguage];

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getLanguageLabel = (lang: RecognitionLanguage) => {
    switch (lang) {
      case 'ta-IN':
        return 'தமிழ் (Tamil)';
      case 'en-IN':
        return 'English (India)';
      case 'auto':
      default:
        return 'Auto Detect';
    }
  };

  return (
    <div className="voice-input-bar-container">
      {/* Speech Error Banner if any */}
      {speechError && (
        <div className="speech-error-banner" role="alert">
          <AlertCircle size={15} />
          <span className="error-text">{speechError}</span>
          <button 
            className="btn-dismiss-error" 
            onClick={onClearSpeechError}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Listening Drawer / Preview */}
      {isListening && (
        <div className="listening-drawer">
          <div className="listening-pulse-header">
            <div className="flex items-center gap-2">
              <AudioWaveform isActive={true} color="#EA580C" bars={4} />
              <span className="listening-text">
                {t.listeningIn} <strong>{getLanguageLabel(recognitionLanguage)}</strong>...
              </span>
            </div>
            <button 
              className="btn-done-speaking" 
              onClick={onStopListening}
            >
              <Check size={14} /> {t.doneSpeaking}
            </button>
          </div>

          <div className="live-transcript-box">
            {interimTranscript ? (
              <span>"{interimTranscript}"</span>
            ) : (
              <span className="text-gray-400 italic">
                {t.listeningPlaceholder}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Input Control Row */}
      <div className="input-control-row">
        {/* Recognition Language Selector Button */}
        <div className="language-selector-wrapper">
          <button
            type="button"
            className="btn-lang-selector"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            title="Speech Recognition Language"
            aria-label="Change voice recognition language"
          >
            <Globe size={14} />
            <span>
              {recognitionLanguage === 'ta-IN' ? 'தமிழ்' : recognitionLanguage === 'en-IN' ? 'EN' : 'Auto'}
            </span>
          </button>

          {showLanguageMenu && (
            <div className="language-dropdown-menu">
              <button
                className={`lang-option ${recognitionLanguage === 'auto' ? 'active' : ''}`}
                onClick={() => {
                  onChangeRecognitionLanguage('auto');
                  setShowLanguageMenu(false);
                }}
              >
                Auto Detect (தானியங்கி)
              </button>
              <button
                className={`lang-option ${recognitionLanguage === 'ta-IN' ? 'active' : ''}`}
                onClick={() => {
                  onChangeRecognitionLanguage('ta-IN');
                  setShowLanguageMenu(false);
                }}
              >
                தமிழ் (ta-IN)
              </button>
              <button
                className={`lang-option ${recognitionLanguage === 'en-IN' ? 'active' : ''}`}
                onClick={() => {
                  onChangeRecognitionLanguage('en-IN');
                  setShowLanguageMenu(false);
                }}
              >
                English (en-IN)
              </button>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder={isListening ? t.listeningPlaceholder : t.inputPlaceholder}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isListening}
            aria-label="Message input"
          />
        </div>

        {/* Microphone Button */}
        <div className="mic-action-wrapper">
          {isListening ? (
            <button
              type="button"
              className="btn-mic listening"
              onClick={onStopListening}
              title={t.stopSpeakingTooltip}
              aria-label={t.stopSpeakingTooltip}
            >
              <MicOff size={20} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-mic"
              onClick={onStartListening}
              disabled={!isRecognitionSupported}
              title={isRecognitionSupported ? t.startSpeakingTooltip : 'Web Speech is unsupported in this browser'}
              aria-label={t.startSpeakingTooltip}
            >
              <Mic size={20} />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          className="btn-send"
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          title={t.sendTooltip}
          aria-label={t.sendTooltip}
        >
          {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      <div className="input-helper-bar">
        <span>{t.privacyNotice}</span>
        <span>{t.keyboardShortcut}</span>
      </div>
    </div>
  );
};
