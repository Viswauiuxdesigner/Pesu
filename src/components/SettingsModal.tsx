import React, { useState } from 'react';
import { AppSettings, InterfaceLanguage } from '../types/conversation';
import { VoiceOption } from '../types/speech';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Settings, 
  Cpu, 
  Key, 
  Volume2, 
  Trash2, 
  X, 
  ExternalLink,
  BookOpen,
  Globe,
  Sun
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

  const t = TRANSLATIONS[formData.interfaceLanguage];

  const handleSave = () => {
    onUpdateSettings(formData);
    onClose();
  };

  const handleClearHistoryClick = () => {
    if (window.confirm('Clear your local chat history? This cannot be undone.')) {
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
            <Settings size={20} className="text-orange-500" />
            <h3 className="modal-title">{t.settingsTitle}</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="settings-scroll-area">
          {/* Interface Language & Theme */}
          <div className="settings-group">
            <label className="settings-label">
              <Globe size={16} /> {t.interfaceLangTitle}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn-modal-action ${formData.interfaceLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, interfaceLanguage: 'en' })}
              >
                English
              </button>
              <button
                type="button"
                className={`btn-modal-action ${formData.interfaceLanguage === 'ta' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, interfaceLanguage: 'ta' })}
              >
                தமிழ் (Tamil)
              </button>
            </div>
            <span className="text-xs text-gray-500">{t.interfaceLangDesc}</span>
          </div>

          {/* Theme Selector */}
          <div className="settings-group">
            <label className="settings-label">
              <Sun size={16} /> Theme (தோற்றம்)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn-modal-action ${formData.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, theme: 'light' })}
              >
                Warm Light (வெளிர் நிறம்)
              </button>
              <button
                type="button"
                className={`btn-modal-action ${formData.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, theme: 'dark' })}
              >
                Refined Dark (இருள் நிறம்)
              </button>
            </div>
          </div>

          {/* AI Provider Section */}
          <div className="settings-group">
            <label className="settings-label">
              <Cpu size={16} /> {t.aiEngineTitle}
            </label>
            <div className="provider-options-grid">
              <div 
                className={`provider-card ${formData.aiProvider === 'local' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, aiProvider: 'local' })}
              >
                <div className="provider-header">
                  <span className="provider-name">{t.offlineTutorTitle}</span>
                  <span className="provider-badge-free">{t.offlineTutorBadge}</span>
                </div>
                <p className="provider-desc">{t.offlineTutorDesc}</p>
              </div>

              <div 
                className={`provider-card ${formData.aiProvider === 'gemini' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, aiProvider: 'gemini' })}
              >
                <div className="provider-header">
                  <span className="provider-name">{t.geminiTitle}</span>
                  <span className="provider-badge-ai">{t.geminiBadge}</span>
                </div>
                <p className="provider-desc">{t.geminiDesc}</p>
              </div>
            </div>
          </div>

          {/* Gemini Key Input (if Gemini is selected) */}
          {formData.aiProvider === 'gemini' && (
            <div className="settings-subgroup">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Key size={14} /> {t.apiKeyLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="settings-input"
                  placeholder={t.apiKeyPlaceholder}
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                />
                <button 
                  type="button" 
                  className="btn-modal-action btn-secondary" 
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? t.hide : t.show}
                </button>
              </div>
              <span className="text-xs text-gray-500">{t.apiKeyNotice}</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 hover:underline mt-1"
              >
                <span>{t.getKeyLink}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Voice & Speech Controls */}
          <div className="settings-group">
            <label className="settings-label">
              <Volume2 size={16} /> {t.voiceSettingsTitle}
            </label>

            <div className="toggle-row">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between text-xs font-medium">
                  <span>{t.speakingRate}</span>
                  <span className="font-bold text-orange-600">{formData.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={formData.speechRate}
                  onChange={(e) => setFormData({ ...formData, speechRate: parseFloat(e.target.value) })}
                  className="settings-slider"
                />
                <span className="text-xs text-gray-400">
                  {formData.speechRate < 0.95 ? t.rateSlowHint : formData.speechRate > 1.05 ? t.rateFastHint : t.rateNormalHint}
                </span>
              </div>
            </div>

            <div className="toggle-row">
              <div className="flex flex-col">
                <span className="toggle-title">{t.autoSpeakTitle}</span>
                <span className="toggle-desc">{t.autoSpeakDesc}</span>
              </div>
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={formData.autoSpeakResponses}
                onChange={(e) => setFormData({ ...formData, autoSpeakResponses: e.target.checked })}
              />
            </div>

            {availableVoices.length > 0 && (
              <div className="toggle-row flex-col items-start gap-2">
                <label className="text-xs font-semibold">{t.systemVoiceTitle}</label>
                <select
                  className="settings-select"
                  value={formData.preferredVoiceURI || ''}
                  onChange={(e) => setFormData({ ...formData, preferredVoiceURI: e.target.value })}
                >
                  <option value="">{t.defaultVoice}</option>
                  {availableVoices.map((v) => (
                    <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                      {v.displayName} {v.isTamil ? '⭐️ [Tamil]' : v.isIndianEnglish ? '🇮🇳 [Indian English]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Learning Preferences */}
          <div className="settings-group">
            <label className="settings-label">
              <BookOpen size={16} /> {formData.interfaceLanguage === 'ta' ? 'கற்றல் விருப்பங்கள்' : 'Learning Preferences'}
            </label>
            <div className="toggle-row">
              <div className="flex flex-col">
                <span className="toggle-title">{t.alwaysTamilTitle}</span>
                <span className="toggle-desc">{t.alwaysTamilDesc}</span>
              </div>
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={formData.alwaysShowTamilExplanation}
                onChange={(e) => setFormData({ ...formData, alwaysShowTamilExplanation: e.target.checked })}
              />
            </div>
          </div>

          {/* Privacy & Local History */}
          <div className="settings-group">
            <label className="settings-label text-rose-500">
              <Trash2 size={16} /> {t.privacyDataTitle}
            </label>
            <div className="flex justify-between items-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/40">
              <span className="text-xs text-gray-600 dark:text-gray-400">{t.privacyDataDesc}</span>
              <button
                type="button"
                className="btn-clear-history"
                onClick={handleClearHistoryClick}
              >
                <Trash2 size={13} /> {t.clearHistoryBtn}
              </button>
            </div>
            {historyClearedNotice && (
              <span className="text-xs text-emerald-600 font-semibold">{t.historyClearedMsg}</span>
            )}
          </div>
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-modal-action btn-cancel" onClick={onClose}>
            {t.cancelBtn}
          </button>
          <button type="button" className="btn-modal-action btn-primary" onClick={handleSave}>
            {t.saveChangesBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
