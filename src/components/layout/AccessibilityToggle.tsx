import React, { useState } from 'react';
import { Accessibility, X, Type, Contrast, Eye, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility } from '@/src/contexts/AccessibilityContext';

export default function AccessibilityToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useAccessibility();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-2"
        aria-label="Impostazioni accessibilità"
      >
        <Accessibility className="h-5 w-5" />
        <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Accessibilità</span>
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
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
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-[10px]">Contrasto Elevato</span>
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
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-[10px]">Testo Ingrandito</span>
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
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-[10px]">Font Leggibile</span>
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
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-[10px]">Riduci Movimento</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.reducedMotion ? 'bg-[#15803d]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.reducedMotion ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
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
