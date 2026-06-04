import { PawPrint, Home as HomeIcon, MapPin, Map as MapIcon, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const transparentHeader = isHome && !isScrolled;

  const siteName = localStorage.getItem('siteName') || "Comune di Naro";
  const siteLogo = localStorage.getItem('siteLogo') || "";

  return (
    <header className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ${transparentHeader ? "bg-transparent border-none py-2" : "bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm py-0"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className={`hover:opacity-90 transition-opacity ${transparentHeader ? 'text-white' : 'text-[#101b3a]'}`}>
              <div className="flex items-center gap-2">
                {siteLogo ? (
                   <img src={siteLogo} alt="Logo" className="h-10 md:h-12 object-contain" />
                ) : (
                   <PawPrint className={`h-8 w-8 md:h-9 md:w-9 ${transparentHeader ? 'text-white' : 'text-[#15803d]'}`} />
                )}
                <div className="flex flex-col">
                  <span className="text-xl md:text-2xl font-black tracking-tight leading-none">AnimalHub PA</span>
                  <span className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold mt-1 ${transparentHeader ? 'text-white/80' : 'text-[#64748b]'}`}>{siteName}</span>
                </div>
              </div>
            </div>
          </Link>

          <nav className={`hidden md:flex items-center gap-10 text-[13px] font-bold transition-colors ml-auto ${transparentHeader ? 'text-white/90' : 'text-[#64748b]'}`}>
            <Link to="/" className={`transition-colors flex flex-col items-center gap-1 ${transparentHeader ? 'hover:text-white text-white' : 'hover:text-[#101b3a]'}`}>
              <HomeIcon className="h-5 w-5" /> <span>Home</span>
            </Link>
            <Link to="/segnala" className={`transition-colors flex flex-col items-center gap-1 ${transparentHeader ? 'hover:text-white' : 'hover:text-[#101b3a]'}`}>
              <MapPin className="h-5 w-5" /> <span>Segnala</span>
            </Link>
            <Link to="/mappa" className={`transition-colors flex flex-col items-center gap-1 ${transparentHeader ? 'hover:text-white' : 'hover:text-[#101b3a]'}`}>
              <MapIcon className="h-5 w-5" /> <span>Mappa</span>
            </Link>
            <Link to="/mia-area" className={`transition-colors flex flex-col items-center gap-1 ${transparentHeader ? 'hover:text-white' : 'hover:text-[#101b3a]'}`}>
              <UserCircle className="h-5 w-5" /> <span>La mia area</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
