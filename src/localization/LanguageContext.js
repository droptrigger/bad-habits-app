import React, { createContext, useContext, useState } from 'react';
import i18n from './i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(
    typeof i18n.locale === 'string' && i18n.locale.startsWith('ru') ? 'ru' : 'en'
  );
  const switchLanguage = () => {
    const newLang = lang === 'ru' ? 'en' : 'ru';
    setLang(newLang);
    i18n.locale = newLang;
  };
  return (
    <LanguageContext.Provider value={{ lang, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 