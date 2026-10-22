import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
  bars?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  isActive, 
  color = '#10b981', 
  bars = 5 
}) => {
  return (
    <div className={`audio-waveform ${isActive ? 'active' : ''}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span 
          key={i} 
          className="waveform-bar" 
          style={{ 
            backgroundColor: color,
            animationDelay: `${i * 0.12}s`
          }} 
        />
      ))}
    </div>
  );
};
