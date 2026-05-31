import { PawPrint, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold italic text-white shadow-lg shadow-indigo-500/20">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase text-white">NaroAnimali</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Comune di Naro</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/segnala" className="hover:text-white transition-colors">Segnala</Link>
            <Link to="/mappa" className="hover:text-white transition-colors">Mappa</Link>
            <Link to="/mia-area" className="hover:text-white transition-colors">Mia Area</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/segnala" className="hidden sm:block bg-white text-zinc-950 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-xl shadow-white/5">
              Segnala Ora
            </Link>
            <button className="md:hidden p-2 text-zinc-400" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <Link to="/" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/segnala" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>Segnala</Link>
          <Link to="/mappa" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>Mappa</Link>
          <Link to="/mia-area" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>Mia Area</Link>
        </div>
      )}
    </header>
  );
}
