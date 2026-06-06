import React, { useState, useEffect } from 'react';
import AppMap from '@/src/components/map/Map';
import { PawPrint, MapPin, CheckCircle2, User, WifiOff, Dog, Cat, MoreHorizontal, ShieldCheck, Info, Heart, AlertTriangle, Users, Baby, Thermometer, ChevronRight, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { Segnalazione, AnimalSpecie } from '@/src/types';
import { isInTerritorio } from '@/src/lib/geofence';
import { storage } from '@/src/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineStore } from '@/src/lib/offline';
import { Link } from 'react-router-dom';

const ANIMALI_GESTITI = [
  "Piccioni urbani (Columba livia domestica)",
  "Gabbiano reale mediterraneo (Larus michahellis)",
  "Storni (Sturnus vulgaris)",
  "Corvidi (cornacchie, gazze)",
  "Ratti e topi urbani (Rattus norvegicus, Mus musculus)",
  "Cinghiale (Sus scrofa)",
  "Volpe rossa (Vulpes vulpes)",
  "Istrice (Hystrix cristata)",
  "Lepre (Lepus europaeus) in aree periferiche",
  "Bovini (mucche, vitelli)",
  "Ovini (pecore)",
  "Caprini (capre)",
  "Suini allevati",
  "Serpenti autoctoni",
  "Tartarughe abbandonate (es. Trachemys scripta)",
  "Zanzare (Culex, Aedes)",
  "Blatte",
  "Formiche invasive",
  "Processionaria del pino (Thaumetopoea pityocampa)",
  "Colonie di piccioni sovrannumerari",
  "Roditori in reti fognarie",
  "Parassiti urbani legati a rifiuti e degrado",
  "Animali feriti o incidentati su strada",
  "Animali sequestrati o abbandonati in massa",
  "Fauna selvatica in contesto urbano pericoloso"
];

export default function Segnala() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Segnalazione>>({
    specie: undefined,
    condizioni: undefined,
    taglia: undefined,
    colore: "",
    descrizione: "",
    nomeSegnalante: "",
    cognomeSegnalante: "",
    telefonoSegnalante: "",
    emailSegnalante: "",
    consensoPrivacy: false,
    consensoNotifiche: false,
    dichiarazioneVeridicita: false,
    assunzioneResponsabilita: false,
  });

  const [isAltroSelected, setIsAltroSelected] = useState(false);
  const [managedAnimalQuery, setManagedAnimalQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationDetails, setLocationDetails] = useState<{ address: string; placeName: string } | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const handleSync = async () => {
      if (!navigator.onLine) return;
      const pending = OfflineStore.getAll();
      for (const report of pending) {
        try {
          const res = await fetch('/api/segnalazioni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report.data)
          });
          if (res.ok) {
            OfflineStore.remove(report.id);
          }
        } catch (e) {
          console.error("Sync failed for", report.id, e);
        }
      }
    };

    window.addEventListener('online', handleSync);
    return () => window.removeEventListener('online', handleSync);
  }, []);

  const steps = [
    { id: 1, label: 'Dove' },
    { id: 2, label: 'Animale' },
    { id: 3, label: 'I tuoi dati' },
    { id: 4, label: 'Dichiarazione' },
    { id: 5, label: 'Conferma' }
  ];

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: {
          'Accept-Language': 'it,en',
          'User-Agent': 'AnimalHubPA'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `Naro, Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        const placeName = data.name || data.address?.road || data.address?.suburb || data.address?.village || "Posizione Rilevata";
        setLocationDetails({ address, placeName });
        setFormData(prev => ({ ...prev, indirizzo: address }));
      } else {
        throw new Error("Geocoding failed");
      }
    } catch (e) {
      console.error(e);
      const address = `Naro (AG), Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      const placeName = `Zona di Naro`;
      setLocationDetails({ address, placeName });
      setFormData(prev => ({ ...prev, indirizzo: address }));
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (!isInTerritorio(lat, lng)) {
      setError("La posizione selezionata è fuori dal territorio del Comune di Naro.");
      setLocation(null);
      setLocationDetails(null);
    } else {
      setError(null);
      setLocation({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas conversion failed'));
            },
            'image/jpeg',
            0.7 // quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = async () => {
    if (!location || 
        !formData.nomeSegnalante || 
        !formData.cognomeSegnalante || 
        !formData.telefonoSegnalante || 
        !formData.emailSegnalante || 
        !formData.consensoPrivacy ||
        !formData.dichiarazioneVeridicita || 
        !(formData as any).assunzioneResponsabilita
    ) {
      setError("Tutti i campi relativi alla tua identità e le dichiarazioni legali di responsabilità ai sensi del DPR 445/2000 devono essere compilati e accettati per poter completare l'invio protocollato.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        OfflineStore.save({
          ...formData,
          lat: location.lat,
          lng: location.lng,
          fotoUrl: "",
          indirizzo: "Località salvata (Offline)",
        } as any);
        setIsOfflineMode(true);
        setSuccess("OFFLINE_CACHED");
        return;
      }

      let fotoUrl = "";
      if (photo) {
        const compressedBlob = await compressImage(photo);
        const storageRef = ref(storage, `segnalazioni/${Date.now()}_${photo.name.replace(/\.[^/.]+$/, "")}.jpg`);
        const snapshot = await uploadBytes(storageRef, compressedBlob);
        fotoUrl = await getDownloadURL(snapshot.ref);
      }

      const res = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: location.lat,
          lng: location.lng,
          fotoUrl,
          indirizzo: locationDetails?.address || "Località rilevata da mappa",
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSuccess(data.codiceTracking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const isCached = success === "OFFLINE_CACHED";
    return (
      <div className="max-w-xl mx-auto pt-40 pb-24 px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="flex justify-center mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isCached ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {isCached ? <WifiOff className="h-10 w-10 text-amber-600" /> : <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
            {isCached ? 'Segnalazione Salvata' : 'Segnalazione Inviata!'}
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
            {isCached 
              ? 'Connessione assente. La segnalazione verrà inviata automaticamente appena tornerai online.' 
              : 'Grazie per il tuo contributo. Gli operatori prenderanno in carico la segnalazione a breve.'}
          </p>

          {!isCached && (
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-lg mb-8">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Codice di Tracking</p>
               <span className="text-3xl font-bold text-[#1e3a5f] tracking-widest uppercase">{success}</span>
            </div>
          )}

          <button onClick={() => window.location.href = '/'} className="text-[#15803d] font-bold flex items-center gap-2 mx-auto hover:underline">
            Torna alla Home <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      {/* Hero Section */}
      <section className="bg-[#101b3a] py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-20"
            alt="Animal rescue background"
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Protocollo Digitale Sicuro</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Nuova Segnalazione
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Il tuo contributo è fondamentale per la tutela degli animali di Naro.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-16 px-4 flex-1 w-full">
        {/* Progress Stepper */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-10 px-4">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                step === s.id ? 'bg-[#15803d] text-white shadow-lg shadow-[#15803d]/20 scale-110' : 
                step > s.id ? 'bg-[#15803d] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${step === s.id ? 'text-[#15803d]' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-1 w-12 md:w-20 rounded-full ${step > s.id ? 'bg-[#15803d]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
        </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }}
          className="bg-white border border-gray-100 rounded-lg shadow-2xl shadow-black/5 overflow-hidden min-h-[600px] flex flex-col"
        >
          {/* Visual Progress Bar and Percentage Tracker */}
          <div className="bg-gray-50/50 border-b border-gray-100 p-6">
            <div className="flex justify-between items-center mb-3 max-w-4xl mx-auto">
              <span className="text-[10px] font-black text-[#15803d] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Stato Compilazione
              </span>
              <span className="text-xs font-black text-[#101b3a] bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-100">
                {Math.round((step / steps.length) * 100)}% Completato
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/40 p-[1px] max-w-4xl mx-auto">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#15803d] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.15em] mt-3.5 text-center">
              {step === 5 ? "Pronto per l'invio ufficiale al Comune di Naro" : `Prossimo passo: ${steps[step].label}`}
            </p>
          </div>

          <div className="p-10 md:p-16 flex-1">
            {step === 1 && (
              <div className="space-y-8 flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><MapPin className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">Dove si trova l'animale?</h2>
                       <p className="text-gray-500 text-sm">Clicca sulla mappa per indicare la posizione esatta della segnalazione.</p>
                     </div>
                  </div>
                  {location && (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all shadow-lg shadow-[#15803d]/30"
                    >
                      Avanti <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="h-[320px] md:h-[420px] w-full rounded-lg overflow-hidden border border-gray-100 relative shadow-inner">
                  <AppMap interactive onLocationSelect={handleLocationSelect} hideFilters />
                </div>
                {error && <p className="text-red-500 font-bold text-xs">{error}</p>}
                {location && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Posizione Rilevata</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#15803d] shrink-0" />
                        {isGeocoding ? (
                          <span className="text-xs text-slate-400 font-medium">Calcolo indirizzo...</span>
                        ) : (
                          <p className="text-xs md:text-sm font-black text-[#1e3a5f] leading-relaxed">
                            {locationDetails?.address || "Coordinate definite sulla mappa"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200/60 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Coordinate (Lat, Lng)</span>
                        <span className="text-xs font-mono font-bold text-[#15803d]">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-[#15803d] uppercase tracking-wider">Mappa OK</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

             {step === 2 && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><PawPrint className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">Che animale hai visto?</h2>
                       <p className="text-gray-500 text-sm">Identifica la specie e le condizioni del soggetto.</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
                    </button>
                    {(formData.specie && formData.condizioni && formData.taglia) && (
                      <button
                        onClick={() => setStep(step + 1)}
                        className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30"
                      >
                        Avanti <ArrowRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Specie *</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: AnimalSpecie.CANE, label: 'Cane', icon: <Dog className="h-6 w-6" />, active: formData.specie === AnimalSpecie.CANE },
                        { id: AnimalSpecie.GATTO, label: 'Gatto', icon: <Cat className="h-6 w-6" />, active: formData.specie === AnimalSpecie.GATTO },
                        { id: AnimalSpecie.ALTRO, label: 'Altro', icon: <MoreHorizontal className="h-6 w-6" />, active: (formData.specie !== undefined && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO) || isAltroSelected }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id === AnimalSpecie.ALTRO) {
                              setFormData({ ...formData, specie: undefined });
                              setIsAltroSelected(true);
                            } else {
                              setFormData({ ...formData, specie: item.id });
                              setIsAltroSelected(false);
                            }
                          }}
                          className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-3 cursor-pointer ${
                            item.active ? 'border-[#15803d] bg-emerald-50 text-[#15803d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {item.icon}
                          <span className="font-bold text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Managed Animals from AnimaliGestiti.md */}
                  {(isAltroSelected || (formData.specie !== undefined && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO)) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wide">
                            Seleziona Animale Gestito dal Comune
                          </h3>
                          <p className="text-gray-500 text-xs mt-1">
                            Seleziona uno dei soggetti tutelati ai sensi del file comunale AnimaliGestiti.md.
                          </p>
                        </div>
                        {formData.specie && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO && (
                          <div className="px-4 py-2 bg-[#15803d]/10 border border-[#15803d]/20 rounded-lg text-xs font-bold text-[#15803d] flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> Selezionato: <strong className="uppercase">{formData.specie}</strong>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cerca animale (es. Cinghiale, Volpe, Piccione...)"
                          className="w-full bg-white border border-slate-200 px-4 py-3 rounded-lg focus:border-[#15803d] focus:outline-none text-sm placeholder-slate-400 font-medium"
                          value={managedAnimalQuery}
                          onChange={(e) => setManagedAnimalQuery(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {ANIMALI_GESTITI.filter(animal => 
                          animal.toLowerCase().includes(managedAnimalQuery.toLowerCase())
                        ).map((animal) => {
                          const isSelected = formData.specie === animal;
                          return (
                            <button
                              key={animal}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, specie: animal as any });
                                setIsAltroSelected(true);
                              }}
                              className={`p-3 text-left rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#15803d] text-white border-[#15803d]' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <span>{animal}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4 flex items-center gap-2">Taglia * <Info className="h-3 w-3" /></label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['PICCOLA', 'MEDIA', 'GRANDE'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, taglia: t as any })}
                          className={`p-4 rounded-lg border-2 font-bold text-xs transition-all cursor-pointer ${
                            formData.taglia === t ? 'border-[#15803d] bg-emerald-50 text-[#15803d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Condizioni *</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { id: 'NORMALE', label: 'Normale', icon: <Heart className="h-5 w-5" /> },
                        { id: 'FERITO', label: 'Ferito', icon: <Thermometer className="h-5 w-5" /> },
                        { id: 'AGGRESSIVO', label: 'Aggressivo', icon: <AlertTriangle className="h-5 w-5" /> },
                        { id: 'CUCCIOLO', label: 'Cucciolo', icon: <Baby className="h-5 w-5" /> },
                        { id: 'BRANCO', label: 'Branco', icon: <Users className="h-5 w-5" /> }
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, condizioni: c.id })}
                          className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                            formData.condizioni === c.id 
                              ? `border-[#15803d] bg-emerald-50 text-[#15803d]` 
                              : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {c.icon}
                          <span className="font-bold text-[10px] uppercase tracking-wider">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">Colore mantello</label>
                        <input 
                           type="text" 
                           placeholder="es. Marrone e bianco"
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                           value={formData.colore}
                           onChange={(e) => setFormData({ ...formData, colore: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">Descrizione aggiuntiva</label>
                        <input 
                           type="text" 
                           placeholder="Note utili agli operatori..."
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                           value={formData.descrizione}
                           onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                        />
                     </div>
                  </div>

                  {/* Modulo A - Photo Upload Section */}
                  <div className="border-t border-gray-100 pt-8">
                     <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4 flex items-center gap-2">
                       Carica Foto dell'Animale <span className="normal-case text-gray-400 font-medium">(Obbligatorio per Modulo A)</span>
                     </label>
                     
                     <div 
                       onDragOver={(e) => e.preventDefault()}
                       onDrop={(e) => {
                         e.preventDefault();
                         if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                           setPhoto(e.dataTransfer.files[0]);
                         }
                       }}
                       className="border-2 border-dashed border-gray-200 hover:border-[#15803d] rounded-xl p-8 bg-gray-50/50 transition-all text-center relative cursor-pointer"
                     >
                       {photo ? (
                         <div className="space-y-4">
                           <div className="relative inline-block w-40 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm mx-auto">
                             <img 
                               src={URL.createObjectURL(photo)} 
                               alt="Anteprima" 
                               className="w-full h-full object-cover"
                             />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-700">{photo.name}</p>
                             <p className="text-[10px] text-gray-400">{(photo.size / 1024).toFixed(1)} KB</p>
                           </div>
                           <button
                             type="button"
                             onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                             className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition-all border border-red-100 mx-auto"
                           >
                             Rimuovi foto
                           </button>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                             <Camera className="h-6 w-6" />
                           </div>
                           <div className="text-xs font-bold text-slate-600">
                             Trascina qui la foto dallo smartphone/PC oppure <span className="text-[#15803d] underline">Sfoglia i file</span>
                           </div>
                           <p className="text-[10px] text-gray-400">Supporta JPEG, PNG. Puoi scattarla direttamente sul posto.</p>
                           <input 
                             type="file" 
                             accept="image/*" 
                             capture="environment"
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                             onChange={(e) => {
                               if (e.target.files && e.target.files[0]) {
                                 setPhoto(e.target.files[0]);
                               }
                             }}
                           />
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><User className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">I tuoi dati personali</h2>
                       <p className="text-gray-500 text-sm">I tuoi dati sono necessari per gestire la segnalazione e poterti aggiornare sullo stato.</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
                    </button>
                    {(formData.nomeSegnalante && formData.cognomeSegnalante && formData.telefonoSegnalante && formData.emailSegnalante && formData.consensoPrivacy) && (
                      <button
                        onClick={() => setStep(step + 1)}
                        className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30"
                      >
                        Avanti <ArrowRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Nome *</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                      placeholder="Il tuo nome"
                      value={formData.nomeSegnalante}
                      onChange={(e) => setFormData({ ...formData, nomeSegnalante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Cognome *</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                      placeholder="Il tuo cognome"
                      value={formData.cognomeSegnalante}
                      onChange={(e) => setFormData({ ...formData, cognomeSegnalante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Telefono *</label>
                    <input
                      type="tel"
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                      placeholder="Inserisci il tuo numero di telefono"
                      value={formData.telefonoSegnalante}
                      onChange={(e) => setFormData({ ...formData, telefonoSegnalante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Email *</label>
                    <input
                      type="email"
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                      placeholder="la.tua@email.it"
                      value={formData.emailSegnalante}
                      onChange={(e) => setFormData({ ...formData, emailSegnalante: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-8">
                  <label className="flex gap-4 p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
                      checked={formData.consensoPrivacy}
                      onChange={(e) => setFormData({ ...formData, consensoPrivacy: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      Ho letto e accetto la <Link to="/privacy-policy" className="text-[#15803d] font-bold hover:underline">Privacy Policy</Link> *
                    </span>
                  </label>
                  <label className="flex gap-4 p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
                      checked={formData.consensoNotifiche}
                      onChange={(e) => setFormData({ ...formData, consensoNotifiche: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      Acconsento a ricevere notifiche via email sugli aggiornamenti della segnalazione
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><ShieldCheck className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">Dichiarazione di veridicità</h2>
                       <p className="text-gray-500 text-sm">Ai sensi del DPR 445/2000, è necessario dichiarare la veridicità dei dati forniti.</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
                    </button>
                    {formData.dichiarazioneVeridicita && (formData as any).assunzioneResponsabilita && (
                      <button
                        onClick={() => setStep(step + 1)}
                        className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30"
                      >
                        Avanti <ArrowRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-8 md:p-12 rounded-lg relative">
                   <ShieldCheck className="absolute top-8 right-8 h-8 w-8 text-indigo-100 invisible md:visible" />
                   <div className="prose prose-sm text-gray-600 max-w-none space-y-6">
                      <p className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-indigo-500" /> Dichiarazione sostitutiva di certificazione</p>
                      <p>Il/la sottoscritt/a <strong>{formData.nomeSegnalante} {formData.cognomeSegnalante}</strong>, consapevole delle sanzioni penali previste dall'art. 76 del DPR 445/2000 per le ipotesi di falsità in atti e dichiarazioni mendaci,</p>
                      <p className="font-bold uppercase tracking-widest text-[#1e3a5f]">DICHIARA</p>
                      <p>che i dati forniti nella presente segnalazione — relativi alla posizione dell'animale, alle sue condizioni e ai propri dati personali — sono veritieri e corrispondenti a realtà.</p>
                      <p>La presente dichiarazione è resa ai sensi degli articoli 46 e 47 del DPR 28 dicembre 2000, n. 445, e disciplina le modalità con le quali i cittadini possono autocertificare stati e fatti personali.</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="flex gap-4 p-6 bg-[#15803d]/5 border-2 border-[#15803d]/20 rounded-lg cursor-pointer hover:bg-[#15803d]/10 transition-colors shadow-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-6 w-6 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
                      checked={formData.dichiarazioneVeridicita}
                      onChange={(e) => setFormData({ ...formData, dichiarazioneVeridicita: e.target.checked })}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1e3a5f]">Dichiaro di aver letto la dichiarazione sopra riportata e confermo la veridicità dei dati forniti *</span>
                      <span className="text-[10px] text-[#15803d] font-bold uppercase tracking-widest mt-1">La dichiarazione è obbligatoria ai sensi del DPR 445/2000</span>
                    </div>
                  </label>

                  <label className="flex gap-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors shadow-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-6 w-6 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                      checked={(formData as any).assunzioneResponsabilita}
                      onChange={(e) => setFormData({ ...formData, assunzioneResponsabilita: e.target.checked } as any)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1e3a5f]">Mi assumo la piena responsabilità della segnalazione effettuata nel rispetto della legge *</span>
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">L'abuso del servizio o procurato allarme è perseguibile</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-10 py-6">
                 {/* Navigation header inside step */}
                 <div className="flex justify-between items-center w-full">
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm text-sm"
                    >
                      <ArrowLeft className="h-4 w-4" /> <span>Indietro</span>
                    </button>
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-[#15803d] uppercase tracking-wider">Riepilogo Pronto</span>
                    </div>
                 </div>

                 {/* Success Badge */}
                 <div className="text-center space-y-3">
                   <div className="w-16 h-16 bg-emerald-50 text-[#15803d] rounded-full flex items-center justify-center mx-auto shadow-md">
                      <ShieldCheck className="h-8 w-8" />
                   </div>
                   <h2 className="text-3xl font-black text-[#1e3a5f] tracking-tight">Rivedi la tua Segnalazione</h2>
                   <p className="text-gray-500 text-sm max-w-lg mx-auto">
                     Verifica attentamente tutti i dettagli inseriti. Una volta cliccato su "Invia", la segnalazione verrà registrata nel protocollo comunale digitale di Naro.
                   </p>
                 </div>

                 {/* Detailed Sections Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                   {/* Col 1: Animale & Allegati */}
                   <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 space-y-4">
                     <h3 className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                       <PawPrint className="h-4 w-4 text-[#15803d]" />
                       Animale Segnalato
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Specie</span>
                         <span className="font-bold text-sm text-[#1e3a5f] uppercase block">{formData.specie}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Taglia</span>
                         <span className="font-bold text-sm text-[#1e3a5f] block">{formData.taglia || 'N.D.'}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Condizioni</span>
                         <span className="font-bold text-sm text-[#1e3a5f] block">
                           <span className="px-2 py-0.5 bg-[#15803d]/10 border border-[#15803d]/20 rounded text-xs font-extrabold text-[#15803d] uppercase inline-block mt-0.5">
                             {formData.condizioni}
                           </span>
                         </span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Colore Mantello</span>
                         <span className="font-bold text-sm text-[#1e3a5f] block">{formData.colore || 'Non specificato'}</span>
                       </div>
                     </div>
                     
                     {formData.descrizione && (
                       <div className="bg-white p-3 rounded-lg border border-slate-200/40">
                         <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Note / Descrizione</span>
                         <p className="text-xs text-slate-600 leading-relaxed font-medium">"{formData.descrizione}"</p>
                       </div>
                     )}

                     {/* Image Thumbnail inside review if available */}
                     {photo && (
                       <div className="bg-white p-3 rounded-lg border border-slate-200/40 flex items-center gap-3">
                         <div className="h-12 w-12 rounded overflow-hidden border border-slate-200 shrink-0">
                           <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="min-w-0">
                           <span className="text-[9px] font-bold text-slate-400 uppercase block">Fotografia Allegata</span>
                           <p className="text-xs font-bold text-slate-700 truncate">{photo.name}</p>
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Col 2: Posizione & Segnalante */}
                   <div className="space-y-6">
                     {/* Posizione Card */}
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 space-y-3">
                       <h3 className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                         <MapPin className="h-4 w-4 text-[#15803d]" />
                         Localizzazione
                       </h3>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Indirizzo Rilevato</span>
                         <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2">
                           {locationDetails?.address || "Coordinate sulla mappa"}
                         </p>
                       </div>
                       <div className="flex justify-between items-center">
                         <div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase block">Coordinate Geografiche</span>
                           <span className="text-xs font-mono font-semibold text-slate-600">
                             {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                           </span>
                         </div>
                         <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                           In Territorio Naro
                         </span>
                       </div>
                     </div>

                     {/* Segnalante Card */}
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 space-y-3">
                       <h3 className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                         <User className="h-4 w-4 text-[#15803d]" />
                         Dati del Segnalante
                       </h3>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Nome & Cognome</span>
                           <span className="font-bold text-xs text-[#1e3a5f] block">
                             {formData.nomeSegnalante} {formData.cognomeSegnalante}
                           </span>
                         </div>
                         <div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Telefono</span>
                           <span className="font-bold text-xs text-[#1e3a5f] block">{formData.telefonoSegnalante}</span>
                         </div>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Indirizzo Email</span>
                         <span className="font-bold text-xs text-slate-600 block truncate">{formData.emailSegnalante}</span>
                       </div>
                       
                       {/* Consent Checklist status representation */}
                       <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                           <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                           Conformità Privacy & DPR 445/2000
                         </div>
                         {formData.consensoNotifiche ? (
                           <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 rounded px-2 py-0.5 mt-1 self-start">
                             <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                             Notifiche Email Attive
                           </div>
                         ) : (
                           <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                             Nessun invio notifiche automatiche richiesto
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Action Panel */}
                 <div className="pt-6 border-t border-slate-100 text-center space-y-4">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full md:w-[350px] mx-auto bg-[#15803d] text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30 disabled:opacity-50 text-base"
                    >
                      {loading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Invia Segnalazione Ufficiale <ArrowRight className="h-5 w-5" /></>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider max-w-sm mx-auto">
                      Cliccando dichiari la veridicità delle informazioni inserite ai sensi delle norme vigenti.
                    </p>
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      <p className="text-center text-slate-700 text-[10px] font-bold mt-12 uppercase tracking-[0.2em] max-w-xl mx-auto leading-relaxed">
        Il sistema AnimalHub PA è una piattaforma ufficiale del Comune di Naro. Le segnalazioni mendaci sono punite ai sensi della legge italiana.
      </p>
    </div>
    </div>
  );
}
