import React from 'react';
import { SessionStats, InterfaceLanguage } from '../types/conversation';
import { TRANSLATIONS } from '../utils/translations';
import { Award, CheckCircle2, BookOpen, Clock, MessageSquare, X, RotateCcw } from 'lucide-react';

interface PracticeSummaryModalProps {
  isOpen: boolean;
  stats: SessionStats | null;
  onClose: () => void;
  onResetSession: () => void;
  interfaceLanguage?: InterfaceLanguage;
}

export const PracticeSummaryModal: React.FC<PracticeSummaryModalProps> = ({
  isOpen,
  stats,
  onClose,
  onResetSession,
  interfaceLanguage = 'en'
}) => {
  if (!isOpen || !stats) return null;

  const t = TRANSLATIONS[interfaceLanguage];

  return (
    <div className="modal-backdrop">
      <div className="summary-modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Award size={20} className="text-orange-500" />
            <h3 className="modal-title">{t.summaryTitle}</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Confidence rating banner */}
        <div className="confidence-banner">
          <div className="score-circle">
            <span className="score-number">{stats.confidenceScore}%</span>
            <span className="score-label">{t.fluencyBoost}</span>
          </div>
          <div className="score-message">
            <h4>{t.effortPraise}</h4>
            <p>{t.effortSub}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="stats-pill-grid">
          <div className="stat-pill">
            <MessageSquare size={14} className="text-orange-600" />
            <span className="stat-value">{stats.spokenCount}</span>
            <span className="stat-name">{t.messagesSent}</span>
          </div>
          <div className="stat-pill">
            <Clock size={14} className="text-orange-600" />
            <span className="stat-value">{stats.durationMinutes} min</span>
            <span className="stat-name">{t.practiceTime}</span>
          </div>
          <div className="stat-pill">
            <CheckCircle2 size={14} className="text-orange-600" />
            <span className="stat-value">{stats.correctionsCount}</span>
            <span className="stat-name">{t.speakingTips}</span>
          </div>
        </div>

        {/* Useful Phrases Practiced */}
        <div className="summary-section">
          <h5 className="section-title">
            <BookOpen size={15} className="text-orange-600" /> {t.keyPhrasesPracticed}
          </h5>
          <div className="phrases-list">
            {stats.phrasesLearned.length > 0 ? (
              stats.phrasesLearned.map((phrase, idx) => (
                <div key={idx} className="phrase-item">
                  <span className="phrase-bullet">✓</span>
                  <span className="text-sm">{phrase}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">{t.noCorrectionsNeeded}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="modal-footer-actions">
          <button 
            type="button" 
            className="btn-modal-action btn-secondary"
            onClick={onResetSession}
          >
            <RotateCcw size={14} />
            <span>{t.startNewSession}</span>
          </button>

          <button 
            type="button" 
            className="btn-modal-action btn-primary"
            onClick={onClose}
          >
            {t.continuePractice}
          </button>
        </div>
      </div>
    </div>
  );
};
