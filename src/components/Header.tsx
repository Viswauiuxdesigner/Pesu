import React from 'react';
import { PracticeScenario, AppSettings } from '../types/conversation';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Settings, 
  RotateCcw, 
  Award, 
  Compass, 
  Sun, 
  Moon,
  Globe
} from 'lucide-react';

interface HeaderProps {
  currentScenario: PracticeScenario;
  settings: AppSettings;
  onOpenScenarios: () => void;
  onOpenSummary: () => void;
  onOpenSettings: () => void;
  onResetChat: () => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  settings,
  onOpenScenarios,
  onOpenSummary,
  onOpenSettings,
  onResetChat,
  onToggleLanguage,
  onToggleTheme
}) => {
  const t = TRANSLATIONS[settings.interfaceLanguage];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-link" onClick={onOpenScenarios} title={t.brandTagline}>
          <div className="brand-badge">
            <span>பேசு</span>
          </div>
          <div className="brand-text-col">
            <span className="brand-title">{t.brandName}</span>
            <span className="brand-subtitle">{t.brandTagline}</span>
          </div>
        </div>

        {/* Compact Scenario Pill */}
        <button 
          className="scenario-pill-compact" 
          onClick={onOpenScenarios}
          title={t.changeScenario}
          aria-label={t.changeScenario}
        >
          <Compass size={14} className="text-orange-500" />
          <span>
            {settings.interfaceLanguage === 'ta' ? currentScenario.tamilTitle : currentScenario.title}
          </span>
        </button>
      </div>

      <div className="header-right">
        {/* Quick UI Language Toggle Button */}
        <button
          type="button"
          className="btn-header-action btn-lang-toggle"
          onClick={onToggleLanguage}
          title={`Switch interface language to ${settings.interfaceLanguage === 'en' ? 'தமிழ்' : 'English'}`}
          aria-label="Toggle interface language"
        >
          <Globe size={14} />
          <span>{settings.interfaceLanguage === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          className="btn-header-action"
          onClick={onToggleTheme}
          title="Toggle light/dark theme"
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Session Summary Button */}
        <button
          type="button"
          className="btn-header-action"
          onClick={onOpenSummary}
          title={t.summaryBtn}
          aria-label={t.summaryBtn}
        >
          <Award size={15} />
        </button>

        {/* Reset Conversation */}
        <button
          type="button"
          className="btn-header-action"
          onClick={onResetChat}
          title={t.resetBtn}
          aria-label={t.resetBtn}
        >
          <RotateCcw size={15} />
        </button>

        {/* Settings */}
        <button
          type="button"
          className="btn-header-action"
          onClick={onOpenSettings}
          title={t.settingsBtn}
          aria-label={t.settingsBtn}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
