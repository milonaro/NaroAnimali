import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PopupOptions } from '../lib/popup';

export default function GlobalPopupModal() {
  const [activePopup, setActivePopup] = useState<PopupOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowPopup = (event: Event) => {
      const customEvent = event as CustomEvent<PopupOptions>;
      setActivePopup(customEvent.detail);
      setIsOpen(true);
    };

    window.addEventListener("show-global-popup", handleShowPopup);
    return () => {
      window.removeEventListener("show-global-popup", handleShowPopup);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (activePopup?.onCancel) {
      activePopup.onCancel();
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (activePopup?.onConfirm) {
      activePopup.onConfirm();
    }
  };

  if (!activePopup) return null;

  const { title, message, type = 'info', confirmLabel = 'Ok', cancelLabel } = activePopup;

  // Choose colors/icons based on type
  let icon = <Info className="h-6 w-6 text-blue-500" />;
  let headerColor = "text-[#1e3a5f]";
  let iconBg = "bg-blue-50";
  let primaryBtnClass = "bg-[#1e3a5f] hover:bg-[#152e4d]";

  if (type === 'success') {
    icon = <CheckCircle2 className="h-6 w-6 text-emerald-600" />;
    headerColor = "text-emerald-800";
    iconBg = "bg-emerald-50";
    primaryBtnClass = "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10";
  } else if (type === 'error') {
    icon = <AlertCircle className="h-6 w-6 text-rose-600" />;
    headerColor = "text-rose-800";
    iconBg = "bg-rose-50";
    primaryBtnClass = "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/10";
  } else if (type === 'warning') {
    icon = <AlertTriangle className="h-6 w-6 text-amber-600" />;
    headerColor = "text-[#1e3a5f]";
    iconBg = "bg-amber-50";
    primaryBtnClass = "bg-[#15803d] hover:bg-[#166534] shadow-md shadow-emerald-500/10";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="global_popup_root" className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 relative z-10 overflow-hidden"
          >
            {/* Header / Type Accent */}
            <div className="flex gap-4 items-start text-left mb-4">
              <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className={`text-base font-black uppercase tracking-wider ${headerColor}`}>
                  {title || "Avviso"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              {cancelLabel && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${primaryBtnClass}`}
              >
                {confirmLabel}
              </button>
            </div>

            {/* Small X Close button on top right */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-50 rounded-lg"
              title="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
