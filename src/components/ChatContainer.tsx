import React, { useEffect, useRef } from 'react';
import { Message, PracticeScenario, InterfaceLanguage } from '../types/conversation';
import { MessageBubble } from './MessageBubble';
import { TRANSLATIONS } from '../utils/translations';
import { MessageCircle, RefreshCw } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  scenario: PracticeScenario;
  currentlyPlayingId: string | null;
  onSpeak: (id: string, text: string, lang: 'ta' | 'en') => void;
  onStop: () => void;
  onRepeat: () => void;
  onSelectStarterPrompt: (promptText: string) => void;
  onRetryLastMessage?: () => void;
  isLoading: boolean;
  alwaysShowTamil?: boolean;
  interfaceLanguage?: InterfaceLanguage;
  error?: string | null;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  scenario,
  currentlyPlayingId,
  onSpeak,
  onStop,
  onRepeat,
  onSelectStarterPrompt,
  onRetryLastMessage,
  isLoading,
  alwaysShowTamil,
  interfaceLanguage = 'en',
  error
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[interfaceLanguage];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  // Find the ID of the last assistant message so chips only show on it
  const lastAssistantMessageId = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  return (
    <div className="chat-container">
      {/* Compact Scenario Welcome Card */}
      <div className="scenario-welcome-card">
        <div className="scenario-card-header">
          <div className="scenario-badge">
            <span>
              {interfaceLanguage === 'ta' ? scenario.tamilTitle : scenario.title}
            </span>
          </div>
        </div>
        <p className="scenario-desc-en">
          {interfaceLanguage === 'ta' ? scenario.tamilDescription : scenario.description}
        </p>

        {/* Starter Prompts - Shown when beginning a session */}
        {messages.length <= 1 && (
          <div className="starter-prompts-section">
            <span className="starter-header">
              <MessageCircle size={14} /> {t.quickStarters}
            </span>
            <div className="starter-grid">
              {scenario.starterPrompts.map((p, idx) => (
                <button
                  key={idx}
                  className="starter-prompt-btn"
                  onClick={() => onSelectStarterPrompt(p.tanglish || p.english || '')}
                >
                  <span className="starter-label">{p.label}</span>
                  <span className="starter-tanglish">"{p.tanglish}"</span>
                  {interfaceLanguage === 'ta' && p.tamil && (
                    <span className="starter-tamil">{p.tamil}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="messages-list">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isPlaying={currentlyPlayingId === message.id}
            onSpeak={(text, lang) => onSpeak(message.id, text, lang)}
            onStop={onStop}
            onRepeat={onRepeat}
            onSelectSuggestion={onSelectStarterPrompt}
            alwaysShowTamil={alwaysShowTamil}
            interfaceLanguage={interfaceLanguage}
            isLatestAssistantMessage={message.id === lastAssistantMessageId}
          />
        ))}

        {/* Typing State */}
        {isLoading && (
          <div className="message-wrapper assistant-wrapper">
            <div className="assistant-avatar">
              <span>பேசு</span>
            </div>
            <div className="message-bubble assistant-bubble typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-text">{t.thinking}</span>
            </div>
          </div>
        )}

        {/* Network / Error retry card */}
        {error && (
          <div className="speech-error-banner" role="alert">
            <span className="error-text">{error}</span>
            {onRetryLastMessage && (
              <button className="btn-modal-action btn-secondary" onClick={onRetryLastMessage}>
                <RefreshCw size={13} /> {t.retryBtn}
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} style={{ height: '1px' }} />
      </div>
    </div>
  );
};
