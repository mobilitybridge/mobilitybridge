import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from '../locales/ar.json';
import en from '../locales/en.json';

export type Language = 'ar' | 'en';
const STORAGE_KEY = 'alumni-directory.language';

function savedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

function applyToDocument(language: string) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only.
  }
}

i18n.on('languageChanged', applyToDocument);

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
applyToDocument(i18n.language);

export default i18n;
