import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Globe, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { RecognitionLanguage } from '../types/conversation';
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
  isLoading
}) => {
  const [inputText, setInputText] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
          <AlertCircle size={16} />
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
            <AudioWaveform isActive={true} color="#ef4444" bars={6} />
            <span className="listening-text">
              Listening in <strong>{getLanguageLabel(recognitionLanguage)}</strong>...
            </span>
            <button 
              className="btn-done-speaking" 
              onClick={onStopListening}
            >
              <Check size={16} /> Done Speaking
            </button>
          </div>

          <div className="live-transcript-box">
            {interimTranscript ? (
              <span className="live-transcript-text">"{interimTranscript}"</span>
            ) : (
              <span className="live-transcript-placeholder">
                Speak now... You can speak Tamil, Tanglish, or English.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Input Control Bar */}
      <div className="input-control-row">
        {/* Language Selector Dropdown Button */}
        <div className="language-selector-wrapper">
          <button
            type="button"
            className="btn-lang-selector"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            title="Speech Recognition Language"
            aria-label="Change voice recognition language"
          >
            <Globe size={16} />
            <span className="lang-code-text">
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
                English - India (en-IN)
              </button>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder={
              isListening 
                ? "Listening to your voice..." 
                : "Type Tamil, Tanglish, or English (e.g. 'I am go to office yesterday' or 'Enakku hesitating irukku')..."
            }
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
              className="btn-mic listening active-pulse"
              onClick={onStopListening}
              title="Stop listening"
              aria-label="Stop microphone"
            >
              <MicOff size={22} />
            </button>
          ) : (
            <button
              type="button"
              className={`btn-mic ${!isRecognitionSupported ? 'disabled' : ''}`}
              onClick={onStartListening}
              title={
                isRecognitionSupported 
                  ? "Start Speaking (Tamil or English)" 
                  : "Voice recognition unsupported on this browser (use text)"
              }
              aria-label="Start microphone"
            >
              <Mic size={22} />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          className="btn-send"
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          title="Send message (Enter)"
          aria-label="Send message"
        >
          {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      <div className="input-helper-bar">
        <span className="privacy-text">
          🔒 Voice is processed in real time and never stored. Free & zero cost.
        </span>
        <span className="kbd-shortcut-text">Press <strong>Enter ↵</strong> to send</span>
      </div>
    </div>
  );
};
