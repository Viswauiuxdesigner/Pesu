import React, { useState, useEffect, useMemo } from 'react';
import { 
  Message, 
  ScenarioId, 
  AppSettings, 
  SessionStats, 
  RecognitionLanguage,
  InterfaceLanguage
} from './types/conversation';
import { VoiceOption } from './types/speech';
import { Header } from './components/Header';
import { ChatContainer } from './components/ChatContainer';
import { VoiceInputBar } from './components/VoiceInputBar';
import { TranscriptReviewModal } from './components/TranscriptReviewModal';
import { PracticeSummaryModal } from './components/PracticeSummaryModal';
import { ScenarioSelector } from './components/ScenarioSelector';
import { SettingsModal } from './components/SettingsModal';
import { getScenarioById } from './services/ai/scenarios';
import { LocalSpeakingTutorProvider } from './services/ai/localProvider';
import { GeminiSpeakingProvider } from './services/ai/geminiProvider';
import { speechRecognizer } from './services/speech/speechRecognition';
import { speechSynthesizer } from './services/speech/speechSynthesis';
import { StorageService } from './services/storage/storageService';
import { detectLanguage } from './utils/languageDetector';
import { TRANSLATIONS } from './utils/translations';

export const App: React.FC = () => {
  // Settings & Preferences
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings());
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('free_talk');

  // Messages State
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = StorageService.loadMessages();
    if (saved && saved.length > 0) return saved;

    const initialScenario = getScenarioById('free_talk');
    return [
      {
        id: 'msg-init',
        role: 'assistant',
        content: initialScenario.initialMessage,
        tamilExplanation: initialScenario.initialTamilExplanation,
        timestamp: Date.now(),
        suggestedResponses: [
          'Enakku English pesa romba bayama irukku, epdi start panrathu?',
          'shall we talk',
          'I am go to office yesterday'
        ]
      }
    ];
  });

  // UI Modals State
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [reviewTranscript, setReviewTranscript] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Audio Playback & Request State
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // AI Provider instances
  const localProvider = useMemo(() => new LocalSpeakingTutorProvider(), []);
  const geminiProvider = useMemo(() => {
    return new GeminiSpeakingProvider(settings.geminiApiKey, settings.useServerlessBackend);
  }, [settings.geminiApiKey, settings.useServerlessBackend]);

  const activeProvider = useMemo(() => {
    return settings.aiProvider === 'gemini' ? geminiProvider : localProvider;
  }, [settings.aiProvider, geminiProvider, localProvider]);

  // Synchronize Theme attribute on <html> element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    }
  }, [settings.theme]);

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      setAvailableVoices(speechSynthesizer.getAvailableVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Sync messages to local storage
  useEffect(() => {
    StorageService.saveMessages(messages);
  }, [messages]);

  // Save settings helper
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  // Toggle interface language quickly from header
  const handleToggleInterfaceLanguage = () => {
    const nextLang: InterfaceLanguage = settings.interfaceLanguage === 'en' ? 'ta' : 'en';
    const updated = { ...settings, interfaceLanguage: nextLang };
    handleUpdateSettings(updated);
  };

  // Toggle theme quickly from header
  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    handleUpdateSettings(updated);
  };

  // Switch scenario
  const handleSelectScenario = (scenarioId: ScenarioId) => {
    setActiveScenarioId(scenarioId);
    const scen = getScenarioById(scenarioId);
    
    const introMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: scen.initialMessage,
      tamilExplanation: scen.initialTamilExplanation,
      timestamp: Date.now(),
      suggestedResponses: scen.starterPrompts.slice(0, 3).map(p => p.tanglish || p.english || '')
    };

    setMessages(prev => [...prev, introMessage]);

    if (settings.autoSpeakResponses) {
      handleSpeak(introMessage.id, introMessage.content, 'en');
    }
  };

  // Reset chat
  const handleResetChat = () => {
    const t = TRANSLATIONS[settings.interfaceLanguage];
    if (window.confirm(t.confirmResetDesc)) {
      speechSynthesizer.stop();
      setCurrentlyPlayingId(null);
      const scen = getScenarioById(activeScenarioId);
      const freshMessages: Message[] = [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: scen.initialMessage,
          tamilExplanation: scen.initialTamilExplanation,
          timestamp: Date.now(),
          suggestedResponses: scen.starterPrompts.slice(0, 3).map(p => p.tanglish || p.english || '')
        }
      ];
      setMessages(freshMessages);
      StorageService.clearMessages();
      setRequestError(null);
      setLastFailedMessage(null);
    }
  };

  // Clear history completely
  const handleClearHistory = () => {
    speechSynthesizer.stop();
    setCurrentlyPlayingId(null);
    StorageService.clearMessages();
    const scen = getScenarioById('free_talk');
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: scen.initialMessage,
        tamilExplanation: scen.initialTamilExplanation,
        timestamp: Date.now(),
        suggestedResponses: scen.starterPrompts.slice(0, 3).map(p => p.tanglish || p.english || '')
      }
    ]);
  };

  // Send message flow
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Prevent duplicate rapid submissions (e.g. double click or rapid key presses)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'user' && lastMsg.content === trimmed && (Date.now() - lastMsg.timestamp < 1500)) {
      return;
    }

    setRequestError(null);
    setLastFailedMessage(null);

    const detectedLang = detectLanguage(trimmed);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      detectedLanguage: detectedLang
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await activeProvider.sendMessage(trimmed, newHistory, {
        scenarioId: activeScenarioId,
        alwaysShowTamilExplanation: settings.alwaysShowTamilExplanation
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.replyText,
        timestamp: Date.now(),
        detectedLanguage: response.detectedLanguage,
        tamilExplanation: response.tamilExplanation,
        grammarCorrection: response.grammarCorrection,
        pronunciationGuide: response.pronunciationGuide,
        suggestedResponses: response.suggestedResponses
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (settings.autoSpeakResponses) {
        handleSpeak(assistantMessage.id, assistantMessage.content, 'en');
      }
    } catch (err: any) {
      console.warn('Error generating AI response:', err);
      setLastFailedMessage(trimmed);
      setRequestError('Could not connect to the speaking partner. Please retry or continue in offline mode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Retry sending last failed message
  const handleRetryLastMessage = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  // Speech Recognition handlers
  const handleStartListening = () => {
    setSpeechError(null);
    setInterimTranscript('');

    const started = speechRecognizer.startListening(settings.recognitionLanguage, {
      onStart: () => {
        setIsListening(true);
      },
      onInterimResult: (transcript) => {
        setInterimTranscript(transcript);
      },
      onFinalResult: (transcript) => {
        setInterimTranscript(transcript);
      },
      onError: (errType, msg) => {
        setIsListening(false);
        setSpeechError(msg);
      },
      onEnd: () => {
        setIsListening(false);
        const finalTxt = speechRecognizer.getFinalTranscript() || interimTranscript;
        if (finalTxt.trim()) {
          setReviewTranscript(finalTxt.trim());
          setIsReviewModalOpen(true);
        }
      }
    });

    if (!started) {
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    speechRecognizer.stopListening();
    setIsListening(false);
    const finalTxt = speechRecognizer.getFinalTranscript() || interimTranscript;
    if (finalTxt.trim()) {
      setReviewTranscript(finalTxt.trim());
      setIsReviewModalOpen(true);
    }
  };

  // Review modal actions
  const handleConfirmTranscript = (editedTranscript: string) => {
    setIsReviewModalOpen(false);
    setInterimTranscript('');
    setReviewTranscript('');
    handleSendMessage(editedTranscript);
  };

  const handleRetryListening = () => {
    setIsReviewModalOpen(false);
    setInterimTranscript('');
    setReviewTranscript('');
    handleStartListening();
  };

  // Speech Synthesis handlers
  const handleSpeak = (id: string, text: string, lang: 'ta' | 'en') => {
    speechSynthesizer.stop();
    setCurrentlyPlayingId(id);

    speechSynthesizer.speak(text, {
      lang,
      rate: settings.speechRate,
      preferredVoiceURI: settings.preferredVoiceURI,
      onStart: () => {
        setCurrentlyPlayingId(id);
      },
      onEnd: () => {
        setCurrentlyPlayingId(null);
      },
      onError: () => {
        setCurrentlyPlayingId(null);
      }
    });
  };

  const handleStopSpeaking = () => {
    speechSynthesizer.stop();
    setCurrentlyPlayingId(null);
  };

  const handleRepeatSpeaking = () => {
    speechSynthesizer.repeat(settings.speechRate);
  };

  // Session summary trigger
  const handleOpenSummary = async () => {
    const stats = await activeProvider.generateSessionSummary(messages);
    setSessionStats(stats);
    setIsSummaryOpen(true);
  };

  const currentScenario = getScenarioById(activeScenarioId);

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        currentScenario={currentScenario}
        settings={settings}
        onOpenScenarios={() => setIsScenariosOpen(true)}
        onOpenSummary={handleOpenSummary}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetChat={handleResetChat}
        onToggleLanguage={handleToggleInterfaceLanguage}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Conversation Stream */}
      <main className="main-content">
        <ChatContainer
          messages={messages}
          scenario={currentScenario}
          currentlyPlayingId={currentlyPlayingId}
          onSpeak={handleSpeak}
          onStop={handleStopSpeaking}
          onRepeat={handleRepeatSpeaking}
          onSelectStarterPrompt={(promptText) => handleSendMessage(promptText)}
          onRetryLastMessage={handleRetryLastMessage}
          isLoading={isLoading}
          alwaysShowTamil={settings.alwaysShowTamilExplanation}
          interfaceLanguage={settings.interfaceLanguage}
          error={requestError}
        />
      </main>

      {/* Sticky Bottom Voice / Text Input Bar */}
      <footer className="footer-bar">
        <VoiceInputBar
          onSendMessage={handleSendMessage}
          isListening={isListening}
          interimTranscript={interimTranscript}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          recognitionLanguage={settings.recognitionLanguage}
          onChangeRecognitionLanguage={(lang: RecognitionLanguage) => handleUpdateSettings({ ...settings, recognitionLanguage: lang })}
          isRecognitionSupported={speechRecognizer.isSupported()}
          speechError={speechError}
          onClearSpeechError={() => setSpeechError(null)}
          isLoading={isLoading}
          interfaceLanguage={settings.interfaceLanguage}
        />
      </footer>

      {/* Review Transcript Modal */}
      <TranscriptReviewModal
        isOpen={isReviewModalOpen}
        transcript={reviewTranscript}
        onSend={handleConfirmTranscript}
        onRetry={handleRetryListening}
        onCancel={() => setIsReviewModalOpen(false)}
        onSpeakPreview={(txt) => speechSynthesizer.speak(txt, { lang: 'en', rate: settings.speechRate })}
        interfaceLanguage={settings.interfaceLanguage}
      />

      {/* Practice Scenarios Modal */}
      <ScenarioSelector
        isOpen={isScenariosOpen}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onClose={() => setIsScenariosOpen(false)}
        interfaceLanguage={settings.interfaceLanguage}
      />

      {/* Session Progress & Summary Modal */}
      <PracticeSummaryModal
        isOpen={isSummaryOpen}
        stats={sessionStats}
        onClose={() => setIsSummaryOpen(false)}
        onResetSession={() => {
          setIsSummaryOpen(false);
          handleResetChat();
        }}
        interfaceLanguage={settings.interfaceLanguage}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearHistory={handleClearHistory}
        onClose={() => setIsSettingsOpen(false)}
        availableVoices={availableVoices}
      />
    </div>
  );
};

export default App;
