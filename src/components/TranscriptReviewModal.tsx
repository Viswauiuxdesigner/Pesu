import React, { useState, useEffect } from 'react';
import { InterfaceLanguage } from '../types/conversation';
import { TRANSLATIONS } from '../utils/translations';
import { Send, RotateCcw, X, Edit3, Volume2 } from 'lucide-react';

interface TranscriptReviewModalProps {
  isOpen: boolean;
  transcript: string;
  onSend: (editedTranscript: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  onSpeakPreview?: (text: string) => void;
  interfaceLanguage?: InterfaceLanguage;
}

export const TranscriptReviewModal: React.FC<TranscriptReviewModalProps> = ({
  isOpen,
  transcript,
  onSend,
  onRetry,
  onCancel,
  onSpeakPreview,
  interfaceLanguage = 'en'
}) => {
  const [editedText, setEditedText] = useState(transcript);
  const t = TRANSLATIONS[interfaceLanguage];

  useEffect(() => {
    setEditedText(transcript);
  }, [transcript]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="review-modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Edit3 size={18} className="text-orange-500" />
            <h3 className="modal-title">{t.reviewTitle}</h3>
          </div>
          <button className="btn-close-modal" onClick={onCancel} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">{t.reviewDesc}</p>

        <div className="transcript-editor-container">
          <textarea
            className="transcript-textarea"
            rows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder={t.reviewPlaceholder}
            autoFocus
          />
        </div>

        <div className="modal-footer-actions">
          <button 
            type="button" 
            className="btn-modal-action btn-retry"
            onClick={onRetry}
          >
            <RotateCcw size={14} />
            <span>{t.retrySpeaking}</span>
          </button>

          {onSpeakPreview && (
            <button
              type="button"
              className="btn-modal-action btn-secondary"
              onClick={() => onSpeakPreview(editedText)}
              title={t.previewAudio}
            >
              <Volume2 size={14} />
              <span>{t.previewAudio}</span>
            </button>
          )}

          <div className="right-action-group">
            <button 
              type="button" 
              className="btn-modal-action btn-cancel"
              onClick={onCancel}
            >
              {t.cancelBtn}
            </button>
            <button 
              type="button" 
              className="btn-modal-action btn-primary"
              onClick={() => onSend(editedText)}
              disabled={!editedText.trim()}
            >
              <Send size={14} />
              <span>{t.confirmSendBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
