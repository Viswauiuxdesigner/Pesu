import React, { useState } from 'react';
import { AppSettings, AIProviderType } from '../types/conversation';
import { VoiceOption } from '../types/speech';
import { 
  Settings, 
  Cpu, 
  Key, 
  Volume2, 
  Trash2, 
  X, 
  ShieldCheck, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearHistory: () => void;
  onClose: () => void;
  availableVoices: VoiceOption[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClearHistory,
  onClose,
  availableVoices
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [historyClearedNotice, setHistoryClearedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(formData);
    onClose();
  };

  const handleClearHistoryClick = () => {
    if (window.confirm('Are you sure you want to clear your local chat history? This cannot be undone.')) {
      onClearHistory();
      setHistoryClearedNotice(true);
      setTimeout(() => setHistoryClearedNotice(false), 3000);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="settings-modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Settings size={22} className="text-emerald-400" />
            <h3 className="modal-title">Settings & AI Configuration</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="settings-scroll-area">
          {/* AI Provider Section */}
          <div className="settings-group">
            <label className="settings-label">
              <Cpu size={16} /> AI Conversation Engine
            </label>
            <div className="provider-options-grid">
              <div 
                className={`provider-card ${formData.aiProvider === 'local' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, aiProvider: 'local' })}
              >
                <div className="provider-header">
                  <span className="provider-name">PESU Offline Engine</span>
                  <span className="provider-badge-free">100% Free / No Key</span>
                </div>
                <p className="provider-desc">
                  Built-in zero-cost speaking partner with Tamil explanation, rule-based corrections, and scenario graphs. Instant and fully offline.
                </p>
              </div>

              <div 
                className={`provider-card ${formData.aiProvider === 'gemini' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, aiProvider: 'gemini' })}
              >
                <div className="provider-header">
                  <span className="provider-name">Google Gemini 2.0 Flash</span>
                  <span className="provider-badge-ai">Cloud Free Tier</span>
                </div>
                <p className="provider-desc">
                  Uses Google's generative AI for open-ended conversation. Requires your own free Gemini API key or serverless endpoint.
                </p>
              </div>
            </div>
          </div>

          {/* Gemini Key Input (if Gemini is selected) */}
          {formData.aiProvider === 'gemini' && (
            <div className="settings-subgroup">
              <label className="settings-sublabel">
                <Key size={15} /> Your Free Gemini API Key (Optional Client-Side)
              </label>
              <div className="api-key-input-row">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="settings-input"
                  placeholder="Paste your AI Studio API key (AIzaSy...)"
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                />
                <button 
                  type="button" 
                  className="btn-toggle-key" 
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="security-notice">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Saved securely in your browser's localStorage only. Never transmitted to PESU servers.</span>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="get-key-link"
              >
                <span>Get a free Gemini API key from Google AI Studio</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Voice & Speech Controls */}
          <div className="settings-group">
            <label className="settings-label">
              <Volume2 size={16} /> Voice & Speech Settings
            </label>

            {/* Speech Rate Slider */}
            <div className="slider-control-row">
              <div className="slider-label-group">
                <span>Speaking Rate:</span>
                <span className="slider-val">{formData.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={formData.speechRate}
                onChange={(e) => setFormData({ ...formData, speechRate: parseFloat(e.target.value) })}
                className="settings-slider"
              />
              <span className="slider-hint">
                {formData.speechRate < 0.95 ? 'Slower (Great for learners)' : formData.speechRate > 1.05 ? 'Fast' : 'Natural pace'}
              </span>
            </div>

            {/* Auto speak responses */}
            <div className="toggle-row">
              <div className="toggle-text">
                <span className="toggle-title">Auto-speak AI responses</span>
                <span className="toggle-desc">Automatically read aloud the English reply when received</span>
              </div>
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={formData.autoSpeakResponses}
                onChange={(e) => setFormData({ ...formData, autoSpeakResponses: e.target.checked })}
              />
            </div>

            {/* Voice dropdown */}
            {availableVoices.length > 0 && (
              <div className="select-row">
                <label className="settings-sublabel">Preferred System Voice:</label>
                <select
                  className="settings-select"
                  value={formData.preferredVoiceURI || ''}
                  onChange={(e) => setFormData({ ...formData, preferredVoiceURI: e.target.value })}
                >
                  <option value="">Default Recommended Voice</option>
                  {availableVoices.map((v) => (
                    <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                      {v.displayName} {v.isTamil ? '⭐️ [Tamil]' : v.isIndianEnglish ? '🇮🇳 [Indian English]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Language & Teaching Preferences */}
          <div className="settings-group">
            <label className="settings-label">
              <BookOpen size={16} /> Learning Preferences
            </label>
            <div className="toggle-row">
              <div className="toggle-text">
                <span className="toggle-title">Always show Tamil explanations</span>
                <span className="toggle-desc">Automatically expand the Tamil explanation card on every message</span>
              </div>
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={formData.alwaysShowTamilExplanation}
                onChange={(e) => setFormData({ ...formData, alwaysShowTamilExplanation: e.target.checked })}
              />
            </div>
          </div>

          {/* Data & History */}
          <div className="settings-group">
            <label className="settings-label text-rose-400">
              <Trash2 size={16} /> Privacy & Local Data
            </label>
            <div className="clear-data-row">
              <p className="clear-data-desc">
                Your conversation history is stored strictly on your device. You can reset it anytime.
              </p>
              <button
                type="button"
                className="btn-clear-history"
                onClick={handleClearHistoryClick}
              >
                <Trash2 size={15} /> Clear Chat History
              </button>
            </div>
            {historyClearedNotice && (
              <p className="history-cleared-text">✓ Chat history cleared successfully.</p>
            )}
          </div>
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-modal-action btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-modal-action btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
