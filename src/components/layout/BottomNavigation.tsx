import { NavLink } from 'react-router-dom';
import { Home, MapPin, Map, UserSquare, UserCircle } from 'lucide-react';

export default function BottomNavigation() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 flex justify-around items-center h-16 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] selection:bg-transparent">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-[10px] font-bold uppercase tracking-wider ${
            isActive ? 'text-[#15803d]' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        <Home className="h-5 w-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/segnala"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-[10px] font-bold uppercase tracking-wider ${
            isActive ? 'text-[#15803d]' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        <MapPin className="h-5 w-5" />
        <span>Segnala</span>
      </NavLink>

      <NavLink
        to="/mappa"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-[10px] font-bold uppercase tracking-wider ${
            isActive ? 'text-[#15803d]' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        <Map className="h-5 w-5" />
        <span>Mappa</span>
      </NavLink>

      <NavLink
        to="/mia-area"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-[10px] font-bold uppercase tracking-wider ${
            isActive ? 'text-[#15803d]' : 'text-gray-400 hover:text-gray-600'
          }`
        }
      >
        <UserCircle className="h-5 w-5" />
        <span>La mia area</span>
      </NavLink>
    </nav>
  );
}
