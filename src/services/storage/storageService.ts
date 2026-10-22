import { Message, AppSettings, SessionStats } from '../../types/conversation';

const SETTINGS_KEY = 'pesu_app_settings_v1';
const MESSAGES_KEY = 'pesu_chat_history_v1';
const STATS_KEY = 'pesu_session_stats_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'local',
  geminiApiKey: '',
  useServerlessBackend: false,
  recognitionLanguage: 'auto',
  speechRate: 0.92,
  autoSpeakResponses: true,
  alwaysShowTamilExplanation: false,
  interfaceLanguage: 'en',
  theme: 'light'
};

export class StorageService {
  public static loadSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  public static loadMessages(): Message[] {
    try {
      const data = localStorage.getItem(MESSAGES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read messages from localStorage', e);
    }
    return [];
  }

  public static saveMessages(messages: Message[]): void {
    try {
      // Store recent 60 messages to preserve storage limits
      const slice = messages.slice(-60);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(slice));
    } catch (e) {
      console.error('Failed to save messages to localStorage', e);
    }
  }

  public static clearMessages(): void {
    try {
      localStorage.removeItem(MESSAGES_KEY);
    } catch (e) {
      console.error('Failed to clear messages', e);
    }
  }

  public static loadCumulativeStats(): Partial<SessionStats> | null {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      // Ignored
    }
    return null;
  }

  public static saveCumulativeStats(stats: SessionStats): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      // Ignored
    }
  }
}
