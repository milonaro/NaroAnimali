import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

export default function Lightbox({ isOpen, imageUrl, onClose, title }: LightboxProps) {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
  };

  React.useEffect(() => {
    if (!isOpen) {
      resetTransform();
    }
  }, [isOpen]);

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
              <div className="text-white">
                {title && <h3 className="text-xl font-bold tracking-tight">{title}</h3>}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setRotation(prev => prev + 90)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="Rotate"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors ml-4"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Image container */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <motion.img
                src={imageUrl}
                alt={title || "Viewer"}
                style={{ 
                  scale, 
                  rotate: `${rotation}deg`,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
              />
            </div>

            {/* Footer hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] pointer-events-none">
              Click fuori per chiudere
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
