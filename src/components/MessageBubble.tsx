import React, { useState } from 'react';
import { Message, InterfaceLanguage } from '../types/conversation';
import { TRANSLATIONS } from '../utils/translations';
import { Volume2, VolumeX, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';

interface MessageBubbleProps {
  message: Message;
  isPlaying: boolean;
  onSpeak: (text: string, lang: 'ta' | 'en') => void;
  onStop: () => void;
  onRepeat: () => void;
  onSelectSuggestion?: (text: string) => void;
  alwaysShowTamil?: boolean;
  interfaceLanguage?: InterfaceLanguage;
  isLatestAssistantMessage?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isPlaying,
  onSpeak,
  onStop,
  onRepeat,
  onSelectSuggestion,
  alwaysShowTamil = false,
  interfaceLanguage = 'en',
  isLatestAssistantMessage = false
}) => {
  const isUser = message.role === 'user';
  const [showTamil, setShowTamil] = useState<boolean>(alwaysShowTamil);
  const t = TRANSLATIONS[interfaceLanguage];

  const getLanguageBadge = (lang?: string) => {
    switch (lang) {
      case 'tamil':
        return <span className="lang-badge">தமிழ்</span>;
      case 'tanglish':
        return <span className="lang-badge">Tanglish</span>;
      case 'mixed':
        return <span className="lang-badge">Tamil + English</span>;
      case 'english':
        return <span className="lang-badge">English</span>;
      default:
        return null;
    }
  };

  if (isUser) {
    return (
      <div className="message-wrapper user-wrapper">
        <div className="message-bubble user-bubble">
          <div className="message-header-row">
            <span className="sender-label">{t.you}</span>
            {getLanguageBadge(message.detectedLanguage)}
          </div>
          <div className="message-content">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-wrapper assistant-wrapper">
      <div className="assistant-avatar">
        <span>பேசு</span>
      </div>
      <div className="message-bubble assistant-bubble">
        <div className="message-header-row">
          <div className="assistant-title-group">
            <span className="sender-label">{t.brandName}</span>
            <span className="sub-badge">{t.speakingCoach}</span>
          </div>

          <div className="audio-actions">
            {isPlaying ? (
              <button 
                className="btn-icon-audio active" 
                onClick={onStop}
                title={t.stop}
                aria-label={t.stop}
              >
                <AudioWaveform isActive={true} color="#FFFFFF" bars={3} />
                <VolumeX size={14} />
              </button>
            ) : (
              <button 
                className="btn-icon-audio" 
                onClick={() => onSpeak(message.content, 'en')}
                title={t.listen}
                aria-label={t.listen}
              >
                <Volume2 size={14} />
                <span>{t.listen}</span>
              </button>
            )}

            <button 
              className="btn-icon-audio" 
              onClick={onRepeat}
              title={t.repeat}
              aria-label={t.repeat}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Main AI reply */}
        <div className="message-content whitespace-pre-line">
          {message.content}
        </div>

        {/* Gentle Grammar Correction Card */}
        {message.grammarCorrection && (
          <div className="grammar-correction-card">
            <div className="card-header">
              <span className="card-title">{t.speakingTip}</span>
            </div>
            
            <div className="correction-diff">
              <div className="diff-item original">
                <span className="diff-tag">{t.yourPhrase}</span>
                <span className="diff-text strikethrough">"{message.grammarCorrection.original}"</span>
              </div>
              <div className="diff-item improved">
                <span className="diff-tag">{t.naturalEnglish}</span>
                <span className="diff-text highlight">"{message.grammarCorrection.improved}"</span>
              </div>
            </div>

            <p className="explanation-en">{message.grammarCorrection.explanationInEnglish}</p>
            {message.grammarCorrection.explanationInTamil && (
              <p className="explanation-ta">{message.grammarCorrection.explanationInTamil}</p>
            )}
          </div>
        )}

        {/* Pronunciation guide */}
        {message.pronunciationGuide && (
          <div className="pronunciation-card">
            <span className="pronunciation-text">🗣️ {message.pronunciationGuide}</span>
          </div>
        )}

        {/* Tamil Explanation Accordion */}
        {message.tamilExplanation && (
          <div className="tamil-explanation-box">
            <button 
              className="btn-toggle-tamil"
              onClick={() => setShowTamil(!showTamil)}
              aria-expanded={showTamil}
            >
              <span>{t.tamilExplanation}</span>
              {showTamil ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTamil && (
              <div className="tamil-explanation-content">
                <p>{message.tamilExplanation}</p>
                <button 
                  className="btn-listen-tamil"
                  onClick={() => onSpeak(message.tamilExplanation!, 'ta')}
                >
                  <Volume2 size={13} />
                  <span>{t.listenInTamil}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Suggested Follow-up Response Chips - Only show on the latest assistant message */}
        {isLatestAssistantMessage && message.suggestedResponses && message.suggestedResponses.length > 0 && onSelectSuggestion && (
          <div className="suggestion-chips-container">
            <div className="chips-wrapper">
              {message.suggestedResponses.slice(0, 3).map((suggestion, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
