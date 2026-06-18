import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  dyslexicFont: boolean;
  reducedMotion: boolean;
  textToSpeech: boolean;

  // Sienna Profiles
  profileEpilepsy: boolean;
  profileBlind: boolean;
  profileVisuallyImpaired: boolean;
  profileAdhd: boolean;
  profileCognitive: boolean;
  profileMotor: boolean;

  // Content adjustments
  fontSizePercent: number; // 80 - 200
  fontWeightBold: boolean;
  lineHeightLarge: boolean;
  letterSpacingLarge: boolean;
  highlightLinks: boolean;
  highlightTitles: boolean;

  // Visual & Navigation aids
  superFocus: boolean;
  pdfReader: boolean;
  largeCursor: boolean;
  readingGuide: boolean;
  pageStructure: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
}

export const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  dyslexicFont: false,
  reducedMotion: false,
  textToSpeech: false,

  profileEpilepsy: false,
  profileBlind: false,
  profileVisuallyImpaired: false,
  profileAdhd: false,
  profileCognitive: false,
  profileMotor: false,

  fontSizePercent: 100,
  fontWeightBold: false,
  lineHeightLarge: false,
  letterSpacingLarge: false,
  highlightLinks: false,
  highlightTitles: false,

  superFocus: false,
  pdfReader: false,
  largeCursor: false,
  readingGuide: false,
  pageStructure: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default settings are merged for backwards compatibility
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error("Error reading saved accessibility settings:", e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    const root = document.documentElement;

    // Apply profiles
    root.classList.toggle('high-contrast', settings.highContrast || settings.profileVisuallyImpaired);
    root.classList.toggle('large-text', settings.largeText || settings.fontSizePercent > 110);
    root.classList.toggle('dyslexic-font', settings.dyslexicFont || settings.profileCognitive);
    root.classList.toggle('reduced-motion', settings.reducedMotion || settings.profileEpilepsy);

    // Apply specific classes for Content Adjustments
    root.classList.toggle('accessibility-epilepsy-safe', settings.profileEpilepsy);
    root.classList.toggle('accessibility-blind', settings.profileBlind);
    root.classList.toggle('accessibility-adhd', settings.profileAdhd);
    root.classList.toggle('accessibility-motor', settings.profileMotor);
    root.classList.toggle('accessibility-bold', settings.fontWeightBold);
    root.classList.toggle('accessibility-line-height', settings.lineHeightLarge);
    root.classList.toggle('accessibility-letter-spacing', settings.letterSpacingLarge);
    root.classList.toggle('accessibility-highlight-links', settings.highlightLinks);
    root.classList.toggle('accessibility-highlight-titles', settings.highlightTitles);
    root.classList.toggle('accessibility-super-focus', settings.superFocus);
    root.classList.toggle('accessibility-large-cursor', settings.largeCursor);

    // Dynamic Font Size setting
    if (settings.fontSizePercent && settings.fontSizePercent !== 100) {
      root.style.fontSize = `${settings.fontSizePercent}%`;
    } else {
      root.style.removeProperty('font-size');
    }

  }, [settings]);

  // Read aloud feature (TTS on hover) for reader profiles or manual settings
  useEffect(() => {
    if (!settings.textToSpeech && !settings.profileBlind) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Select readable elements
      const readableTags = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LI', 'LABEL'];
      if (!readableTags.includes(target.tagName)) return;
      
      const text = target.innerText?.trim();
      if (!text || text.length < 2) return;

      // Avoid reading giant parent container texts
      if (target.children.length > 2) return;

      // Stop previous utterance
      window.speechSynthesis?.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      utterance.rate = 1.0;
      window.speechSynthesis?.speak(utterance);
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      window.speechSynthesis?.cancel();
    };
  }, [settings.textToSpeech, settings.profileBlind]);

  // Reading Guide mouse tracking
  useEffect(() => {
    if (!settings.readingGuide) {
      const existing = document.getElementById('accessibility-read-guide');
      if (existing) existing.remove();
      return;
    }

    let guide = document.getElementById('accessibility-read-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'accessibility-read-guide';
      guide.style.position = 'fixed';
      guide.style.left = '0';
      guide.style.right = '0';
      guide.style.height = '4px';
      guide.style.backgroundColor = '#ef4444'; // Red guide bar
      guide.style.pointerEvents = 'none';
      guide.style.zIndex = '99999';
      guide.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.8)';
      document.body.appendChild(guide);
    }

    const mouseMove = (e: MouseEvent) => {
      if (guide) {
        guide.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', mouseMove);
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      const existing = document.getElementById('accessibility-read-guide');
      if (existing) existing.remove();
    };
  }, [settings.readingGuide]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      
      // Auto toggle dependent options for specific profiles to enhance experience
      if (newSettings.profileEpilepsy === true) {
        merged.reducedMotion = true;
      }
      if (newSettings.profileVisuallyImpaired === true) {
        merged.highContrast = true;
        if (merged.fontSizePercent < 130) merged.fontSizePercent = 130;
      }
      if (newSettings.profileCognitive === true) {
        merged.dyslexicFont = true;
      }
      if (newSettings.profileBlind === true) {
        merged.textToSpeech = true;
      }

      return merged;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    // Explicitly clean document element styles
    document.documentElement.style.removeProperty('font-size');
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
