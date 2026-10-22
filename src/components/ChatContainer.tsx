import React, { useEffect, useRef } from 'react';
import { Message, PracticeScenario } from '../types/conversation';
import { MessageBubble } from './MessageBubble';
import { Sparkles, MessageCircle } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  scenario: PracticeScenario;
  currentlyPlayingId: string | null;
  onSpeak: (id: string, text: string, lang: 'ta' | 'en') => void;
  onStop: () => void;
  onRepeat: () => void;
  onSelectStarterPrompt: (promptText: string) => void;
  isLoading: boolean;
  alwaysShowTamil?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  scenario,
  currentlyPlayingId,
  onSpeak,
  onStop,
  onRepeat,
  onSelectStarterPrompt,
  isLoading,
  alwaysShowTamil
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-container">
      {/* Scenario header banner inside chat */}
      <div className="scenario-welcome-card">
        <div className="scenario-card-header">
          <div className="scenario-badge">
            <Sparkles size={15} />
            <span>{scenario.title}</span>
            <span className="tamil-sub">({scenario.tamilTitle})</span>
          </div>
        </div>
        <p className="scenario-desc-en">{scenario.description}</p>
        <p className="scenario-desc-ta">{scenario.tamilDescription}</p>

        {/* Starter Prompts */}
        {messages.length <= 1 && (
          <div className="starter-prompts-section">
            <span className="starter-header">
              <MessageCircle size={15} /> Quick Starter Prompts (தொடக்க வாக்கியங்கள்):
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
                  {p.tamil && <span className="starter-tamil">({p.tamil})</span>}
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
          />
        ))}

        {isLoading && (
          <div className="message-wrapper assistant-wrapper">
            <div className="assistant-avatar">
              <span>பேசு</span>
            </div>
            <div className="message-bubble assistant-bubble typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-text">PESU is thinking & listening...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: '1px' }} />
      </div>
    </div>
  );
};
