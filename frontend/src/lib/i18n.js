import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation files
import en from '../locales/en.json'
import kn from '../locales/kn.json'
import hi from '../locales/hi.json'
import te from '../locales/te.json'
import ta from '../locales/ta.json'
import mr from '../locales/mr.json'

// Get saved language from localStorage, default to 'en'
const savedLanguage = localStorage.getItem('drishti-language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
      mr: { translation: mr }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

// Listen for language changes and persist to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('drishti-language', lng)
})

export default i18n