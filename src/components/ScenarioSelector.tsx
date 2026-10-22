import React from 'react';
import { PRACTICE_SCENARIOS } from '../services/ai/scenarios';
import { ScenarioId } from '../types/conversation';
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
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  isOpen,
  activeScenarioId,
  onSelectScenario,
  onClose
}) => {
  if (!isOpen) return null;

  const getScenarioIcon = (id: ScenarioId) => {
    switch (id) {
      case 'interview':
        return <Briefcase size={22} className="scenario-icon-svg text-amber-400" />;
      case 'office_meeting':
        return <Users size={22} className="scenario-icon-svg text-sky-400" />;
      case 'everyday_chat':
        return <Coffee size={22} className="scenario-icon-svg text-emerald-400" />;
      case 'phone_call':
        return <PhoneCall size={22} className="scenario-icon-svg text-indigo-400" />;
      case 'restaurant':
        return <Utensils size={22} className="scenario-icon-svg text-rose-400" />;
      case 'free_talk':
      default:
        return <MessageSquare size={22} className="scenario-icon-svg text-emerald-400" />;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="scenario-modal-card">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Choose Practice Scenario / பயிற்சி களம்</h3>
            <p className="modal-subtitle">Select a real-world situation to practice speaking with confidence</p>
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
                      <Check size={14} /> Active
                    </span>
                  )}
                </div>

                <div className="scenario-card-titles">
                  <h4 className="scenario-title-en">{scenario.title}</h4>
                  <span className="scenario-title-ta">{scenario.tamilTitle}</span>
                </div>

                <p className="scenario-card-desc">{scenario.description}</p>
                <p className="scenario-card-ta-desc">{scenario.tamilDescription}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
