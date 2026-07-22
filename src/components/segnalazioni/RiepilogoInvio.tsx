import React from 'react';
import { ShieldCheck, ArrowLeft, ArrowRight, FileText, PawPrint, MapPin, User, CheckCircle2 } from 'lucide-react';

interface RiepilogoInvioProps {
  formData: any;
  location: { lat: number; lng: number } | null;
  locationDetails: any;
  photo: File | null;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
  generateSegnalazionePDF: () => void;
  siteName: string;
}

const RiepilogoInvio: React.FC<RiepilogoInvioProps> = ({
  formData,
  location,
  locationDetails,
  photo,
  loading,
  onBack,
  onSubmit,
  generateSegnalazionePDF,
  siteName
}) => {
  return (
    <div className="space-y-10 py-6">
       <div className="flex justify-between items-center w-full">
          <button
            type="button"
            onClick={onBack}
            className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> <span>Indietro</span>
          </button>
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-[#15803d] uppercase tracking-wider">Riepilogo Pronto</span>
          </div>
       </div>

       <div className="text-center space-y-3">
         <div className="w-16 h-16 bg-emerald-50 text-[#15803d] rounded-full flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="h-8 w-8" />
         </div>
         <h2 className="text-3xl font-black text-[#1e3a5f] tracking-tight">Rivedi la tua Segnalazione</h2>
         <p className="text-gray-500 text-sm max-w-lg mx-auto">
           Verifica attentamente tutti i dettagli inseriti. Una volta cliccato su "Invia", la segnalazione verrà registrata nel protocollo comunale digitale di {siteName.replace(/^Comune di\s+/i, "")}.
         </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
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

         <div className="space-y-6">
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
               <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-bold text-[#15803d] uppercase tracking-wider">
                 In Territorio Naro
               </div>
             </div>
           </div>

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

       <div className="pt-6 border-t border-slate-100 text-center space-y-4 flex flex-col items-center">
         <button
           type="button"
           onClick={generateSegnalazionePDF}
           className="w-full md:w-[350px] bg-white border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f]/5 px-8 py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-sm"
         >
           <FileText className="h-4.5 w-4.5" /> Genera Anteprima Verbale (PDF)
         </button>
          <button
            type="button"
            onClick={onSubmit}
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
  );
};

export default RiepilogoInvio;
