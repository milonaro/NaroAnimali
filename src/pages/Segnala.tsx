import React, { useState } from 'react';
import AppMap from '@/src/components/map/Map';
import { PawPrint, MapPin, Camera, CheckCircle2, User } from 'lucide-react';
import { Segnalazione, AnimalSpecie, SegnalazioneStato } from '@/src/types';
import { isInTerritorio, getZona } from '@/src/lib/geofence';
import { db, storage } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';

export default function Segnala() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Segnalazione>>({
    specie: AnimalSpecie.CANE,
    condizioni: "NORMALE",
    colore: "",
    descrizione: "",
    consensoPrivacy: false,
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    if (!isInTerritorio(lat, lng)) {
      setError("La posizione selezionata è fuori dal territorio del Comune di Naro.");
      setLocation(null);
    } else {
      setError(null);
      setLocation({ lat, lng });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!location || !formData.consensoPrivacy) return;
    setLoading(true);
    setError(null);

    try {
      let fotoUrl = "";
      if (photo) {
        const storageRef = ref(storage, `segnalazioni/${Date.now()}_${photo.name}`);
        const snapshot = await uploadBytes(storageRef, photo);
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
          indirizzo: "Località rilevata da mappa",
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
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 className="h-20 w-20 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Segnalazione Inviata!</h2>
          <p className="text-gray-500 mb-8">
            Grazie per aver contributo alla tutela degli animali a Naro. 
            Conserva il tuo codice di tracking per seguire l'intervento:
          </p>
          <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-2xl text-2xl font-mono font-bold text-emerald-800 tracking-wider">
            {success}
          </div>
          <button onClick={() => window.location.href = '/'} className="mt-12 text-emerald-600 font-semibold hover:underline">
            Torna alla Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2 block">Modulo Istituzionale</span>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Nuova Segnalazione</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Contribuisci alla sicurezza di Naro.</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-4 mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-indigo-600' : 'bg-zinc-800'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Localizzazione
              </h2>
              <div className="h-[400px] mb-6 rounded-2xl overflow-hidden border border-zinc-800 grayscale">
                <AppMap interactive onLocationSelect={handleLocationSelect} />
              </div>
              {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
            </div>
            <button
              disabled={!location}
              onClick={() => setStep(2)}
              className="w-full bg-white text-zinc-950 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all disabled:opacity-20"
            >
              Prosegui
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <PawPrint className="h-3 w-3" /> Dettagli Soggetto
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Specie</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold uppercase tracking-widest text-white focus:border-indigo-500 outline-none transition-colors"
                    value={formData.specie}
                    onChange={(e) => setFormData({ ...formData, specie: e.target.value as AnimalSpecie })}
                  >
                    <option value={AnimalSpecie.CANE}>Cane</option>
                    <option value={AnimalSpecie.GATTO}>Gatto</option>
                    <option value={AnimalSpecie.ALTRO}>Altro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Condizioni</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold uppercase tracking-widest text-white focus:border-indigo-500 outline-none transition-colors"
                    value={formData.condizioni}
                    onChange={(e) => setFormData({ ...formData, condizioni: e.target.value })}
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="FERITO">Ferito</option>
                    <option value="AGGRESSIVO">Aggressivo</option>
                    <option value="CUCCIOLO">Cucciolo</option>
                    <option value="BRANCO">Branco</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Descrizione</label>
                <textarea
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold uppercase tracking-widest text-white focus:border-indigo-500 outline-none transition-colors"
                  rows={4}
                  placeholder="Note aggiuntive..."
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Documentazione Fotografica</label>
                <div className="relative group">
                  <div className="w-full bg-zinc-950 border-2 border-zinc-800 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center group-hover:border-indigo-500 transition-colors cursor-pointer">
                    <Camera className="h-8 w-8 text-zinc-700 mb-4 group-hover:text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-zinc-400">
                      {photo ? photo.name : 'Seleziona File'}
                    </span>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} accept="image/*" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-zinc-900 text-zinc-400 border border-zinc-800 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Indietro</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-white text-zinc-950 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Prosegui</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <User className="h-3 w-3" /> Checkpoint Finale
              </h2>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Canale di Contatto (Email)</label>
                <input
                  type="email"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold uppercase tracking-widest text-white focus:border-indigo-500 outline-none transition-colors"
                  placeholder="tua@email.com"
                  value={formData.emailSegnalante}
                  onChange={(e) => setFormData({ ...formData, emailSegnalante: e.target.value })}
                />
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
                <label className="flex gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 bg-zinc-900 border-zinc-800 rounded text-indigo-600 focus:ring-0"
                    checked={formData.consensoPrivacy}
                    onChange={(e) => setFormData({ ...formData, consensoPrivacy: e.target.checked })}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-relaxed">
                    Autorizzo il Comune di Naro al trattamento dei dati personali ai fini istituzionali.
                    <span className="text-white block mt-1">Obbligatorio per procedere.</span>
                  </span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-zinc-900 text-zinc-400 border border-zinc-800 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Indietro</button>
              <button
                disabled={!formData.consensoPrivacy || loading}
                onClick={handleSubmit}
                className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 disabled:opacity-20"
              >
                {loading ? 'Processing...' : 'Conferma Segnalazione'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
