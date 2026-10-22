import React from 'react';
import { SessionStats } from '../types/conversation';
import { Award, CheckCircle2, BookOpen, Clock, MessageSquare, X, RotateCcw } from 'lucide-react';

interface PracticeSummaryModalProps {
  isOpen: boolean;
  stats: SessionStats | null;
  onClose: () => void;
  onResetSession: () => void;
}

export const PracticeSummaryModal: React.FC<PracticeSummaryModalProps> = ({
  isOpen,
  stats,
  onClose,
  onResetSession
}) => {
  if (!isOpen || !stats) return null;

  return (
    <div className="modal-backdrop">
      <div className="summary-modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Award size={22} className="text-amber-400" />
            <h3 className="modal-title">Practice Session Summary / பயிற்சி சுருக்கம்</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Confidence rating banner */}
        <div className="confidence-banner">
          <div className="score-circle">
            <span className="score-number">{stats.confidenceScore}%</span>
            <span className="score-label">Fluency Boost</span>
          </div>
          <div className="score-message">
            <h4>Superb effort! மிகச்சிறப்பான முயற்சி!</h4>
            <p>Every minute of speaking reduces hesitation. Regular practice turns English into natural habit.</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="stats-pill-grid">
          <div className="stat-pill">
            <MessageSquare size={16} />
            <span className="stat-value">{stats.spokenCount}</span>
            <span className="stat-name">Messages Sent</span>
          </div>
          <div className="stat-pill">
            <Clock size={16} />
            <span className="stat-value">{stats.durationMinutes} min</span>
            <span className="stat-name">Practice Time</span>
          </div>
          <div className="stat-pill">
            <CheckCircle2 size={16} />
            <span className="stat-value">{stats.correctionsCount}</span>
            <span className="stat-name">Speaking Tips</span>
          </div>
        </div>

        {/* Useful Phrases Learned */}
        <div className="summary-section">
          <h5 className="section-title">
            <BookOpen size={16} className="text-emerald-400" /> Key Phrases Practiced:
          </h5>
          <div className="phrases-list">
            {stats.phrasesLearned.length > 0 ? (
              stats.phrasesLearned.map((phrase, idx) => (
                <div key={idx} className="phrase-item">
                  <span className="phrase-bullet">✓</span>
                  <span className="phrase-text">{phrase}</span>
                </div>
              ))
            ) : (
              <p className="empty-text">No grammar corrections were needed in this round! Great job.</p>
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
            <RotateCcw size={16} />
            <span>Start New Session</span>
          </button>

          <button 
            type="button" 
            className="btn-modal-action btn-primary"
            onClick={onClose}
          >
            Continue Practice
          </button>
        </div>
      </div>
    </div>
  );
};
