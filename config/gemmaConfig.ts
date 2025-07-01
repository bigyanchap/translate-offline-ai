// Configuration for Gemma 3n Model Integration

export interface GemmaConfig {
  modelName: string;
  modelPath: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  cacheSize: number;
  enableCaching: boolean;
  enableOfflineMode: boolean;
}

// Default configuration for Gemma 3n model
export const DEFAULT_GEMMA_CONFIG: GemmaConfig = {
  modelName: 'gemma-3n-2b',
  modelPath: './assets/models/gemma-3n-2b',
  maxTokens: 512,
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  cacheSize: 1000,
  enableCaching: true,
  enableOfflineMode: true,
};

// Language-specific configurations
export const LANGUAGE_CONFIGS = {
  'en': {
    temperature: 0.7,
    maxTokens: 256,
  },
  'hi': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'ne': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'es': {
    temperature: 0.7,
    maxTokens: 256,
  },
  'fr': {
    temperature: 0.7,
    maxTokens: 256,
  },
  'de': {
    temperature: 0.7,
    maxTokens: 256,
  },
  'it': {
    temperature: 0.7,
    maxTokens: 256,
  },
  'pt': {
    temperature: 0.7,
    maxTokens: 256,
  },
  'ru': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'ja': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'ko': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'zh': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'ar': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'bn': {
    temperature: 0.8,
    maxTokens: 512,
  },
  'ur': {
    temperature: 0.8,
    maxTokens: 512,
  },
};

// Translation prompts for different language pairs
export const TRANSLATION_PROMPTS = {
  // English to other languages
  'en-hi': 'Translate the following English text to Hindi. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nHindi:',
  'en-ne': 'Translate the following English text to Nepali. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nNepali:',
  'en-es': 'Translate the following English text to Spanish. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nSpanish:',
  'en-fr': 'Translate the following English text to French. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nFrench:',
  'en-de': 'Translate the following English text to German. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nGerman:',
  'en-it': 'Translate the following English text to Italian. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nItalian:',
  'en-pt': 'Translate the following English text to Portuguese. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nPortuguese:',
  'en-ru': 'Translate the following English text to Russian. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nRussian:',
  'en-ja': 'Translate the following English text to Japanese. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nJapanese:',
  'en-ko': 'Translate the following English text to Korean. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nKorean:',
  'en-zh': 'Translate the following English text to Chinese. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nChinese:',
  'en-ar': 'Translate the following English text to Arabic. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nArabic:',
  'en-bn': 'Translate the following English text to Bengali. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nBengali:',
  'en-ur': 'Translate the following English text to Urdu. Provide only the translation without any additional text:\n\nEnglish: "{text}"\n\nUrdu:',

  // Hindi to other languages
  'hi-en': 'Translate the following Hindi text to English. Provide only the translation without any additional text:\n\nHindi: "{text}"\n\nEnglish:',
  'hi-ne': 'Translate the following Hindi text to Nepali. Provide only the translation without any additional text:\n\nHindi: "{text}"\n\nNepali:',
  'hi-es': 'Translate the following Hindi text to Spanish. Provide only the translation without any additional text:\n\nHindi: "{text}"\n\nSpanish:',
  'hi-fr': 'Translate the following Hindi text to French. Provide only the translation without any additional text:\n\nHindi: "{text}"\n\nFrench:',

  // Nepali to other languages
  'ne-en': 'Translate the following Nepali text to English. Provide only the translation without any additional text:\n\nNepali: "{text}"\n\nEnglish:',
  'ne-hi': 'Translate the following Nepali text to Hindi. Provide only the translation without any additional text:\n\nNepali: "{text}"\n\nHindi:',
  'ne-es': 'Translate the following Nepali text to Spanish. Provide only the translation without any additional text:\n\nNepali: "{text}"\n\nSpanish:',
  'ne-fr': 'Translate the following Nepali text to French. Provide only the translation without any additional text:\n\nNepali: "{text}"\n\nFrench:',

  // Add more language pairs as needed...
};

// Language detection prompts
export const LANGUAGE_DETECTION_PROMPTS = {
  general: 'Detect the language of the following text and respond with only the language code (en, hi, ne, es, fr, de, it, pt, ru, ja, ko, zh, ar, bn, ur):\n\nText: "{text}"\n\nLanguage code:',
  
  // Specific prompts for better accuracy
  'en-hi-ne': 'Is this text in English, Hindi, or Nepali? Respond with only the language code (en, hi, ne):\n\nText: "{text}"\n\nLanguage code:',
  
  'asian-languages': 'Is this text in Japanese, Korean, or Chinese? Respond with only the language code (ja, ko, zh):\n\nText: "{text}"\n\nLanguage code:',
  
  'european-languages': 'Is this text in Spanish, French, German, Italian, or Portuguese? Respond with only the language code (es, fr, de, it, pt):\n\nText: "{text}"\n\nLanguage code:',
};

// Performance optimization settings
export const PERFORMANCE_CONFIG = {
  // Cache settings
  maxCacheSize: 1000,
  cacheExpiryHours: 24,
  
  // Model loading
  preloadModel: true,
  modelLoadTimeout: 30000, // 30 seconds
  
  // Translation settings
  maxConcurrentTranslations: 3,
  translationTimeout: 10000, // 10 seconds
  
  // Memory management
  maxMemoryUsage: 512, // MB
  cleanupInterval: 300000, // 5 minutes
};

// Error handling configurations
export const ERROR_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  fallbackToMock: true,
  logErrors: true,
  showUserFriendlyErrors: true,
};

// Export utility functions
export const getLanguageConfig = (languageCode: string) => {
  return LANGUAGE_CONFIGS[languageCode as keyof typeof LANGUAGE_CONFIGS] || {
    temperature: 0.7,
    maxTokens: 256,
  };
};

export const getTranslationPrompt = (fromLang: string, toLang: string) => {
  const key = `${fromLang}-${toLang}`;
  return TRANSLATION_PROMPTS[key as keyof typeof TRANSLATION_PROMPTS] || 
         `Translate the following text from ${fromLang} to ${toLang}. Provide only the translation:\n\nOriginal: "{text}"\n\nTranslation:`;
};

export const getLanguageDetectionPrompt = (text: string, category: keyof typeof LANGUAGE_DETECTION_PROMPTS = 'general') => {
  const prompt = LANGUAGE_DETECTION_PROMPTS[category];
  return prompt.replace('{text}', text);
}; 