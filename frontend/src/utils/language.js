/**
 * Language Utility
 * Provides language state management and translation function
 */

// Translation function
export const t = (en, hi = '', language = 'en') => {
  if (language === 'hi') return hi || en;
  return en;
};

// Language toggle function
export const toggleLanguage = (currentLanguage) => {
  return currentLanguage === 'en' ? 'hi' : 'en';
};

// Get language from localStorage or default
export const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem('app_language');
    return stored || 'en';
  } catch (error) {
    return 'en';
  }
};

// Save language to localStorage
export const saveLanguage = (language) => {
  try {
    localStorage.setItem('app_language', language);
  } catch (error) {
    // Ignore localStorage errors
  }
};

export default {
  t,
  toggleLanguage,
  getStoredLanguage,
  saveLanguage
};
