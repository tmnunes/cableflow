import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from '@/i18n/en'
import { pt } from '@/i18n/pt'
import { loadLocale } from '@/services/storage'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: typeof window !== 'undefined' ? loadLocale() : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
