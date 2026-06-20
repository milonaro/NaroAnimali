import React, { useRef, useState } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, Link, List, FileClock, Eye, Edit2, Trash2, HelpCircle } from 'lucide-react';
import { parseMarkdownToReact } from '../../utils/markdownRenderer';
import { popup } from '../../lib/popup';

interface AdvancedPolicyEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultFallbackText: string;
  placeholder?: string;
  description?: string;
}

export default function AdvancedPolicyEditor({
  label,
  value,
  onChange,
  defaultFallbackText,
  placeholder,
  description
}: AdvancedPolicyEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert markdown tags securely at cursor selection
  const handleInsertStyle = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const wrappedText = prefix + (selectedText || 'testo') + suffix;

    const newText = text.substring(0, start) + wrappedText + text.substring(end);
    onChange(newText);

    // Restore caret position
    setTimeout(() => {
      textarea.focus();
      const caretOffset = prefix.length;
      textarea.setSelectionRange(
        start + caretOffset,
        start + caretOffset + (selectedText || 'testo').length
      );
    }, 50);
  };

  const handleInsertLink = () => {
    const title = window.prompt("Inserisci il testo visibile del link:", "Comune di Naro");
    if (title === null) return;
    const url = window.prompt("Inserisci l'indirizzo URL completo (es. https://...):", "https://comune.naro.ag.it");
    if (url === null) return;

    handleInsertStyle(`[${title}](${url})`);
  };

  const loadDefaultTemplate = () => {
    popup.confirm(
      "Sei sicuro di voler caricare il testo ministeriale originario come modello di base? Questo sostituirà eventuali modifiche non salvate in questa sessione.",
      () => {
        onChange(defaultFallbackText);
        setActiveTab('edit');
        popup.success("Modello originario caricato correttamente. Sincronizzato con il database.");
      },
      "Carica Modello Originario"
    );
  };

  const clearEditor = () => {
    popup.confirm(
      "Sei sicuro di voler svuotare interamente questo testo? Se lo salverai vuoto, il portale utilizzerà la policy standard automatica.",
      () => {
        onChange("");
        setActiveTab('edit');
      },
      "Svuota Editor"
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col gap-0">
      
      {/* Editor Header & Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            {label}
          </label>
          {description && (
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
              {description}
            </span>
          )}
        </div>

        {/* Mode Toggles */}
        <div className="flex border border-slate-200 rounded-lg p-0.5 bg-white shadow-xs self-end">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'edit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Edit2 className="h-3 w-3" /> Scrittura / Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'preview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Eye className="h-3 w-3" /> Anteprima Live
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      {activeTab === 'edit' && (
        <div className="bg-white border-b border-slate-100 p-2 flex flex-wrap items-center gap-1 justify-between">
          
          {/* Style Modifiers */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              title="Grassetto"
              onClick={() => handleInsertStyle('**', '**')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Corsivo"
              onClick={() => handleInsertStyle('*', '*')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            
            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              title="Titolo Grande H1"
              onClick={() => handleInsertStyle('# ')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all font-black text-xs"
            >
              H1
            </button>
            <button
              type="button"
              title="Titolo Medio H2"
              onClick={() => handleInsertStyle('## ')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all font-black text-xs"
            >
              H2
            </button>
            <button
              type="button"
              title="Titolo Piccolo H3"
              onClick={() => handleInsertStyle('### ')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all font-black text-xs"
            >
              H3
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              title="Elenco Puntato"
              onClick={() => handleInsertStyle('• ')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Inserisci Collegamento IPERTESTUALE"
              onClick={handleInsertLink}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
            >
              <Link className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sourcing Templates / Action tools */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadDefaultTemplate}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100/50 transition-all cursor-pointer"
            >
              <FileClock className="h-3 w-3 text-emerald-600" /> Carica Modello Default
            </button>
            <button
              type="button"
              title="Cancella tutto"
              onClick={clearEditor}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* Editor Body Area */}
      <div className="min-h-[320px] bg-slate-50/50 relative">
        {activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            placeholder={placeholder || "Scrivi il testo qui, supporta la formattazione avanzata..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[320px] p-5 bg-white text-xs font-semibold text-slate-700 font-mono leading-relaxed outline-none border-0 focus:ring-0 focus:outline-none resize-y"
          />
        ) : (
          <div className="p-6 md:p-8 bg-white min-h-[320px] max-h-[500px] overflow-y-auto border-0 text-slate-800 prose select-none">
            {value ? (
              <div className="space-y-4">
                {parseMarkdownToReact(value)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center gap-2">
                <HelpCircle className="h-10 w-10 text-slate-300 animate-bounce" />
                <p className="text-xs font-bold uppercase tracking-wider">Nessun Testo Personalizzato</p>
                <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                  Il portale mostrerà l'informativa legale conforme al GDPR ministeriale standard di default. Clicca su "Carica Modello Default" per iniziare.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Micro Status Bar */}
      <div className="bg-slate-50 border-t border-slate-150 px-5 py-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
        <span>Stato: {value ? 'Contenuto personalizzato' : 'Nessuna personalizzazione (Modello Standard)'}</span>
        <span>Caratteri: {value.length} | Righe: {value.split('\n').length}</span>
      </div>

    </div>
  );
}
