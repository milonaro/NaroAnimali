import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type: 'comune' | 'via';
  comuneContext?: string; // e.g. "Naro" when searching for "vias" in Naro
  className?: string;
  id?: string;
}

// Quick preloaded cache of common Italian municipalities for instant zero-lag response at national level
const LOCAL_COMUNI_FALLBACK = [
  "ROMA", "MILANO", "TORINO", "NAPOLI", "PALERMO", "GENOVA", "BOLOGNA", "FIRENZE", 
  "BARI", "CATANIA", "VENEZIA", "VERONA", "MESSINA", "PADOVA", "TRIESTE", "TARANTO", "BRESCIA", "REGGIO CALABRIA", "MODENA", "PRATO", "PERUGIA", "LIVORNO"
];

export default function AutocompleteInput({
  value,
  onChange,
  placeholder = "Inizia a scrivere...",
  type,
  comuneContext = "",
  className = "",
  id
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const searchAPI = async (query: string) => {
    if (!query || query.length < 2) {
      // Local list for municipalities if search is short or empty
      if (type === 'comune') {
        const filtered = LOCAL_COMUNI_FALLBACK.filter(c => c.startsWith(query.toUpperCase()));
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
      return;
    }

    setLoading(true);
    try {
      let url = "";
      if (type === 'comune') {
        url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=it&addressdetails=1&featuretype=settlement&q=${encodeURIComponent(query)}&limit=8`;
      } else {
        // Via / Stradario context e.g. "Via Sabella, Naro"
        const fullQuery = `${query}${comuneContext ? `, ${comuneContext}` : ''}`;
        url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=it&addressdetails=1&q=${encodeURIComponent(fullQuery)}&limit=8`;
      }

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'it-IT,it;q=0.9',
          'User-Agent': 'AnimalHub-PA-WhiteLabel-CMS' // Recommended polite agent for Nominatim
        }
      });

      if (!response.ok) throw new Error("Nominatim error");
      const data = await response.json();

      const results = data.map((item: any) => {
        if (type === 'comune') {
          if (item.address) {
            const cityName = item.address.town || item.address.city || item.address.municipality || item.address.village || item.address.suburb;
            if (cityName) return cityName.toUpperCase();
          }
          const parts = item.display_name.split(',');
          const cityName = parts[0]?.trim();
          return cityName ? cityName.toUpperCase() : null;
        } else {
          // Return ONLY street address and optional house_number, excluding the city, county/country
          if (item.address) {
            const road = item.address.road || item.address.pedestrian || item.address.suburb || item.address.footway || item.address.cycleway || item.address.path || item.address.square || item.address.amenity || item.address.industrial || item.address.neighbourhood;
            const houseNumber = item.address.house_number;
            if (road) {
              return houseNumber ? `${road}, ${houseNumber}` : road;
            }
          }
          // Fallback parsing display_name
          const parts = item.display_name.split(',');
          const p0 = parts[0]?.trim() || '';
          const p1 = parts[1]?.trim() || '';
          const isNumber = /^\d+$/.test(p0) || /^\d+[a-zA-Z]?$/.test(p0);
          if (isNumber && p1) {
            return `${p1}, ${p0}`;
          }
          return p0;
        }
      }).filter((val: string | null): val is string => val !== null);

      // Unique results
      const uniqueResults = Array.from(new Set(results)) as string[];
      setSuggestions(uniqueResults);
    } catch (error) {
      console.error("Autocomplete search failed:", error);
      // Fallback locally
      if (type === 'comune') {
        const filtered = LOCAL_COMUNI_FALLBACK.filter(c => 
          c.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setShowDropdown(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchAPI(val);
    }, 450);
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setShowDropdown(true);
            if (suggestions.length === 0) {
              searchAPI(value);
            }
          }}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <MapPin className="h-4 w-4 opacity-50 hover:text-emerald-600 transition-colors" />
          )}
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectSuggestion(sug)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold text-[#101b3a] flex items-center gap-2.5 transition-colors uppercase font-sans cursor-pointer"
            >
              <span className="text-emerald-600 shrink-0">📍</span>
              <span className="truncate">{sug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
