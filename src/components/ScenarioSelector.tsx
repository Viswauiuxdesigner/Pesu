import React from 'react';
import { PRACTICE_SCENARIOS } from '../services/ai/scenarios';
import { ScenarioId, InterfaceLanguage } from '../types/conversation';
import { TRANSLATIONS } from '../utils/translations';
import { 
  MessageSquare, 
  Briefcase, 
  Users, 
  Coffee, 
  PhoneCall, 
  Utensils, 
  X, 
  Check 
} from 'lucide-react';

interface ScenarioSelectorProps {
  isOpen: boolean;
  activeScenarioId: ScenarioId;
  onSelectScenario: (id: ScenarioId) => void;
  onClose: () => void;
  interfaceLanguage?: InterfaceLanguage;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  isOpen,
  activeScenarioId,
  onSelectScenario,
  onClose,
  interfaceLanguage = 'en'
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[interfaceLanguage];

  const getScenarioIcon = (id: ScenarioId) => {
    switch (id) {
      case 'interview':
        return <Briefcase size={20} className="text-orange-600" />;
      case 'office_meeting':
        return <Users size={20} className="text-orange-600" />;
      case 'everyday_chat':
        return <Coffee size={20} className="text-orange-600" />;
      case 'phone_call':
        return <PhoneCall size={20} className="text-orange-600" />;
      case 'restaurant':
        return <Utensils size={20} className="text-orange-600" />;
      case 'free_talk':
      default:
        return <MessageSquare size={20} className="text-orange-600" />;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="scenario-modal-card">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{t.scenariosTitle}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t.scenariosSubtitle}</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="scenarios-grid">
          {PRACTICE_SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === activeScenarioId;
            return (
              <div
                key={scenario.id}
                className={`scenario-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectScenario(scenario.id);
                  onClose();
                }}
                role="button"
                tabIndex={0}
              >
                <div className="scenario-card-top">
                  <div className="scenario-icon-box">
                    {getScenarioIcon(scenario.id)}
                  </div>
                  {isSelected && (
                    <span className="selected-tag">
                      <Check size={12} /> {t.activeTag}
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <h4 className="scenario-title-en">
                    {interfaceLanguage === 'ta' ? scenario.tamilTitle : scenario.title}
                  </h4>
                  {interfaceLanguage !== 'ta' && (
                    <span className="scenario-title-ta">{scenario.tamilTitle}</span>
                  )}
                </div>

                <p className="scenario-card-desc">
                  {interfaceLanguage === 'ta' ? scenario.tamilDescription : scenario.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
