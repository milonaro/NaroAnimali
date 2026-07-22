import React from 'react';
import { User, ArrowLeft, ArrowRight, ShieldCheck, Info, X } from 'lucide-react';
import { parseMarkdownToReact } from '@/src/utils/markdownRenderer';

interface ModuloDatiSegnalanteProps {
  formData: any;
  setFormData: (data: any) => void;
  autoRecoverStatus: { message: string; type: 'success' | 'info' | 'error' | null };
  isPrivacyModalOpen: boolean;
  setIsPrivacyModalOpen: (val: boolean) => void;
  privacyText: string;
  defaultPrivacyText: string;
  onNext: () => void;
  onBack: () => void;
}

const ModuloDatiSegnalante: React.FC<ModuloDatiSegnalanteProps> = ({
  formData,
  setFormData,
  autoRecoverStatus,
  isPrivacyModalOpen,
  setIsPrivacyModalOpen,
  privacyText,
  defaultPrivacyText,
  onNext,
  onBack
}) => {
  const canProceed = formData.nomeSegnalante && 
                     formData.cognomeSegnalante && 
                     formData.telefonoSegnalante && 
                     formData.emailSegnalante && 
                     formData.consensoPrivacy && 
                     formData.dichiarazioneVeridicita && 
                     formData.assunzioneResponsabilita;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><User className="h-6 w-6" /></div>
           <div>
             <h2 className="text-2xl font-bold text-[#1e3a5f]">Dati personali e Dichiarazioni</h2>
             <p className="text-gray-500 text-sm">Inserisci i tuoi contatti e firma le dichiarazioni di veridicità richieste per legge.</p>
           </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={onBack}
            className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
          </button>
          {canProceed ? (
            <button
              onClick={onNext}
              className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30"
            >
              Avanti <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              disabled
              className="w-full md:w-auto bg-gray-100 text-gray-400 px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200/60"
              title="Compila tutti i campi obbligatori e firma le dichiarazioni legali per procedere"
            >
              Avanti <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {autoRecoverStatus.message && (
        <div className={`p-4 rounded-xl mb-4 border text-[11px] font-extrabold transition-all leading-relaxed ${
          autoRecoverStatus.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
        }`}>
          {autoRecoverStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Nome *</label>
          <input
            type="text"
            className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
            placeholder="Il tuo nome"
            value={formData.nomeSegnalante}
            onChange={(e) => setFormData({ ...formData, nomeSegnalante: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Cognome *</label>
          <input
            type="text"
            className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
            placeholder="Il tuo cognome"
            value={formData.cognomeSegnalante}
            onChange={(e) => setFormData({ ...formData, cognomeSegnalante: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Telefono *</label>
          <input
            type="tel"
            className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
            placeholder="Inserisci il tuo numero di telefono"
            value={formData.telefonoSegnalante}
            onChange={(e) => setFormData({ ...formData, telefonoSegnalante: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Email *</label>
          <input
            type="email"
            className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
            placeholder="la.tua@email.it"
            value={formData.emailSegnalante}
            onChange={(e) => setFormData({ ...formData, emailSegnalante: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-6 md:p-10 rounded-xl relative space-y-4">
        <ShieldCheck className="absolute top-6 right-6 h-8 w-8 text-indigo-100 invisible md:visible" />
        <div className="prose prose-sm text-gray-600 max-w-none space-y-4">
          <p className="font-bold flex items-center gap-2 text-[#1e3a5f]">
            <Info className="h-4 w-4 text-emerald-600" />
            Dichiarazione sostitutiva di certificazione (DPR n. 445/2000)
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            Il/la sottoscritt/a <strong className="text-slate-800">{formData.nomeSegnalante || '_________________'} {formData.cognomeSegnalante || '_________________'}</strong>, consapevole delle sanzioni penali previste dall'art. 76 del DPR 445/2000 per le ipotesi di falsità in atti e dichiarazioni mendaci,
          </p>
          <p className="font-black uppercase tracking-widest text-xs text-[#1e3a5f]">DICHIARA SOTTO LA PROPRIA RESPONSABILITÀ</p>
          <p className="text-xs leading-relaxed text-slate-500">
            che i dati forniti nella presente segnalazione — relativi allo stato, alle condizioni, alla specie dell'animale, alla localizzazione dell'evento e ai propri dati anagrafici — sono veritieri e corrispondenti alla realtà dei fatti constatata personalmente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <label className="flex gap-4 p-5 bg-white border border-gray-150 rounded-lg cursor-pointer hover:bg-slate-50/50 transition-colors">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
            checked={formData.consensoPrivacy}
            onChange={(e) => setFormData({ ...formData, consensoPrivacy: e.target.checked })}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1e3a5f]">Accetto la Privacy Policy *</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              I dati forniti sono trattati secondo il Regolamento GDPR.{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPrivacyModalOpen(true);
                }}
                className="text-[#15803d] font-bold hover:underline cursor-pointer focus:outline-none"
              >
                Leggi Privacy Policy
              </button>
            </span>
          </div>
        </label>

        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-slate-150 animate-scaleIn">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-black text-[#1e3a5f] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#15803d]" />
                  Informativa Privacy (Regolamento GDPR)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto text-sm leading-relaxed text-slate-600 space-y-4 font-sans max-h-[55vh]">
                {parseMarkdownToReact(privacyText || defaultPrivacyText)}
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, consensoPrivacy: true });
                    setIsPrivacyModalOpen(false);
                  }}
                  className="px-6 py-2.5 bg-[#15803d] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#15803d]/90 shadow-md hover:shadow-lg transition-all"
                >
                  Accetta e Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        <label className="flex gap-4 p-5 bg-white border border-gray-150 rounded-lg cursor-pointer hover:bg-slate-50/50 transition-colors">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
            checked={formData.consensoNotifiche}
            onChange={(e) => setFormData({ ...formData, consensoNotifiche: e.target.checked })}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-600">Invio notifiche automatiche (Facoltativo)</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Acconsento a ricevere aggiornamenti sullo stato di avanzamento dell'intervento via email.</span>
          </div>
        </label>

        <label className="flex gap-4 p-5 bg-[#15803d]/5 border border-[#15803d]/20 rounded-lg cursor-pointer hover:bg-[#15803d]/10 transition-colors">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
            checked={formData.dichiarazioneVeridicita}
            onChange={(e) => setFormData({ ...formData, dichiarazioneVeridicita: e.target.checked })}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1e3a5f]">Autocertificazione di veridicità ai sensi del DPR 445/2000 *</span>
            <span className="text-[10px] text-[#15803d] font-bold uppercase tracking-widest mt-0.5">Obbligatorio ai fini della corretta assunzione in carico del protocollo digitale</span>
          </div>
        </label>

        <label className="flex gap-4 p-5 bg-amber-50/50 border border-amber-200/80 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
            checked={formData.assunzioneResponsabilita}
            onChange={(e) => setFormData({ ...formData, assunzioneResponsabilita: e.target.checked })}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1e3a5f]">Assunzione di responsabilità penale e legale *</span>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">La segnalazione non è anonima e l'abuso/falso allarme è perseguibile</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default ModuloDatiSegnalante;
