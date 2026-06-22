import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'it' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  it: {
    // Header & Navigation
    'nav.home': 'Home',
    'nav.report': 'Segnala',
    'nav.map': 'Mappa',
    'nav.myarea': 'La mia area',
    'nav.ai_assistant': 'Chiedi all\'AI',
    'search.placeholder': 'Cerca servizi, guide o pratiche...',
    'search.shortcuts': 'Collegamenti rapidi',
    'search.no_results': 'Nessun risultato trovato',
    'lang.italian': 'Italiano (IT)',
    'lang.english': 'English (EN)',

    // Home Page Common
    'home.hero_badge': 'Comune di Naro',
    'home.hero_title': 'Proteggi e segnala il randagismo',
    'home.hero_desc': 'Servizio istituzionale del Comune per la segnalazione geolocalizzata controllata. Ogni segnalazione attiva soccorso, tutela e adozione consapevole.',
    'home.btn_report': 'Fai una Segnalazione',
    'home.btn_check': 'Verifica Pratica',
    'home.sec_how': 'Come funziona il portale',
    'home.sec_how_desc': 'Quattro semplici passaggi per garantire la protezione ai randagi.',
    'home.sec_explore': 'Esplora gli animali del territorio',
    'home.sec_explore_desc': 'Cerca per razza, specie o zona di ritrovamento per rimanere aggiornato sulla fauna locale.',
    'home.sec_feed': 'Ultime segnalazioni',
    'home.sec_feed_desc': 'Monitoraggio costante gestito dagli amministratori e operatori.',
    'home.sec_feed_badge': 'Feed Real-Time',
    'home.sec_innovation': 'Innovazione per il Territorio',
    'home.sec_innovation_desc': 'Come usiamo le migliori tecnologie per rendere semplice, veloce e sicura la tutela degli animali.',
    'home.sec_why': 'Perché usare AnimalHub PA',
    'home.results': 'Risultati',
    'home.all_activities': 'Tutte le attività',
    'home.report_status_creata': 'Creata',
    'home.report_status_incarico': 'In Carico',
    'home.report_status_pulizia': 'Pulizia',
    'home.report_status_risolta': 'Risolta',

    // Footer
    'footer.description': 'Portale istituzionale del Comune di Naro per la gestione smart e monitorata del randagismo e benessere animale.',
    'footer.links_useful': 'Link Utili',
    'footer.links_compliance': 'Note Legali',
    'footer.rights': 'Tutti i diritti riservati.',
    'footer.stat_module': 'Statistiche & Catasto Istituzionale',
  },
  en: {
    // Header & Navigation
    'nav.home': 'Home',
    'nav.report': 'Report',
    'nav.map': 'Map',
    'nav.myarea': 'My Area',
    'nav.ai_assistant': 'Ask AI',
    'search.placeholder': 'Search services, guides, or files...',
    'search.shortcuts': 'Quick shortcuts',
    'search.no_results': 'No results found',
    'lang.italian': 'Italian (IT)',
    'lang.english': 'English (EN)',

    // Home Page Common
    'home.hero_badge': 'Municipality of Naro',
    'home.hero_title': 'Protect and report stray animals',
    'home.hero_desc': 'Official municipal service for geo-located controlled reporting. Every submission triggers assistance, protection, and conscious adoption.',
    'home.btn_report': 'Submit a Report',
    'home.btn_check': 'Track Report Status',
    'home.sec_how': 'How the portal works',
    'home.sec_how_desc': 'Four simple steps to ensure the protection of stray animals.',
    'home.sec_explore': 'Explore local animals',
    'home.sec_explore_desc': 'Search by breed, species, or region of finding to stay updated on local fauna.',
    'home.sec_feed': 'Latest reports',
    'home.sec_feed_desc': 'Constant monitoring managed by administrators and operators.',
    'home.sec_feed_badge': 'Real-Time Feed',
    'home.sec_innovation': 'Territorial Innovation',
    'home.sec_innovation_desc': 'How we use the best technologies to make animal care simple, fast, and secure.',
    'home.sec_why': 'Why use AnimalHub PA',
    'home.results': 'Results',
    'home.all_activities': 'All activities',
    'home.report_status_creata': 'Created',
    'home.report_status_incarico': 'In Progress',
    'home.report_status_pulizia': 'Quarantine',
    'home.report_status_risolta': 'Resolved',

    // Footer
    'footer.description': 'Institutional portal of the Municipality of Naro for smart and monitored stray animal management and animal well-being.',
    'footer.links_useful': 'Useful Links',
    'footer.links_compliance': 'Legal Compliance',
    'footer.rights': 'All rights reserved.',
    'footer.stat_module': 'Statistics & Local Cadastre',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'it' || saved === 'en' ? saved : 'it') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['it'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
