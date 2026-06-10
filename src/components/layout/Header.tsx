import { PawPrint, Home as HomeIcon, MapPin, Map as MapIcon, UserCircle, Search, Globe, ChevronDown, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const FlagIT = () => (
  <svg className="w-4.5 h-3.5 rounded-sm shrink-0 inline shadow-xs border border-slate-300" viewBox="0 0 3 2">
    <rect width="1" height="2" fill="#009246"/>
    <rect x="1" width="1" height="2" fill="#F1F2F1"/>
    <rect x="2" width="1" height="2" fill="#C11B17"/>
  </svg>
);

const FlagEN = () => (
  <svg className="w-4.5 h-3.5 rounded-sm shrink-0 inline shadow-xs border border-slate-300" viewBox="0 0 50 30">
    <rect width="50" height="30" fill="#012169" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#fff" strokeWidth="6" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#C8102E" strokeWidth="3" />
    <path d="M25 0 V30 M0 15 H50" stroke="#fff" strokeWidth="10" />
    <path d="M25 0 V30 M0 15 H50" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const langRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [siteName, setSiteName] = useState("Comune di Naro");
  const [siteLogo, setSiteLogo] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) setSiteName(config.siteName);
          if (config.siteLogo) setSiteLogo(config.siteLogo);
        }
      } catch(e) {}
    };
    fetchConfig();
  }, []);

  const transparentHeader = isHome && !isScrolled;

  // Search items definition
  const searchItems = [
    { name: 'Segnala un cane o gatto randagio (Modulo A)', nameEn: 'Report a stray dog or cat (Module A)', path: '/segnala', tags: ['segnala', 'randagismo', 'soccorso', 'cane', 'gatto', 'segnalazione', 'report', 'stray'] },
    { name: 'Mappa in tempo reale e monitoraggio', nameEn: 'Real-time map and tracking', path: '/mappa', tags: ['mappa', 'posizione', 'cerca cane', 'gatto', 'zona', 'luna', 'map', 'find', 'track'] },
    { name: 'Fascicolo Cittadino (Area Riservata / OTP)', nameEn: 'Citizen Portal (Private Area / OTP)', path: '/mia-area', tags: ['login', 'otp', 'area', 'profilo', 'mie pratiche', 'accesso', 'citizen', 'profile'] },
    { name: 'Guida operativa al Portale Civico', nameEn: 'Civil Portal Operating Guide', path: '/guida', tags: ['guida', 'aiuto', 'tutorial', 'assistenza', 'guide', 'help'] },
    { name: 'Domande frequenti (FAQ)', nameEn: 'Frequently asked questions (FAQ)', path: '/faq', tags: ['faq', 'domande', 'risposte', 'aiuto', 'questions'] },
    { name: 'Statistiche e Dati Catastali', nameEn: 'Statistics and Cadastral Details', path: '/statistiche-catasto', tags: ['statistiche', 'numeri', 'foglio', 'particella', 'catasto', 'belfiore', 'statistics', 'sheet', 'cadastre'] },
    { name: 'Informativa sulla Privacy (GDPR)', nameEn: 'Privacy Policy (GDPR)', path: '/privacy-policy', tags: ['privacy', 'trattamento dati', 'gdpr', 'titolare', 'policy'] },
    { name: 'Informativa sui Cookie', nameEn: 'Cookie Policy', path: '/cookie-policy', tags: ['cookie', 'storage', 'tracciamento'] },
  ];

  const filteredSearchItems = searchItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = (language === 'it' ? item.name : item.nameEn).toLowerCase().includes(query);
    const matchesTags = item.tags.some(tag => tag.includes(query));
    return matchesName || matchesTags;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSearchItems.length > 0) {
      navigate(filteredSearchItems[0].path);
      setIsSearchFocused(false);
      setSearchQuery('');
    }
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ${transparentHeader ? "bg-transparent border-none py-4" : "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm py-0"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24 items-center gap-4">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className={`hover:opacity-90 transition-opacity ${transparentHeader ? 'text-white' : 'text-[#101b3a]'}`}>
              <div className="flex items-center gap-2">
                {siteLogo ? (
                   <img src={siteLogo} alt="Logo" className="h-10 md:h-12 object-contain" />
                ) : (
                   <PawPrint className={`h-8 w-8 md:h-9 md:w-9 ${transparentHeader ? 'text-emerald-400' : 'text-[#15803d]'}`} />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xl md:text-2xl font-black tracking-tight leading-none">AnimalHub PA</span>
                  <span className={`text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-extrabold mt-1 leading-none ${transparentHeader ? 'text-white/80' : 'text-[#64748b]'}`}>{siteName}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Search Bar - Center */}
          <div ref={searchRef} className="hidden lg:block relative flex-1 max-w-sm mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className={`relative flex items-center bg-slate-100/10 border rounded-xl py-2 px-3 transition-all ${
                isSearchFocused 
                  ? 'bg-white text-slate-900 border-emerald-500 ring-4 ring-emerald-500/10' 
                  : transparentHeader ? 'border-white/25 text-white bg-white/5 hover:bg-white/10' : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100/85'
              }`}>
                <Search className={`h-4 w-4 mr-2 shrink-0 ${isSearchFocused ? 'text-[#15803d]' : transparentHeader ? 'text-white/60' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:font-bold placeholder:opacity-60 placeholder:text-current"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-200/50 rounded text-slate-400">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Smart Search Dropdown Popover */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-150 p-4 shrink-0 transition-all text-left z-[10000]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('search.shortcuts')}</span>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {filteredSearchItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 hover:text-[#15803d] transition-colors flex items-center gap-3 group text-slate-700 cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#15803d] transition-colors" />
                      <span className="text-xs font-bold leading-tight">{language === 'it' ? item.name : item.nameEn}</span>
                    </button>
                  ))}
                  {filteredSearchItems.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs font-bold">
                      {t('search.no_results')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links & Language Switcher - Right */}
          <div className="flex items-center gap-6 shrink-0">
            <nav className={`hidden md:flex items-center gap-6 text-[12px] font-bold tracking-wider uppercase transition-colors ${transparentHeader ? 'text-white/90' : 'text-[#64748b]'}`}>
              <Link to="/" className={`transition-colors flex flex-col items-center gap-1.5 pb-0.5 ${transparentHeader ? 'hover:text-white text-white' : 'hover:text-[#101b3a]'}`}>
                <HomeIcon className="h-4.5 w-4.5" /> <span>{t('nav.home')}</span>
              </Link>
              <Link to="/segnala" className={`transition-colors flex flex-col items-center gap-1.5 pb-0.5 ${transparentHeader ? 'hover:text-white text-white/80' : 'hover:text-[#101b3a]'}`}>
                <MapPin className="h-4.5 w-4.5" /> <span>{t('nav.report')}</span>
              </Link>
              <Link to="/mappa" className={`transition-colors flex flex-col items-center gap-1.5 pb-0.5 ${transparentHeader ? 'hover:text-white text-white/80' : 'hover:text-[#101b3a]'}`}>
                <MapIcon className="h-4.5 w-4.5" /> <span>{t('nav.map')}</span>
              </Link>
              <Link to="/mia-area" className={`transition-colors flex flex-col items-center gap-1.5 pb-0.5 ${transparentHeader ? 'hover:text-white text-white/80' : 'hover:text-[#101b3a]'}`}>
                <UserCircle className="h-4.5 w-4.5" /> <span>{t('nav.myarea')}</span>
              </Link>
            </nav>

            {/* Language Switcher Dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-all ${
                  transparentHeader 
                    ? 'border-white/20 text-white bg-white/5 hover:bg-white/10' 
                    : 'border-slate-200 text-[#101b3a] bg-slate-50 hover:bg-slate-100'
                }`}
                aria-label="Toggle language"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="flex items-center gap-1.5">{language === 'it' ? <><FlagIT /> IT</> : <><FlagEN /> EN</>}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-100 py-1.5 shrink-0 transition-all z-[10000] text-left">
                  <button
                    onClick={() => {
                      setLanguage('it');
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs font-bold hover:bg-emerald-50 hover:text-[#15803d] transition-all cursor-pointer ${language === 'it' ? 'text-[#15803d]' : 'text-slate-600'}`}
                  >
                    <span className="flex items-center gap-2"><FlagIT /> <span>{t('lang.italian')}</span></span>
                    {language === 'it' && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs font-bold hover:bg-emerald-50 hover:text-[#15803d] transition-all cursor-pointer ${language === 'en' ? 'text-[#15803d]' : 'text-slate-600'}`}
                  >
                    <span className="flex items-center gap-2"><FlagEN /> <span>{t('lang.english')}</span></span>
                    {language === 'en' && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
