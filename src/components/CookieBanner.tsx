import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controllo se l'utente ha già espresso una preferenza sui cookie
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else if (consent === 'all') {
      // Inizializza Google Analytics se il consenso è "all"
      initializeAnalytics();
    }
  }, []);

  const initializeAnalytics = () => {
    const trackingId = import.meta.env.VITE_GANALITYC_ID;
    if (trackingId) {
      // Semplice caricamento fittizio dello script di GA se l'ID è presente
      console.log(`Google Analytics Inizializzato (ID: ${trackingId})`);
      // function gtag(){dataLayer.push(arguments);} ... ecc 
    }
  };

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setIsVisible(false);
    initializeAnalytics();
  };

  const handleAcceptTechnical = () => {
    localStorage.setItem('cookie-consent', 'technical');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-[9999] flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
      <div className="text-[14px] text-gray-500 leading-relaxed text-center md:text-left">
        Questo sito utilizza cookie tecnici necessari al funzionamento e, previo tuo consenso, cookie analitici.{' '}
        <Link to="/cookie-policy" className="text-[#2bb45e] hover:text-[#22954d] font-medium transition-colors">
          Maggiori informazioni
        </Link>
      </div>
      <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
        <button
          onClick={handleAcceptTechnical}
          className="text-[14px] text-gray-400 hover:text-gray-600 font-medium px-2 py-2 transition-colors"
        >
          Solo tecnici
        </button>
        <button
          onClick={handleAcceptAll}
          className="text-[14px] bg-[#2bb45e] hover:bg-[#22954d] text-white px-6 py-2.5 rounded-md font-bold transition-colors shadow-sm"
        >
          Accetta tutti
        </button>
      </div>
    </div>
  );
}
