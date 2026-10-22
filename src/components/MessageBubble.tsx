import React, { useState } from 'react';
import { Message } from '../types/conversation';
import { Volume2, VolumeX, RotateCcw, Sparkles, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';

interface MessageBubbleProps {
  message: Message;
  isPlaying: boolean;
  onSpeak: (text: string, lang: 'ta' | 'en') => void;
  onStop: () => void;
  onRepeat: () => void;
  onSelectSuggestion?: (text: string) => void;
  alwaysShowTamil?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isPlaying,
  onSpeak,
  onStop,
  onRepeat,
  onSelectSuggestion,
  alwaysShowTamil = false
}) => {
  const isUser = message.role === 'user';
  const [showTamil, setShowTamil] = useState<boolean>(alwaysShowTamil);

  const getLanguageBadge = (lang?: string) => {
    switch (lang) {
      case 'tamil':
        return <span className="lang-badge badge-tamil">தமிழ் (Tamil)</span>;
      case 'tanglish':
        return <span className="lang-badge badge-tanglish">Tanglish (Romanized)</span>;
      case 'mixed':
        return <span className="lang-badge badge-mixed">Tamil + English</span>;
      case 'english':
        return <span className="lang-badge badge-english">English</span>;
      default:
        return null;
    }
  };

  if (isUser) {
    return (
      <div className="message-wrapper user-wrapper">
        <div className="message-bubble user-bubble">
          <div className="message-header-row">
            <span className="sender-label">You</span>
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
            <span className="sender-label font-bold">PESU Partner</span>
            <span className="sub-badge">Speaking Coach</span>
          </div>

          <div className="audio-actions">
            {isPlaying ? (
              <button 
                className="btn-icon-audio active" 
                onClick={onStop}
                title="Stop speaking"
                aria-label="Stop speaking"
              >
                <AudioWaveform isActive={true} color="#10b981" bars={4} />
                <VolumeX size={16} />
              </button>
            ) : (
              <button 
                className="btn-icon-audio" 
                onClick={() => onSpeak(message.content, 'en')}
                title="Listen in English"
                aria-label="Speak response"
              >
                <Volume2 size={16} />
                <span>Listen</span>
              </button>
            )}

            <button 
              className="btn-icon-audio" 
              onClick={onRepeat}
              title="Repeat audio"
              aria-label="Repeat response"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Main AI reply */}
        <div className="message-content leading-relaxed whitespace-pre-line">
          {message.content}
        </div>

        {/* Gentle Grammar Correction Card */}
        {message.grammarCorrection && (
          <div className="grammar-correction-card">
            <div className="card-header">
              <Sparkles size={16} className="text-amber-400" />
              <span className="card-title">💡 Speaking Tip / வாக்கிய திருத்தம்</span>
            </div>
            
            <div className="correction-diff">
              <div className="diff-item original">
                <span className="diff-tag">Your phrase:</span>
                <span className="diff-text strikethrough">"{message.grammarCorrection.original}"</span>
              </div>
              <div className="diff-item improved">
                <span className="diff-tag">Natural English:</span>
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
            <span className="font-semibold text-xs text-sky-400">உச்சரிப்பு (Pronunciation):</span>
            <span className="pronunciation-text">{message.pronunciationGuide}</span>
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
              <BookOpen size={15} />
              <span>தமிழ் விளக்கம் (Tamil Explanation)</span>
              {showTamil ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showTamil && (
              <div className="tamil-explanation-content">
                <p>{message.tamilExplanation}</p>
                <button 
                  className="btn-listen-tamil"
                  onClick={() => onSpeak(message.tamilExplanation!, 'ta')}
                >
                  <Volume2 size={14} />
                  <span>தமிழில் கேள் (Listen in Tamil)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Suggested Follow-up Response Chips */}
        {message.suggestedResponses && message.suggestedResponses.length > 0 && onSelectSuggestion && (
          <div className="suggestion-chips-container">
            <span className="suggestion-label">Try replying:</span>
            <div className="chips-wrapper">
              {message.suggestedResponses.map((suggestion, idx) => (
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
