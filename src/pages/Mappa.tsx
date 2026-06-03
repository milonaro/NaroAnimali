import AppMap from '@/src/components/map/Map';
import { Filter, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

export default function Mappa() {
  const [segnalazioni, setSegnalazioni] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  
  useEffect(() => {
    const q = query(collection(db, 'segnalazioni'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSegnalazioni(data);
    }, (error) => {
      console.error(error);
    });
    return () => unsubscribe();
  }, []);

  const animalMarkers = useMemo(() => {
    const filtered = segnalazioni.filter(a => 
      (a.specie || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.indirizzo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.colore || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.map(a => ({
      lat: a.latitudine || 37.2925,
      lng: a.longitudine || 13.7925,
      title: `${a.specie} - ${a.colore || 'Non specificato'}`,
      specie: a.specie === 'CANE' ? 'Cane' : a.specie === 'GATTO' ? 'Gatto' : 'Altro',
      urgenza: (a.urgenza === 'ALTA' || a.urgenza === 'CRITICA' ? 'Alta' : a.urgenza === 'BASSA' ? 'Bassa' : 'Normale') as 'Alta' | 'Normale' | 'Bassa',
      image: a.fotoUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600',
      date: new Date(a.createdAt).toLocaleDateString(),
      status: a.stato as 'CREATA' | 'IN_CARICO' | 'PULIZIA' | 'RISOLTA',
      id: a.id
    }));
  }, [segnalazioni, searchQuery]);

  const mapCenter = useMemo(() => {
    if (selectedId && segnalazioni.length > 0) {
      const found = segnalazioni.find(s => s.id === selectedId);
      if (found && found.latitudine && found.longitudine) {
         return [found.latitudine, found.longitudine] as [number, number];
      }
    }
    return undefined;
  }, [selectedId, segnalazioni]);

  return (
    <div className="bg-gray-50 flex flex-col pt-24 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#1e3a5f] tracking-tight mb-2">Mappa del territorio</h1>
            <p className="text-gray-500 font-medium">Monitoraggio in tempo reale delle segnalazioni e della presenza animale a Naro.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cerca per specie o via..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] focus:border-[#15803d] outline-none w-64 transition-colors shadow-sm"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full relative h-[647px] border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
          <AppMap markers={animalMarkers} interactive={true} center={mapCenter} />
        </div>
      </div>
    </div>
  );
}
