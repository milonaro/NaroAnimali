import { Segnalazione } from '../types';

const CACHE_KEY = 'naro_animali_pending_reports';

export interface CachedReport {
  id: string;
  data: Partial<Segnalazione> & { lat: number; lng: number; fotoUrl: string; indirizzo: string };
  timestamp: number;
}

export const OfflineStore = {
  save: (report: CachedReport['data']) => {
    const cached = OfflineStore.getAll();
    const newReport: CachedReport = {
      id: crypto.randomUUID(),
      data: report,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify([...cached, newReport]));
    return newReport.id;
  },

  getAll: (): CachedReport[] => {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  },

  remove: (id: string) => {
    const cached = OfflineStore.getAll();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached.filter(r => r.id !== id)));
  },

  clear: () => {
    localStorage.removeItem(CACHE_KEY);
  }
};
