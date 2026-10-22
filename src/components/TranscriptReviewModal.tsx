import React, { useState, useEffect } from 'react';
import { Send, RotateCcw, X, Edit3, Volume2 } from 'lucide-react';

interface TranscriptReviewModalProps {
  isOpen: boolean;
  transcript: string;
  onSend: (editedTranscript: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  onSpeakPreview?: (text: string) => void;
}

export const TranscriptReviewModal: React.FC<TranscriptReviewModalProps> = ({
  isOpen,
  transcript,
  onSend,
  onRetry,
  onCancel,
  onSpeakPreview
}) => {
  const [editedText, setEditedText] = useState(transcript);

  useEffect(() => {
    setEditedText(transcript);
  }, [transcript]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="review-modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Edit3 size={18} className="text-emerald-400" />
            <h3 className="modal-title">Review & Edit Speech Transcript</h3>
          </div>
          <button className="btn-close-modal" onClick={onCancel} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Review what was heard before sending. You can edit any misheard words or retry speaking if needed:
        </p>

        <div className="transcript-editor-container">
          <textarea
            className="transcript-textarea"
            rows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Review and edit your recognized words here..."
            autoFocus
          />
        </div>

        <div className="modal-footer-actions">
          <button 
            type="button" 
            className="btn-modal-action btn-retry"
            onClick={onRetry}
          >
            <RotateCcw size={16} />
            <span>Retry Speaking</span>
          </button>

          {onSpeakPreview && (
            <button
              type="button"
              className="btn-modal-action btn-secondary"
              onClick={() => onSpeakPreview(editedText)}
              title="Test pronunciation"
            >
              <Volume2 size={16} />
              <span>Preview</span>
            </button>
          )}

          <div className="right-action-group">
            <button 
              type="button" 
              className="btn-modal-action btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-modal-action btn-primary"
              onClick={() => onSend(editedText)}
              disabled={!editedText.trim()}
            >
              <Send size={16} />
              <span>Confirm & Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
