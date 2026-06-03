import { PawPrint, Menu, X, Home as HomeIcon, MapPin, Map as MapIcon, UserCircle, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-[#101b3a] hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-2">
                <PawPrint className="h-8 w-8 text-[#15803d]" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight text-[#101b3a] leading-none">NaroAnimali</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium">Comune di Naro</span>
                </div>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-[13px] font-bold text-[#64748b]">
            <Link to="/" className="hover:text-[#101b3a] transition-colors flex items-center gap-2">
              <HomeIcon className="h-4 w-4" /> Home
            </Link>
            <Link to="/segnala" className="hover:text-[#101b3a] transition-colors flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Segnala
            </Link>
            <Link to="/mappa" className="hover:text-[#101b3a] transition-colors flex items-center gap-2">
              <MapIcon className="h-4 w-4" /> Mappa
            </Link>
            <Link to="/mia-area" className="hover:text-[#101b3a] transition-colors flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> La mia area
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/operatori" className="hidden sm:block bg-[#15803d] text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:bg-[#166534] transition-all shadow-md shadow-[#15803d]/10">
              Operatori
            </Link>
            <button className="md:hidden p-2 text-[#101b3a]" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <Link to="/" className="flex items-center gap-3 text-sm font-bold text-[#64748b]" onClick={() => setIsOpen(false)}>
            <HomeIcon className="h-4 w-4" /> Home
          </Link>
          <Link to="/segnala" className="flex items-center gap-3 text-sm font-bold text-[#64748b]" onClick={() => setIsOpen(false)}>
            <MapPin className="h-4 w-4" /> Segnala
          </Link>
          <Link to="/mappa" className="flex items-center gap-3 text-sm font-bold text-[#64748b]" onClick={() => setIsOpen(false)}>
            <MapIcon className="h-4 w-4" /> Mappa
          </Link>
          <Link to="/mia-area" className="flex items-center gap-3 text-sm font-bold text-[#64748b]" onClick={() => setIsOpen(false)}>
            <UserCircle className="h-4 w-4" /> La mia area
          </Link>
          <Link to="/operatori" className="flex items-center gap-3 text-sm font-bold text-[#15803d]" onClick={() => setIsOpen(false)}>
            <Briefcase className="h-4 w-4" /> Operatori
          </Link>
        </div>
      )}
    </header>
  );
}
