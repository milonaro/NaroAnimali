import React from 'react';
import { PawPrint, ArrowLeft, ArrowRight, Dog, Cat, MoreHorizontal, CheckCircle2, Info, Heart, Thermometer, AlertTriangle, Baby, Users, Camera } from 'lucide-react';
import { AnimalSpecie } from '@/src/types';

interface ModuloDatiAnimaleProps {
  formData: any;
  setFormData: (data: any) => void;
  isAltroSelected: boolean;
  setIsAltroSelected: (val: boolean) => void;
  managedAnimalQuery: string;
  setManagedAnimalQuery: (val: string) => void;
  animaliGestiti: string[];
  photo: File | null;
  setPhoto: (file: File | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const ModuloDatiAnimale: React.FC<ModuloDatiAnimaleProps> = ({
  formData,
  setFormData,
  isAltroSelected,
  setIsAltroSelected,
  managedAnimalQuery,
  setManagedAnimalQuery,
  animaliGestiti,
  photo,
  setPhoto,
  onNext,
  onBack
}) => {
  return (
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
            onClick={onBack}
            className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
          </button>
          {(formData.specie && formData.condizioni && formData.taglia) && (
            <button
              onClick={onNext}
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
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {[
              { id: AnimalSpecie.CANE, label: 'Cane', icon: <Dog className="h-5 w-5 md:h-6 md:w-6" />, active: formData.specie === AnimalSpecie.CANE },
              { id: AnimalSpecie.GATTO, label: 'Gatto', icon: <Cat className="h-5 w-5 md:h-6 md:w-6" />, active: formData.specie === AnimalSpecie.GATTO },
              { id: AnimalSpecie.ALTRO, label: 'Altro', icon: <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6" />, active: (formData.specie !== undefined && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO) || isAltroSelected }
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
                className={`p-3 md:p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-2 md:gap-3 cursor-pointer ${
                  item.active ? 'border-[#15803d] bg-emerald-50 text-[#15803d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                }`}
              >
                {item.icon}
                <span className="font-black text-xs md:text-sm tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

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
              {animaliGestiti.filter(animal => 
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
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {['PICCOLA', 'MEDIA', 'GRANDE'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, taglia: t as any })}
                className={`p-3 md:p-4 rounded-lg border-2 font-black text-[10px] md:text-xs tracking-wider transition-all cursor-pointer ${
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
            {[
              { id: 'NORMALE', label: 'Normale', icon: <Heart className="h-4 w-4 md:h-5 md:w-5" /> },
              { id: 'FERITO', label: 'Ferito', icon: <Thermometer className="h-4 w-4 md:h-5 md:w-5" /> },
              { id: 'AGGRESSIVO', label: 'Aggressivo', icon: <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" /> },
              { id: 'CUCCIOLO', label: 'Cucciolo', icon: <Baby className="h-4 w-4 md:h-5 md:w-5" /> },
              { id: 'BRANCO', label: 'Branco', icon: <Users className="h-4 w-4 md:h-5 md:w-5" /> },
              { id: 'ALTRO', label: 'Altro', icon: <MoreHorizontal className="h-4 w-4 md:h-5 md:w-5" /> }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFormData({ ...formData, condizioni: item.id as any })}
                className={`p-3 md:p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 md:gap-3 cursor-pointer ${
                  formData.condizioni === item.id ? 'border-[#15803d] bg-emerald-50 text-[#15803d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                }`}
              >
                <div className={formData.condizioni === item.id ? 'text-[#15803d]' : 'text-gray-400'}>{item.icon}</div>
                <span className="font-black text-[10px] md:text-xs tracking-wider uppercase">{item.label}</span>
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
                 value={formData.colore || ''}
                 onChange={(e) => setFormData({ ...formData, colore: e.target.value })}
              />
           </div>
           <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">Descrizione aggiuntiva</label>
              <input 
                 type="text" 
                 placeholder="Note utili agli operatori..."
                 className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                 value={formData.descrizione || ''}
                 onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              />
           </div>
        </div>

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
  );
};

export default ModuloDatiAnimale;
