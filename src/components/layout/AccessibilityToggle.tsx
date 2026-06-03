import React, { useState } from 'react';
import { Accessibility, X, Type, Contrast, Eye, Move, Volume2, HelpCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility } from '@/src/contexts/AccessibilityContext';
import { Link } from 'react-router-dom';

export default function AccessibilityToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useAccessibility();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 pr-4 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 flex items-center gap-3 group"
        aria-label="Strumenti di accessibilità e guida"
      >
        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
          <Accessibility className="h-4 w-4 text-[#101b3a]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#101b3a]">Accessibilità & Guida</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 bottom-full mb-3 w-80 bg-white border border-gray-100 rounded-lg shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2">
                  <Accessibility className="h-4 w-4" /> Strumenti AGID
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Contrast className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Contrasto Elevato</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.highContrast ? 'bg-[#15803d]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.highContrast ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Type className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Testo Ingrandito</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ largeText: !settings.largeText })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.largeText ? 'bg-[#15803d]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.largeText ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Font Leggibile</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ dyslexicFont: !settings.dyslexicFont })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.dyslexicFont ? 'bg-[#15803d]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.dyslexicFont ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Move className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Riduci Movimento</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.reducedMotion ? 'bg-[#15803d]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.reducedMotion ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sintesi Vocale</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ textToSpeech: !settings.textToSpeech })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.textToSpeech ? 'bg-[#15803d]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.textToSpeech ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-emerald-50/50 border-t border-gray-50">
                <Link 
                  to="/guida" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform">
                      <HelpCircle className="h-4 w-4 text-[#15803d]" />
                    </div>
                    <span className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest">Apri Guida</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-300" />
                </Link>
              </div>

              <div className="p-4 bg-gray-50 flex items-center justify-center">
                <button
                  onClick={resetSettings}
                  className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] hover:text-[#15803d] transition-colors"
                >
                  Ripristina Default
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
