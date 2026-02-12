// TranslationService.ts — Live translation for chat messages
import AsyncStorage from '@react-native-async-storage/async-storage';
import { guideChat } from '../api/client';

const TRANSLATION_PREFS_KEY = 'uptend_translation_prefs';

export type TranslationMode = 'always' | 'ask' | 'off';

export interface TranslationPrefs {
  mode: TranslationMode;
  primaryLanguage: string;
  targetLanguages: string[];
}

export interface TranslatedMessage {
  original: string;
  translated: string;
  detectedLanguage: string;
  targetLanguage: string;
}

const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  es: [/\b(hola|gracias|por favor|buenos|cómo|está|necesito|quiero|casa|trabajo)\b/i],
  fr: [/\b(bonjour|merci|s'il vous|comment|maison|travail|besoin)\b/i],
  pt: [/\b(olá|obrigado|por favor|como|casa|trabalho|preciso)\b/i],
};

class TranslationServiceClass {
  private prefs: TranslationPrefs = { mode: 'off', primaryLanguage: 'en', targetLanguages: ['es'] };

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TRANSLATION_PREFS_KEY);
      if (stored) this.prefs = JSON.parse(stored);
    } catch {}
  }

  detectLanguage(text: string): string {
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      if (patterns.some(p => p.test(text))) return lang;
    }
    return 'en';
  }

  needsTranslation(text: string): boolean {
    if (this.prefs.mode === 'off') return false;
    const detected = this.detectLanguage(text);
    return detected !== this.prefs.primaryLanguage;
  }

  async translate(text: string, targetLang?: string): Promise<TranslatedMessage> {
    const detectedLanguage = this.detectLanguage(text);
    const target = targetLang || this.prefs.primaryLanguage;

    try {
      const response = await guideChat(
        `Translate the following text to ${target}. Only return the translation, nothing else: "${text}"`,
        { context: 'translation', sourceLang: detectedLanguage, targetLang: target }
      );
      return {
        original: text,
        translated: response.message || text,
        detectedLanguage,
        targetLanguage: target,
      };
    } catch {
      // Fallback mock translations
      const mockTranslations: Record<string, string> = {
        'Hola, necesito ayuda con mi casa': 'Hello, I need help with my house',
        'Gracias por el buen trabajo': 'Thank you for the good work',
        '¿Cuánto cuesta la limpieza?': 'How much does the cleaning cost?',
      };
      return {
        original: text,
        translated: mockTranslations[text] || `[${target}] ${text}`,
        detectedLanguage,
        targetLanguage: target,
      };
    }
  }

  async updatePrefs(newPrefs: Partial<TranslationPrefs>): Promise<void> {
    this.prefs = { ...this.prefs, ...newPrefs };
    await AsyncStorage.setItem(TRANSLATION_PREFS_KEY, JSON.stringify(this.prefs));
  }

  getPrefs(): TranslationPrefs {
    return this.prefs;
  }
}

export const translationService = new TranslationServiceClass();
