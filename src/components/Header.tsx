import React from 'react';
import { PracticeScenario, AppSettings } from '../types/conversation';
import { 
  Sparkles, 
  Settings, 
  RotateCcw, 
  Award, 
  Compass, 
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface HeaderProps {
  currentScenario: PracticeScenario;
  settings: AppSettings;
  onOpenScenarios: () => void;
  onOpenSummary: () => void;
  onOpenSettings: () => void;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  settings,
  onOpenScenarios,
  onOpenSummary,
  onOpenSettings,
  onResetChat
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-logo-container">
          <div className="brand-icon">
            <span>பேசு</span>
          </div>
          <div className="brand-text-group">
            <div className="brand-row">
              <h1 className="brand-title">PESU</h1>
              <span className="brand-tag">Bilingual AI Partner</span>
            </div>
            <span className="brand-sub">Tamil + English Speaking Practice</span>
          </div>
        </div>

        {/* Current Scenario Pill */}
        <button 
          className="scenario-pill-btn" 
          onClick={onOpenScenarios}
          title="Click to change practice scenario"
        >
          <Compass size={14} className="text-emerald-400" />
          <span className="pill-name">{currentScenario.title}</span>
          <span className="pill-ta">({currentScenario.tamilTitle})</span>
        </button>
      </div>

      <div className="header-right">
        {/* Provider Indicator */}
        <div className="provider-indicator-tag" title="Active AI Engine">
          <Cpu size={14} />
          <span>{settings.aiProvider === 'local' ? 'PESU Local Engine (Zero-Cost)' : 'Gemini 2.0 Flash'}</span>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-group">
          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenSummary}
            title="Session Summary & Progress (பயிற்சி சுருக்கம்)"
            aria-label="View session summary"
          >
            <Award size={18} />
            <span className="btn-label-desktop">Summary</span>
          </button>

          <button
            type="button"
            className="header-icon-btn"
            onClick={onResetChat}
            title="Reset Conversation (புதிதாக தொடங்கு)"
            aria-label="Reset conversation"
          >
            <RotateCcw size={18} />
            <span className="btn-label-desktop">Reset</span>
          </button>

          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenSettings}
            title="Settings (அமைப்புகள்)"
            aria-label="Open settings"
          >
            <Settings size={18} />
            <span className="btn-label-desktop">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
