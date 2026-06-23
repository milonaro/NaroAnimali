import { NavLink } from 'react-router-dom';
import { Home, MapPin, Map, UserSquare, UserCircle } from 'lucide-react';

export default function BottomNavigation() {
  return (
    <nav className="md:hidden fixed bottom-2.5 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/50 z-50 flex justify-around items-center h-16 px-2 rounded-2xl shadow-[0_8px_24px_rgba(16,27,58,0.11)] selection:bg-transparent transition-all">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-[9px] font-black uppercase tracking-wider ${
            isActive ? 'text-[#1e3a5f] scale-105' : 'text-slate-400 hover:text-[#1e3a5f]'
          }`
        }
      >
        <Home className="h-5 w-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/segnala"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-[9px] font-black uppercase tracking-wider ${
            isActive ? 'text-[#1e3a5f] scale-105' : 'text-slate-400 hover:text-[#1e3a5f]'
          }`
        }
      >
        <MapPin className="h-5 w-5" />
        <span>Segnala</span>
      </NavLink>

      <NavLink
        to="/mappa"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-[9px] font-black uppercase tracking-wider ${
            isActive ? 'text-[#1e3a5f] scale-105' : 'text-slate-400 hover:text-[#1e3a5f]'
          }`
        }
      >
        <Map className="h-5 w-5" />
        <span>Mappa</span>
      </NavLink>

      <NavLink
        to="/mia-area"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-[9px] font-black uppercase tracking-wider ${
            isActive ? 'text-[#1e3a5f] scale-105' : 'text-slate-400 hover:text-[#1e3a5f]'
          }`
        }
      >
        <UserCircle className="h-5 w-5" />
        <span>La mia area</span>
      </NavLink>
    </nav>
  );
}
